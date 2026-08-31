const pool = require('../config/db');

/**
 * 数据统计服务层（成员5）
 * 提供：销量统计、订单统计、营收统计、热门商品统计
 * 统计口径：仅统计“有效订单”（已支付/已成团/配送/完成），排除 待付款(0) 与 已取消(5)
 */

// 有效订单状态集合（用于统计过滤）
const VALID_STATUS = '(1,2,3,4)';

/**
 * 销量统计
 * 返回：总销量件数、总销售额、周期维度（按日）
 */
async function salesStatistics(params) {
    const { start, end } = params;
    const dateCond = buildDateCondition('o.create_time', start, end);

    const [summary] = await pool.query(
        `SELECT COUNT(DISTINCT o.id) as order_count,
                SUM(oi.quantity) as total_quantity,
                SUM(oi.quantity * oi.price) as total_sales
         FROM \`order\` o
         JOIN order_item oi ON oi.order_id = o.id
         WHERE o.status IN ${VALID_STATUS} ${dateCond.sql}`,
        dateCond.values
    );

    const [byDay] = await pool.query(
        `SELECT DATE(o.create_time) as day,
                SUM(oi.quantity) as quantity,
                SUM(oi.quantity * oi.price) as sales
         FROM \`order\` o
         JOIN order_item oi ON oi.order_id = o.id
         WHERE o.status IN ${VALID_STATUS} ${dateCond.sql}
         GROUP BY DATE(o.create_time)
         ORDER BY day`,
        dateCond.values
    );

    return {
        order_count: summary[0].order_count || 0,
        total_quantity: Number(summary[0].total_quantity || 0),
        total_sales: Number((summary[0].total_sales || 0).toFixed(2)),
        by_day: byDay.map(d => ({
            day: d.day,
            quantity: Number(d.quantity || 0),
            sales: Number((d.sales || 0).toFixed(2))
        }))
    };
}

/**
 * 订单统计
 * 返回：各状态订单数量分布、总订单数、环比增长（按日）
 */
async function orderStatistics(params) {
    const { start, end } = params;
    const dateCond = buildDateCondition('create_time', start, end);

    const [totalRows] = await pool.query(
        `SELECT COUNT(*) as total FROM \`order\` WHERE 1=1 ${dateCond.sql}`,
        dateCond.values
    );

    const [statusRows] = await pool.query(
        `SELECT status, COUNT(*) as count FROM \`order\`
         WHERE 1=1 ${dateCond.sql}
         GROUP BY status`,
        dateCond.values
    );

    const [byDay] = await pool.query(
        `SELECT DATE(create_time) as day, COUNT(*) as count
         FROM \`order\` WHERE 1=1 ${dateCond.sql}
         GROUP BY DATE(create_time) ORDER BY day`,
        dateCond.values
    );

    const statusMap = {};
    statusRows.forEach(r => { statusMap[r.status] = r.count; });

    return {
        total: totalRows[0].total,
        by_status: statusMap,
        by_day: byDay
    };
}

/**
 * 营收统计（按日营收趋势）
 */
async function revenueStatistics(params) {
    const { start, end } = params;
    const dateCond = buildDateCondition('create_time', start, end);

    const [rows] = await pool.query(
        `SELECT DATE(create_time) as day,
                SUM(total_amount) as revenue,
                COUNT(*) as order_count
         FROM \`order\`
         WHERE status IN ${VALID_STATUS} ${dateCond.sql}
         GROUP BY DATE(create_time)
         ORDER BY day`,
        dateCond.values
    );

    let totalRevenue = 0;
    rows.forEach(r => { totalRevenue += Number(r.revenue || 0); });

    return {
        total_revenue: Number(totalRevenue.toFixed(2)),
        by_day: rows.map(r => ({
            day: r.day,
            revenue: Number((r.revenue || 0).toFixed(2)),
            order_count: r.order_count
        }))
    };
}

/**
 * 热门商品统计（按销量/销售额排序 TOP N）
 */
async function hotProducts(params) {
    const { limit = 10, start, end } = params;
    const dateCond = buildDateCondition('o.create_time', start, end);

    const [rows] = await pool.query(
        `SELECT oi.product_id,
                oi.product_name,
                oi.product_image,
                SUM(oi.quantity) as sold_count,
                SUM(oi.quantity * oi.price) as sales_amount
         FROM order_item oi
         JOIN \`order\` o ON oi.order_id = o.id
         WHERE o.status IN ${VALID_STATUS} ${dateCond.sql}
         GROUP BY oi.product_id, oi.product_name, oi.product_image
         ORDER BY sold_count DESC, sales_amount DESC
         LIMIT ?`,
        [...dateCond.values, parseInt(limit)]
    );

    return rows.map((r, idx) => ({
        rank: idx + 1,
        product_id: r.product_id,
        product_name: r.product_name,
        product_image: r.product_image,
        sold_count: Number(r.sold_count || 0),
        sales_amount: Number((r.sales_amount || 0).toFixed(2))
    }));
}

/**
 * 总览（管理后台首页看板）：汇聚四项统计
 */
async function overview(params) {
    const sales = await salesStatistics(params);
    const orders = await orderStatistics(params);
    const revenue = await revenueStatistics(params);
    const hot = await hotProducts({ ...params, limit: 5 });
    return {
        sales,
        orders,
        revenue,
        hot_products: hot
    };
}

// 构造日期区间条件（防注入：仅接收已校验的字符串）
function buildDateCondition(field, start, end) {
    let sql = '';
    const values = [];
    if (start) {
        sql += ` AND ${field} >= ?`;
        values.push(start);
    }
    if (end) {
        sql += ` AND ${field} <= ?`;
        values.push(end);
    }
    return { sql, values };
}

module.exports = {
    salesStatistics,
    orderStatistics,
    revenueStatistics,
    hotProducts,
    overview
};
