const pool = require('../config/db');

/**
 * 获取分类列表（前端用，只返回启用的）
 */
async function getCategoryList(includeDisabled = false) {
    let sql = 'SELECT * FROM category';
    if (!includeDisabled) {
        sql += ' WHERE status = 1';
    }
    sql += ' ORDER BY sort ASC, create_time DESC';
    const [categories] = await pool.query(sql);
    return categories;
}

/**
 * 新增分类
 */
async function addCategory(data) {
    const { name, icon, sort } = data;
    const [result] = await pool.query(
        'INSERT INTO category (name, icon, sort) VALUES (?, ?, ?)',
        [name, icon || '', sort || 0]
    );
    return { id: result.insertId };
}

/**
 * 编辑分类
 */
async function updateCategory(categoryId, data) {
    const { name, icon, sort } = data;
    const [result] = await pool.query(
        'UPDATE category SET name = ?, icon = ?, sort = ? WHERE id = ?',
        [name, icon || '', sort || 0, categoryId]
    );
    if (result.affectedRows === 0) {
        throw new Error('分类不存在');
    }
    return { id: categoryId };
}

/**
 * 删除分类
 */
async function deleteCategory(categoryId) {
    // 检查分类下是否有商品
    const [products] = await pool.query('SELECT COUNT(*) as count FROM product WHERE category_id = ?', [categoryId]);
    if (products[0].count > 0) {
        throw new Error('该分类下存在商品，无法删除');
    }
    const [result] = await pool.query('DELETE FROM category WHERE id = ?', [categoryId]);
    if (result.affectedRows === 0) {
        throw new Error('分类不存在');
    }
    return { success: true };
}

/**
 * 启用/禁用分类
 */
async function toggleCategoryStatus(categoryId, status) {
    const [result] = await pool.query(
        'UPDATE category SET status = ? WHERE id = ?',
        [status, categoryId]
    );
    if (result.affectedRows === 0) {
        throw new Error('分类不存在');
    }
    return { success: true, status };
}

module.exports = {
    getCategoryList,
    addCategory,
    updateCategory,
    deleteCategory,
    toggleCategoryStatus
};
