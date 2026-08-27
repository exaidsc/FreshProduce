const pool = require('../config/db');

/**
 * 商品列表（分页 + 分类筛选 + 关键词搜索）
 */
async function getProductList(params) {
    const { page = 1, size = 10, category_id, keyword, status } = params;
    const offset = (page - 1) * size;

    let where = 'WHERE 1=1';
    const values = [];

    if (category_id) {
        where += ' AND p.category_id = ?';
        values.push(category_id);
    }
    if (keyword) {
        where += ' AND p.name LIKE ?';
        values.push('%' + keyword + '%');
    }
    if (status !== undefined && status !== '') {
        where += ' AND p.status = ?';
        values.push(status);
    }

    // 查询总数
    const [countResult] = await pool.query(
        `SELECT COUNT(*) as total FROM product p ${where}`,
        values
    );

    // 查询分页数据
    const [products] = await pool.query(
        `SELECT p.*, c.name as category_name 
         FROM product p 
         LEFT JOIN category c ON p.category_id = c.id 
         ${where} 
         ORDER BY p.create_time DESC 
         LIMIT ? OFFSET ?`,
        [...values, parseInt(size), parseInt(offset)]
    );

    return {
        list: products,
        total: countResult[0].total,
        page: parseInt(page),
        size: parseInt(size)
    };
}

/**
 * 商品详情
 */
async function getProductDetail(productId) {
    const [products] = await pool.query(
        `SELECT p.*, c.name as category_name 
         FROM product p 
         LEFT JOIN category c ON p.category_id = c.id 
         WHERE p.id = ?`,
        [productId]
    );
    if (products.length === 0) {
        throw new Error('商品不存在');
    }
    return products[0];
}

/**
 * 新增商品
 */
async function addProduct(data) {
    const { category_id, name, price, group_price, stock, image, images, description, unit } = data;
    const [result] = await pool.query(
        `INSERT INTO product (category_id, name, price, group_price, stock, image, images, description, unit) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [category_id, name, price, group_price || price, stock || 0, image || '', images || '[]', description || '', unit || '份']
    );
    return { id: result.insertId };
}

/**
 * 编辑商品
 */
async function updateProduct(productId, data) {
    const { category_id, name, price, group_price, stock, image, images, description, unit } = data;
    const [result] = await pool.query(
        `UPDATE product SET category_id = ?, name = ?, price = ?, group_price = ?, stock = ?, 
         image = ?, images = ?, description = ?, unit = ? WHERE id = ?`,
        [category_id, name, price, group_price || price, stock, image || '', images || '[]', description || '', unit || '份', productId]
    );
    if (result.affectedRows === 0) {
        throw new Error('商品不存在');
    }
    return { id: productId };
}

/**
 * 删除商品
 */
async function deleteProduct(productId) {
    const [result] = await pool.query('DELETE FROM product WHERE id = ?', [productId]);
    if (result.affectedRows === 0) {
        throw new Error('商品不存在');
    }
    return { success: true };
}

/**
 * 商品上下架
 */
async function toggleProductStatus(productId, status) {
    const [result] = await pool.query(
        'UPDATE product SET status = ? WHERE id = ?',
        [status, productId]
    );
    if (result.affectedRows === 0) {
        throw new Error('商品不存在');
    }
    return { success: true, status };
}

/**
 * 修改库存
 */
async function updateStock(productId, stock) {
    if (stock < 0) {
        throw new Error('库存不能为负数');
    }
    const [result] = await pool.query(
        'UPDATE product SET stock = ? WHERE id = ?',
        [stock, productId]
    );
    if (result.affectedRows === 0) {
        throw new Error('商品不存在');
    }
    return { success: true, stock };
}

module.exports = {
    getProductList,
    getProductDetail,
    addProduct,
    updateProduct,
    deleteProduct,
    toggleProductStatus,
    updateStock
};
