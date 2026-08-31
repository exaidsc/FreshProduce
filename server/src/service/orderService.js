const pool = require('../config/db');

/**
 * 订单服务层（成员5）
 * 核心能力：
 *  1. 订单主表 + 订单明细表 双表联动
 *  2. 完整订单状态流转（后端强制管控，见 STATUS_FLOW）
 *  3. 下单事务：保证“减库存 + 生成订单 + 明细 + 清购物车”数据一致性
 *  4. 取消订单库存回补
 *  5. 异常订单处理（超时未支付自动取消回补库存）
 */

// 订单状态枚举（与数据库字典保持一致）
const ORDER_STATUS = {
    PENDING_PAY: 0,   // 待付款
    PENDING_GROUP: 1, // 待成团
    PENDING_DELIVER: 2, // 待配送
    DELIVERING: 3,    // 配送中
    FINISHED: 4,      // 已完成
    CANCELLED: 5      // 已取消
};

// 状态文本
const STATUS_TEXT = {
    0: '待付款',
    1: '待成团',
    2: '待配送',
    3: '配送中',
    4: '已完成',
    5: '已取消'
};

/**
 * 订单状态流转白名单（后端强制管控，前端无法越权修改）
 * key = 当前状态，value = 允许流转到的目标状态集合
 */
const STATUS_FLOW = {
    0: [1, 2, 5],  // 待付款 -> 支付(团购1/普通2) 或 取消5
    1: [2, 5],     // 待成团 -> 成团发货2 或 取消5
    2: [3, 5],     // 待配送 -> 配送中3 或 取消5
    3: [4],        // 配送中 -> 已完成4
    4: [],         // 已完成（终态）
    5: []          // 已取消（终态）
};

function canTransition(from, to) {
    return (STATUS_FLOW[from] || []).includes(to);
}

// 生成订单号：日期 + 随机
function genOrderNo() {
    const d = new Date();
    const pad = n => String(n).padStart(2, '0');
    const date = `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
    const rand = Math.floor(Math.random() * 9000 + 1000);
    return `NO${date}${rand}`;
}

/**
 * 用户端下单
 * payload: { address_id, items:[{product_id, quantity}], activity_id?, remark?, cart_ids? }
 * 整个流程在数据库事务中完成，保证数据一致性。
 */
async function createOrder(userId, payload) {
    const { address_id, items, activity_id, remark, cart_ids } = payload;

    if (!address_id) throw new Error('收货地址不能为空');
    if (!items || !Array.isArray(items) || items.length === 0) {
        throw new Error('订单商品不能为空');
    }

    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();

        // 1. 校验收货地址归属
        const [addr] = await conn.query(
            'SELECT id FROM address WHERE id = ? AND user_id = ?',
            [address_id, userId]
        );
        if (addr.length === 0) throw new Error('收货地址不存在');

        // 2. 若指定团购活动，加锁校验活动有效性
        let activity = null;
        if (activity_id) {
            const [acts] = await conn.query(
                'SELECT * FROM group_activity WHERE id = ? FOR UPDATE',
                [activity_id]
            );
            if (acts.length === 0) throw new Error('团购活动不存在');
            activity = acts[0];
            if (activity.status !== 1) throw new Error('团购活动已结束');
        }

        // 3. 逐商品加锁（SELECT ... FOR UPDATE）校验库存并快照
        const orderItems = [];
        let totalAmount = 0;
        for (const it of items) {
            const pid = it.product_id;
            const qty = parseInt(it.quantity);
            if (!pid || !qty || qty < 1) throw new Error('商品参数不合法');

            const [prods] = await conn.query(
                'SELECT * FROM product WHERE id = ? FOR UPDATE',
                [pid]
            );
            if (prods.length === 0) throw new Error(`商品不存在: ${pid}`);
            const p = prods[0];
            if (p.status !== 1) throw new Error(`商品已下架: ${p.name}`);
            if (p.stock < qty) throw new Error(`库存不足: ${p.name}`);

            // 成交单价：团购活动商品使用团购价，否则原价
            let unitPrice = p.price;
            if (activity && activity.product_id === pid) {
                unitPrice = activity.group_price;
            }

            // 4. 下单即减库存（核心一致性点）
            await conn.query(
                'UPDATE product SET stock = stock - ? WHERE id = ?',
                [qty, pid]
            );
            // 同步累加销量（支付成功后再确认，这里预占，取消时回滚）
            await conn.query(
                'UPDATE product SET sales = sales + ? WHERE id = ?',
                [qty, pid]
            );

            orderItems.push({
                product_id: pid,
                product_name: p.name,
                product_image: p.image,
                price: unitPrice,
                quantity: qty
            });
            totalAmount += unitPrice * qty;
        }

        // 5. 插入订单主表（初始状态：待付款；库存已扣，等待支付）
        const orderNo = genOrderNo();
        const [orderRes] = await conn.query(
            `INSERT INTO \`order\` (order_no, user_id, address_id, activity_id, total_amount, status, remark)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [orderNo, userId, address_id, activity_id || null, Number(totalAmount.toFixed(2)), ORDER_STATUS.PENDING_PAY, remark || '']
        );
        const orderId = orderRes.insertId;

        // 6. 批量插入订单明细表
        for (const oi of orderItems) {
            await conn.query(
                `INSERT INTO order_item (order_id, product_id, product_name, product_image, price, quantity)
                 VALUES (?, ?, ?, ?, ?, ?)`,
                [orderId, oi.product_id, oi.product_name, oi.product_image, oi.price, oi.quantity]
            );
        }

        // 7. 清空已下单的购物车记录（若前端带 cart_ids）
        if (Array.isArray(cart_ids) && cart_ids.length > 0) {
            await conn.query('DELETE FROM cart WHERE user_id = ? AND id IN (?)', [userId, cart_ids]);
        }

        await conn.commit();

        return {
            order_id: orderId,
            order_no: orderNo,
            total_amount: Number(totalAmount.toFixed(2)),
            status: ORDER_STATUS.PENDING_PAY,
            status_text: STATUS_TEXT[ORDER_STATUS.PENDING_PAY]
        };
    } catch (err) {
        await conn.rollback();
        throw err;
    } finally {
        conn.release();
    }
}

/**
 * 支付订单：待付款(0) -> 待成团(1) / 待配送(2)
 * 团购活动订单额外写入参团记录并累加参团人数
 */
async function payOrder(orderId, userId) {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();

        const [orders] = await conn.query(
            'SELECT * FROM `order` WHERE id = ? AND user_id = ? FOR UPDATE',
            [orderId, userId]
        );
        if (orders.length === 0) throw new Error('订单不存在');
        const order = orders[0];
        if (order.status !== ORDER_STATUS.PENDING_PAY) {
            throw new Error(`订单状态为「${STATUS_TEXT[order.status]}」，无法支付`);
        }

        const nextStatus = order.activity_id ? ORDER_STATUS.PENDING_GROUP : ORDER_STATUS.PENDING_DELIVER;
        await conn.query(
            'UPDATE `order` SET status = ?, pay_time = NOW() WHERE id = ?',
            [nextStatus, orderId]
        );

        // 团购订单写入参团记录
        if (order.activity_id) {
            const [joins] = await conn.query(
                'SELECT id FROM group_join WHERE activity_id = ? AND user_id = ? AND order_id = ?',
                [order.activity_id, userId, orderId]
            );
            if (joins.length === 0) {
                await conn.query(
                    'INSERT INTO group_join (activity_id, user_id, order_id) VALUES (?, ?, ?)',
                    [order.activity_id, userId, orderId]
                );
                await conn.query(
                    'UPDATE group_activity SET current_people = current_people + 1 WHERE id = ?',
                    [order.activity_id]
                );
            }
        }

        await conn.commit();
        return { order_id: parseInt(orderId), status: nextStatus, status_text: STATUS_TEXT[nextStatus] };
    } catch (err) {
        await conn.rollback();
        throw err;
    } finally {
        conn.release();
    }
}

/**
 * 取消订单 + 库存回补（核心容错）
 * 允许从 待付款(0) / 待成团(1) / 待配送(2) 取消
 * 回补逻辑：把下单时扣减的库存、累加的销量退回
 */
async function cancelOrder(orderId, userId, isAdmin = false) {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();

        const [orders] = await conn.query(
            'SELECT * FROM `order` WHERE id = ?' + (isAdmin ? '' : ' AND user_id = ?') + ' FOR UPDATE',
            isAdmin ? [orderId] : [orderId, userId]
        );
        if (orders.length === 0) throw new Error('订单不存在');
        const order = orders[0];

        if (!canTransition(order.status, ORDER_STATUS.CANCELLED)) {
            throw new Error(`订单状态为「${STATUS_TEXT[order.status]}」，无法取消`);
        }

        // 回补库存与销量：遍历明细，加回商品表
        const [items] = await conn.query(
            'SELECT product_id, quantity FROM order_item WHERE order_id = ?',
            [orderId]
        );
        for (const it of items) {
            await conn.query(
                'UPDATE product SET stock = stock + ?, sales = sales - ? WHERE id = ?',
                [it.quantity, it.quantity, it.product_id]
            );
        }

        // 若是已支付的团购订单，移除参团记录并回退参团人数
        if (order.status === ORDER_STATUS.PENDING_GROUP && order.activity_id) {
            await conn.query(
                'DELETE FROM group_join WHERE activity_id = ? AND order_id = ?',
                [order.activity_id, orderId]
            );
            await conn.query(
                'UPDATE group_activity SET current_people = GREATEST(current_people - 1, 0) WHERE id = ?',
                [order.activity_id]
            );
        }

        await conn.query(
            'UPDATE `order` SET status = ?, cancel_time = NOW() WHERE id = ?',
            [ORDER_STATUS.CANCELLED, orderId]
        );

        await conn.commit();
        return { order_id: parseInt(orderId), status: ORDER_STATUS.CANCELLED, status_text: STATUS_TEXT[ORDER_STATUS.CANCELLED] };
    } catch (err) {
        await conn.rollback();
        throw err;
    } finally {
        conn.release();
    }
}

/**
 * 管理员强制变更订单状态（后端二次校验白名单）
 */
async function changeStatus(orderId, toStatus) {
    if (!STATUS_FLOW.hasOwnProperty(toStatus)) throw new Error('非法目标状态');
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();
        const [orders] = await conn.query('SELECT * FROM `order` WHERE id = ? FOR UPDATE', [orderId]);
        if (orders.length === 0) throw new Error('订单不存在');
        const order = orders[0];
        if (!canTransition(order.status, toStatus)) {
            throw new Error(`状态流转不被允许：「${STATUS_TEXT[order.status]}」→「${STATUS_TEXT[toStatus]}」`);
        }

        // 取消场景复用库存回补
        if (toStatus === ORDER_STATUS.CANCELLED) {
            const [items] = await conn.query('SELECT product_id, quantity FROM order_item WHERE order_id = ?', [orderId]);
            for (const it of items) {
                await conn.query('UPDATE product SET stock = stock + ?, sales = sales - ? WHERE id = ?', [it.quantity, it.quantity, it.product_id]);
            }
            if (order.status === ORDER_STATUS.PENDING_GROUP && order.activity_id) {
                await conn.query('DELETE FROM group_join WHERE activity_id = ? AND order_id = ?', [order.activity_id, orderId]);
                await conn.query('UPDATE group_activity SET current_people = GREATEST(current_people - 1, 0) WHERE id = ?', [order.activity_id]);
            }
        }

        let sql = 'UPDATE `order` SET status = ?';
        const vals = [toStatus];
        if (toStatus === ORDER_STATUS.DELIVERING) { sql += ', delivery_time = NOW()'; }
        if (toStatus === ORDER_STATUS.FINISHED) { sql += ', finish_time = NOW()'; }
        if (toStatus === ORDER_STATUS.CANCELLED) { sql += ', cancel_time = NOW()'; }
        sql += ' WHERE id = ?';
        vals.push(orderId);

        await conn.query(sql, vals);
        await conn.commit();
        return { order_id: parseInt(orderId), status: toStatus, status_text: STATUS_TEXT[toStatus] };
    } catch (err) {
        await conn.rollback();
        throw err;
    } finally {
        conn.release();
    }
}

/**
 * 订单列表（用户端/管理端共用，管理端不过滤 user_id）
 */
async function getOrderList(params) {
    const { userId, status, page = 1, size = 10, isAdmin = false } = params;
    const offset = (page - 1) * size;

    let where = 'WHERE 1=1';
    const values = [];
    if (!isAdmin && userId) {
        where += ' AND o.user_id = ?';
        values.push(userId);
    }
    if (status !== undefined && status !== '' && status !== null) {
        where += ' AND o.status = ?';
        values.push(status);
    }

    const [countRows] = await pool.query(
        `SELECT COUNT(*) as total FROM \`order\` o ${where}`, values
    );
    const [rows] = await pool.query(
        `SELECT o.*, u.nickname, u.phone
         FROM \`order\` o
         LEFT JOIN user u ON o.user_id = u.id
         ${where}
         ORDER BY o.create_time DESC
         LIMIT ? OFFSET ?`,
        [...values, parseInt(size), parseInt(offset)]
    );

    // 附带明细
    for (const o of rows) {
        const [items] = await pool.query('SELECT * FROM order_item WHERE order_id = ?', [o.id]);
        o.items = items;
        o.status_text = STATUS_TEXT[o.status];
    }

    return {
        list: rows,
        total: countRows[0].total,
        page: parseInt(page),
        size: parseInt(size)
    };
}

/**
 * 订单详情
 */
async function getOrderDetail(orderId, userId, isAdmin = false) {
    const [orders] = await pool.query(
        'SELECT * FROM `order` WHERE id = ?' + (isAdmin ? '' : ' AND user_id = ?'),
        isAdmin ? [orderId] : [orderId, userId]
    );
    if (orders.length === 0) throw new Error('订单不存在');
    const order = orders[0];
    const [items] = await pool.query('SELECT * FROM order_item WHERE order_id = ?', [orderId]);
    order.items = items;
    order.status_text = STATUS_TEXT[order.status];
    return order;
}

/**
 * 异常订单处理：自动取消超时未支付订单（默认 30 分钟）
 * 同时回补库存，避免库存被长期占用导致超卖。由定时任务调用。
 */
async function autoCancelExpiredOrders(expireMinutes = 30) {
    const conn = await pool.getConnection();
    let cancelled = 0;
    try {
        await conn.beginTransaction();
        const [expired] = await conn.query(
            `SELECT id FROM \`order\`
             WHERE status = ? AND create_time < DATE_SUB(NOW(), INTERVAL ? MINUTE)
             FOR UPDATE`,
            [ORDER_STATUS.PENDING_PAY, expireMinutes]
        );

        for (const ord of expired) {
            const [items] = await conn.query('SELECT product_id, quantity FROM order_item WHERE order_id = ?', [ord.id]);
            for (const it of items) {
                await conn.query('UPDATE product SET stock = stock + ?, sales = sales - ? WHERE id = ?', [it.quantity, it.quantity, it.product_id]);
            }
            await conn.query('UPDATE `order` SET status = ?, cancel_time = NOW() WHERE id = ?', [ORDER_STATUS.CANCELLED, ord.id]);
            cancelled++;
        }

        await conn.commit();
        return { cancelled };
    } catch (err) {
        await conn.rollback();
        throw err;
    } finally {
        conn.release();
    }
}

/**
 * 异常订单查询（管理端）：超时未支付 + 已取消 的订单
 */
async function getAbnormalOrders() {
    const [rows] = await pool.query(
        `SELECT o.*, u.nickname
         FROM \`order\` o
         LEFT JOIN user u ON o.user_id = u.id
         WHERE o.status = ? OR (o.status = ? AND o.create_time < DATE_SUB(NOW(), INTERVAL 30 MINUTE))
         ORDER BY o.create_time DESC`,
        [ORDER_STATUS.CANCELLED, ORDER_STATUS.PENDING_PAY]
    );
    rows.forEach(o => { o.status_text = STATUS_TEXT[o.status]; });
    return rows;
}

module.exports = {
    ORDER_STATUS,
    STATUS_TEXT,
    STATUS_FLOW,
    canTransition,
    createOrder,
    payOrder,
    cancelOrder,
    changeStatus,
    getOrderList,
    getOrderDetail,
    autoCancelExpiredOrders,
    getAbnormalOrders
};
