const pool = require('../config/db');

/**
 * 购物车服务层（成员5）
 * 负责购物车数据的增删改查与批量操作，所有写操作均校验归属用户。
 */

/**
 * 购物车列表（带商品信息）
 * 返回选中商品总价与数量，便于前端结算
 */
async function getCartList(userId) {
    const [rows] = await pool.query(
        `SELECT c.id, c.product_id, c.quantity, c.selected, c.create_time,
                p.name, p.price, p.group_price, p.image, p.stock, p.status as product_status, p.unit
         FROM cart c
         LEFT JOIN product p ON c.product_id = p.id
         WHERE c.user_id = ?
         ORDER BY c.create_time DESC`,
        [userId]
    );

    let selectedTotal = 0;
    let selectedCount = 0;
    rows.forEach(item => {
        const price = item.group_price > 0 ? item.group_price : item.price;
        if (item.selected === 1) {
            selectedTotal += price * item.quantity;
            selectedCount += item.quantity;
        }
    });

    return {
        list: rows,
        selectedTotal: Number(selectedTotal.toFixed(2)),
        selectedCount,
        total: rows.length
    };
}

/**
 * 加入购物车
 * 同一用户对同一商品采用“数量累加”而非重复插入（依赖唯一索引 uk_user_product）
 */
async function addCart(userId, productId, quantity) {
    if (!productId) throw new Error('商品ID不能为空');
    if (!quantity || quantity < 1) quantity = 1;

    const [prod] = await pool.query('SELECT id, status FROM product WHERE id = ?', [productId]);
    if (prod.length === 0) throw new Error('商品不存在');
    if (prod[0].status !== 1) throw new Error('商品已下架，无法加入购物车');

    const [exist] = await pool.query(
        'SELECT id, quantity FROM cart WHERE user_id = ? AND product_id = ?',
        [userId, productId]
    );

    if (exist.length > 0) {
        const newQty = exist[0].quantity + parseInt(quantity);
        await pool.query('UPDATE cart SET quantity = ? WHERE id = ?', [newQty, exist[0].id]);
        return { id: exist[0].id, quantity: newQty };
    }

    const [result] = await pool.query(
        'INSERT INTO cart (user_id, product_id, quantity, selected) VALUES (?, ?, ?, 1)',
        [userId, productId, quantity]
    );
    return { id: result.insertId, quantity: parseInt(quantity) };
}

/**
 * 修改购物车商品数量
 */
async function updateQuantity(cartId, userId, quantity) {
    if (!quantity || quantity < 1) throw new Error('数量必须大于0');

    const [rows] = await pool.query(
        'SELECT id FROM cart WHERE id = ? AND user_id = ?',
        [cartId, userId]
    );
    if (rows.length === 0) throw new Error('购物车记录不存在');

    await pool.query('UPDATE cart SET quantity = ? WHERE id = ?', [quantity, cartId]);
    return { id: parseInt(cartId), quantity: parseInt(quantity) };
}

/**
 * 删除购物车单条记录
 */
async function removeCart(cartId, userId) {
    const [result] = await pool.query(
        'DELETE FROM cart WHERE id = ? AND user_id = ?',
        [cartId, userId]
    );
    if (result.affectedRows === 0) throw new Error('购物车记录不存在');
    return { success: true };
}

/**
 * 批量删除购物车（ids 为购物车记录ID数组）
 */
async function batchRemove(userId, ids) {
    if (!Array.isArray(ids) || ids.length === 0) throw new Error('请选择要删除的购物车记录');
    const [result] = await pool.query(
        'DELETE FROM cart WHERE user_id = ? AND id IN (?)',
        [userId, ids]
    );
    return { success: true, deleted: result.affectedRows };
}

/**
 * 修改单条选中状态
 */
async function updateSelected(cartId, userId, selected) {
    const sel = selected === 1 ? 1 : 0;
    const [rows] = await pool.query('SELECT id FROM cart WHERE id = ? AND user_id = ?', [cartId, userId]);
    if (rows.length === 0) throw new Error('购物车记录不存在');
    await pool.query('UPDATE cart SET selected = ? WHERE id = ?', [sel, cartId]);
    return { id: parseInt(cartId), selected: sel };
}

/**
 * 批量修改选中状态（结算时全选/反选）
 */
async function batchUpdateSelected(userId, ids, selected) {
    const sel = selected === 1 ? 1 : 0;
    if (Array.isArray(ids) && ids.length > 0) {
        await pool.query('UPDATE cart SET selected = ? WHERE user_id = ? AND id IN (?)', [sel, userId, ids]);
    } else {
        // 不传 ids 视为修改该用户全部购物车
        await pool.query('UPDATE cart SET selected = ? WHERE user_id = ?', [sel, userId]);
    }
    return { success: true, selected: sel };
}

/**
 * 清空购物车（结算完成后调用）
 */
async function clearCart(userId, ids) {
    if (Array.isArray(ids) && ids.length > 0) {
        await pool.query('DELETE FROM cart WHERE user_id = ? AND id IN (?)', [userId, ids]);
    } else {
        await pool.query('DELETE FROM cart WHERE user_id = ?', [userId]);
    }
    return { success: true };
}

module.exports = {
    getCartList,
    addCart,
    updateQuantity,
    removeCart,
    batchRemove,
    updateSelected,
    batchUpdateSelected,
    clearCart
};
