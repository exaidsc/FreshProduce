const schedule = require('node-schedule');
const orderService = require('../service/orderService');

/**
 * 订单定时任务（成员5）
 * 每 5 分钟扫描一次超时未支付订单并自动取消、回补库存
 */
function startOrderScheduler() {
    // 每 5 分钟执行
    schedule.scheduleJob('*/5 * * * *', async () => {
        try {
            const result = await orderService.autoCancelExpiredOrders(30);
            if (result.cancelled > 0) {
                console.log(`[订单定时任务] 自动取消 ${result.cancelled} 笔超时未支付订单`);
            }
        } catch (err) {
            console.error('[订单定时任务] 执行失败:', err.message);
        }
    });
    console.log('⏰ 订单异常清理定时任务已启动（每5分钟）');
}

module.exports = { startOrderScheduler };
