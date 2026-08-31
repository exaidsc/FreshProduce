/**
 * 团购定时成团任务
 * 作者：成员4
 *
 * 功能说明：
 * 1. 每分钟扫描一次进行中的团购活动
 * 2. 已到截止时间的活动：判断人数是否达标，达标则成团，不达标则关闭
 * 3. 人数已达标的活动：立即成团（不用等截止时间）
 *
 * 业务规则：
 * - 成团：活动状态→已成团(2)，关联订单状态→待配送(2)
 * - 未成团：活动状态→未成团关闭(3)，关联订单状态→已取消(5)，库存回补
 *
 * 容错设计：
 * - 使用事务保证数据一致性
 * - 加状态标记防止重复处理
 * - 异常捕获+日志记录
 */

const schedule = require('node-schedule');
const pool = require('../config/db');

// 任务运行锁，防止上一次未执行完又触发新的执行
let isRunning = false;

/**
 * 处理单个活动的成团逻辑
 */
async function processActivity(activity) {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();

        // 再次查询活动状态并加行锁，防止并发处理
        const [lockActivities] = await conn.query(
            'SELECT * FROM group_activity WHERE id = ? AND status = 1 FOR UPDATE',
            [activity.id]
        );
        if (lockActivities.length === 0) {
            await conn.rollback();
            return { activityId: activity.id, action: 'skip', reason: '活动状态已变更' };
        }

        // 统计实际参团人数（从group_join表统计，不依赖current_people字段）
        const [joinCount] = await conn.query(
            'SELECT COUNT(DISTINCT user_id) as count FROM group_join WHERE activity_id = ?',
            [activity.id]
        );
        const actualPeople = joinCount[0].count;

        const isExpired = new Date(activity.end_time) <= new Date();
        const isReached = actualPeople >= activity.min_people;

        if (isReached) {
            // ========== 成团处理 ==========
            // 1. 更新活动状态为已成团
            await conn.query(
                'UPDATE group_activity SET status = 2, current_people = ? WHERE id = ?',
                [actualPeople, activity.id]
            );

            // 2. 更新关联订单状态为待配送
            await conn.query(
                'UPDATE `order` SET status = 2 WHERE activity_id = ? AND status = 1',
                [activity.id]
            );

            await conn.commit();
            console.log(`[成团成功] 活动ID: ${activity.id}, 参团人数: ${actualPeople}/${activity.min_people}`);
            return { activityId: activity.id, action: 'success', people: actualPeople };

        } else if (isExpired) {
            // ========== 未成团，超时关闭 ==========
            // 1. 更新活动状态为未成团关闭
            await conn.query(
                'UPDATE group_activity SET status = 3, current_people = ? WHERE id = ?',
                [actualPeople, activity.id]
            );

            // 2. 取消关联订单，状态改为已取消
            await conn.query(
                'UPDATE `order` SET status = 5, cancel_time = NOW() WHERE activity_id = ? AND status = 1',
                [activity.id]
            );

            // 3. 库存回补：查询这些订单的明细，把库存加回去
            const [orderItems] = await conn.query(
                `SELECT oi.product_id, SUM(oi.quantity) as total_qty
                 FROM order_item oi
                 INNER JOIN \`order\` o ON oi.order_id = o.id
                 WHERE o.activity_id = ? AND o.status = 5
                 GROUP BY oi.product_id`,
                [activity.id]
            );
            for (const item of orderItems) {
                await conn.query(
                    'UPDATE product SET stock = stock + ? WHERE id = ?',
                    [item.total_qty, item.product_id]
                );
            }

            await conn.commit();
            console.log(`[未成团关闭] 活动ID: ${activity.id}, 参团人数: ${actualPeople}/${activity.min_people}, 库存已回补`);
            return { activityId: activity.id, action: 'closed', people: actualPeople };

        } else {
            // 未到期且未达标，跳过
            await conn.rollback();
            return { activityId: activity.id, action: 'pending' };
        }

    } catch (err) {
        await conn.rollback();
        console.error(`[成团任务异常] 活动ID: ${activity.id}, 错误:`, err.message);
        return { activityId: activity.id, action: 'error', error: err.message };
    } finally {
        conn.release();
    }
}

/**
 * 定时任务主函数
 */
async function runGroupScheduler() {
    if (isRunning) {
        console.log('[成团任务] 上一次执行尚未完成，跳过本次执行');
        return;
    }

    isRunning = true;
    const startTime = new Date();
    console.log(`[成团任务] 开始执行 - ${startTime.toLocaleString()}`);

    try {
        // 查询所有进行中的活动
        const [activities] = await pool.query(
            `SELECT * FROM group_activity 
             WHERE status = 1 
             ORDER BY end_time ASC`
        );

        if (activities.length === 0) {
            console.log('[成团任务] 无进行中的团购活动');
            return;
        }

        console.log(`[成团任务] 发现 ${activities.length} 个进行中的活动，开始处理...`);

        // 逐个处理（串行，避免并发冲突）
        const results = [];
        for (const activity of activities) {
            const result = await processActivity(activity);
            results.push(result);
        }

        const successCount = results.filter(r => r.action === 'success').length;
        const closedCount = results.filter(r => r.action === 'closed').length;
        const pendingCount = results.filter(r => r.action === 'pending').length;

        const endTime = new Date();
        const duration = ((endTime - startTime) / 1000).toFixed(2);
        console.log(`[成团任务] 执行完成 - 耗时${duration}秒，成团:${successCount} 关闭:${closedCount} 待处理:${pendingCount}`);

    } catch (err) {
        console.error('[成团任务] 执行异常:', err.message);
    } finally {
        isRunning = false;
    }
}

/**
 * 启动定时任务
 * 每分钟执行一次（cron表达式：秒 分 时 日 月 周）
 */
function startGroupScheduler() {
    // 每分钟第0秒执行
    const job = schedule.scheduleJob('0 * * * * *', () => {
        runGroupScheduler();
    });

    console.log('✅ 团购定时成团任务已启动（每分钟执行一次）');

    // 启动后立即执行一次，检查是否有需要处理的活动
    setTimeout(() => {
        runGroupScheduler();
    }, 3000);

    return job;
}

module.exports = {
    startGroupScheduler,
    runGroupScheduler
};
