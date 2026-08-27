const pool = require('../config/db');

/**
 * 获取用户地址列表
 */
async function getAddressList(userId) {
    const [addresses] = await pool.query(
        'SELECT * FROM address WHERE user_id = ? ORDER BY is_default DESC, create_time DESC',
        [userId]
    );
    return addresses;
}

/**
 * 获取地址详情
 */
async function getAddressDetail(addressId, userId) {
    const [addresses] = await pool.query(
        'SELECT * FROM address WHERE id = ? AND user_id = ?',
        [addressId, userId]
    );
    if (addresses.length === 0) {
        throw new Error('地址不存在');
    }
    return addresses[0];
}

/**
 * 新增地址
 */
async function addAddress(userId, data) {
    const { name, phone, province, city, district, detail, is_default } = data;

    // 如果设为默认，先取消其他默认地址（用事务保证一致性）
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();

        if (is_default === 1) {
            await conn.query('UPDATE address SET is_default = 0 WHERE user_id = ?', [userId]);
        }

        const [result] = await conn.query(
            'INSERT INTO address (user_id, name, phone, province, city, district, detail, is_default) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [userId, name, phone, province, city, district, detail, is_default || 0]
        );

        await conn.commit();
        return { id: result.insertId };
    } catch (err) {
        await conn.rollback();
        throw err;
    } finally {
        conn.release();
    }
}

/**
 * 编辑地址
 */
async function updateAddress(addressId, userId, data) {
    const { name, phone, province, city, district, detail, is_default } = data;

    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();

        // 检查地址是否属于当前用户
        const [addresses] = await conn.query(
            'SELECT id FROM address WHERE id = ? AND user_id = ?',
            [addressId, userId]
        );
        if (addresses.length === 0) {
            throw new Error('地址不存在或无权操作');
        }

        // 如果设为默认，先取消其他默认
        if (is_default === 1) {
            await conn.query('UPDATE address SET is_default = 0 WHERE user_id = ? AND id != ?', [userId, addressId]);
        }

        await conn.query(
            'UPDATE address SET name = ?, phone = ?, province = ?, city = ?, district = ?, detail = ?, is_default = ? WHERE id = ?',
            [name, phone, province, city, district, detail, is_default || 0, addressId]
        );

        await conn.commit();
        return { id: addressId };
    } catch (err) {
        await conn.rollback();
        throw err;
    } finally {
        conn.release();
    }
}

/**
 * 删除地址
 */
async function deleteAddress(addressId, userId) {
    const [result] = await pool.query(
        'DELETE FROM address WHERE id = ? AND user_id = ?',
        [addressId, userId]
    );
    if (result.affectedRows === 0) {
        throw new Error('地址不存在或无权操作');
    }
    return { success: true };
}

/**
 * 设置默认地址
 */
async function setDefaultAddress(addressId, userId) {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();

        // 检查地址归属
        const [addresses] = await conn.query(
            'SELECT id FROM address WHERE id = ? AND user_id = ?',
            [addressId, userId]
        );
        if (addresses.length === 0) {
            throw new Error('地址不存在或无权操作');
        }

        // 取消所有默认
        await conn.query('UPDATE address SET is_default = 0 WHERE user_id = ?', [userId]);
        // 设置当前为默认
        await conn.query('UPDATE address SET is_default = 1 WHERE id = ?', [addressId]);

        await conn.commit();
        return { success: true };
    } catch (err) {
        await conn.rollback();
        throw err;
    } finally {
        conn.release();
    }
}

module.exports = {
    getAddressList,
    getAddressDetail,
    addAddress,
    updateAddress,
    deleteAddress,
    setDefaultAddress
};
