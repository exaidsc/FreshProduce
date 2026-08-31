const pool = require('../config/db');

/**
 * 团购活动列表（分页 + 状态筛选）
 */
async function getActivityList(params) {
    const { page = 1, size = 10, status, product_id } = params;
    const offset = (page - 1) * size;

    let where = 'WHERE 1=1';
    const values = [];

    if (status !== undefined && status !== '') {
        where += ' AND ga.status = ?';
        values.push(status);
    }
    if (product_id) {
        where += ' AND ga.product_id = ?';
        values.push(product_id);
    }

    // 总数
    const [countResult] = await pool.query(
        `SELECT COUNT(*) as total FROM group_activity ga ${where}`,
        values
    );

    // 分页数据，关联商品信息
    const [activities] = await pool.query(
        `SELECT ga.*, p.name as product_name, p.image as product_image, p.price as original_price
         FROM group_activity ga
         LEFT JOIN product p ON ga.product_id = p.id
         ${where}
         ORDER BY ga.create_time DESC
         LIMIT ? OFFSET ?`,
        [...values, parseInt(size), parseInt(offset)]
    );

    return {
        list: activities,
        total: countResult[0].total,
        page: parseInt(page),
        size: parseInt(size)
    };
}

/**
 * 活动详情
 */
async function getActivityDetail(activityId) {
    const [activities] = await pool.query(
        `SELECT ga.*, p.name as product_name, p.image as product_image, p.price as original_price, p.description, p.unit
         FROM group_activity ga
         LEFT JOIN product p ON ga.product_id = p.id
         WHERE ga.id = ?`,
        [activityId]
    );
    if (activities.length === 0) {
        throw new Error('团购活动不存在');
    }

    // 查询参团记录
    const [joins] = await pool.query(
        `SELECT gj.*, u.nickname, u.avatar
         FROM group_join gj
         LEFT JOIN user u ON gj.user_id = u.id
         WHERE gj.activity_id = ?
         ORDER BY gj.join_time DESC`,
        [activityId]
    );

    return {
        ...activities[0],
        join_list: joins
    };
}

/**
 * 创建团购活动
 */
async function addActivity(data) {
    const { product_id, group_price, min_people, start_time, end_time } = data;

    // 检查商品是否存在
    const [products] = await pool.query('SELECT id, stock FROM product WHERE id = ?', [product_id]);
    if (products.length === 0) {
        throw new Error('关联商品不存在');
    }

    const [result] = await pool.query(
        `INSERT INTO group_activity (product_id, group_price, min_people, current_people, start_time, end_time, status)
         VALUES (?, ?, ?, 0, ?, ?, 1)`,
        [product_id, group_price, min_people, start_time, end_time]
    );
    return { id: result.insertId };
}

/**
 * 编辑团购活动
 */
async function updateActivity(activityId, data) {
    const { product_id, group_price, min_people, start_time, end_time } = data;

    // 检查活动状态，进行中的活动不允许修改核心参数
    const [activities] = await pool.query('SELECT status FROM group_activity WHERE id = ?', [activityId]);
    if (activities.length === 0) {
        throw new Error('团购活动不存在');
    }
    if (activities[0].status === 2) {
        throw new Error('已成团的活动不允许修改');
    }

    const [result] = await pool.query(
        `UPDATE group_activity SET product_id = ?, group_price = ?, min_people = ?, start_time = ?, end_time = ?
         WHERE id = ?`,
        [product_id, group_price, min_people, start_time, end_time, activityId]
    );
    if (result.affectedRows === 0) {
        throw new Error('团购活动不存在');
    }
    return { id: activityId };
}

/**
 * 启停团购活动
 */
async function toggleActivityStatus(activityId, status) {
    const [activities] = await pool.query('SELECT status FROM group_activity WHERE id = ?', [activityId]);
    if (activities.length === 0) {
        throw new Error('团购活动不存在');
    }

    // 1进行中 4手动关闭
    let newStatus;
    if (status === 1) {
        newStatus = 1; // 重新开启
    } else if (status === 4) {
        newStatus = 4; // 手动关闭
    } else {
        throw new Error('状态值不合法');
    }

    const [result] = await pool.query(
        'UPDATE group_activity SET status = ? WHERE id = ?',
        [newStatus, activityId]
    );
    return { success: true, status: newStatus };
}

/**
 * 获取进行中的活动（用户端首页展示）
 */
async function getOngoingActivities() {
    const [activities] = await pool.query(
        `SELECT ga.*, p.name as product_name, p.image as product_image, p.price as original_price
         FROM group_activity ga
         LEFT JOIN product p ON ga.product_id = p.id
         WHERE ga.status = 1 AND ga.end_time > NOW()
         ORDER BY ga.create_time DESC
         LIMIT 10`
    );
    return activities;
}

module.exports = {
    getActivityList,
    getActivityDetail,
    addActivity,
    updateActivity,
    toggleActivityStatus,
    getOngoingActivities
};
