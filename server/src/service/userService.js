const pool = require('../config/db');
const axios = require('axios');
const { generateToken } = require('../utils/jwt');

/**
 * 微信登录：通过code换取openid，查/建用户，返回token
 */
async function wxLogin(code) {
    if (!code) {
        throw new Error('code不能为空');
    }

    // 调用微信接口换取openid
    let openid;
    try {
        const url = `https://api.weixin.qq.com/sns/jscode2session?appid=${process.env.WX_APPID}&secret=${process.env.WX_SECRET}&js_code=${code}&grant_type=authorization_code`;
        const response = await axios.get(url);
        if (response.data.errcode) {
            // 开发环境下，如果微信配置不对，用模拟openid
            if (process.env.NODE_ENV === 'development') {
                openid = 'dev_openid_' + code.substring(0, 10);
            } else {
                throw new Error('微信登录失败: ' + response.data.errmsg);
            }
        } else {
            openid = response.data.openid;
        }
    } catch (err) {
        // 开发环境降级：用code生成模拟openid
        if (process.env.NODE_ENV === 'development') {
            openid = 'dev_openid_' + code.substring(0, 10);
        } else {
            throw err;
        }
    }

    // 查询用户是否存在
    const [users] = await pool.query('SELECT * FROM user WHERE openid = ?', [openid]);
    let user;

    if (users.length > 0) {
        user = users[0];
        // 更新最后登录时间
        await pool.query('UPDATE user SET update_time = NOW() WHERE id = ?', [user.id]);
    } else {
        // 新建用户
        const [result] = await pool.query(
            'INSERT INTO user (openid, nickname, avatar) VALUES (?, ?, ?)',
            [openid, '微信用户', '']
        );
        const [newUsers] = await pool.query('SELECT * FROM user WHERE id = ?', [result.insertId]);
        user = newUsers[0];
    }

    // 生成JWT Token
    const token = generateToken({
        userId: user.id,
        openid: user.openid,
        nickname: user.nickname
    });

    return {
        token,
        userInfo: {
            id: user.id,
            nickname: user.nickname,
            avatar: user.avatar,
            phone: user.phone
        }
    };
}

/**
 * 获取用户信息
 */
async function getUserInfo(userId) {
    const [users] = await pool.query(
        'SELECT id, nickname, avatar, phone, create_time FROM user WHERE id = ?',
        [userId]
    );
    if (users.length === 0) {
        throw new Error('用户不存在');
    }
    return users[0];
}

/**
 * 更新用户信息
 */
async function updateUserInfo(userId, data) {
    const { nickname, avatar, phone } = data;
    const fields = [];
    const values = [];

    if (nickname !== undefined) {
        fields.push('nickname = ?');
        values.push(nickname);
    }
    if (avatar !== undefined) {
        fields.push('avatar = ?');
        values.push(avatar);
    }
    if (phone !== undefined) {
        fields.push('phone = ?');
        values.push(phone);
    }

    if (fields.length === 0) {
        throw new Error('没有需要更新的字段');
    }

    values.push(userId);
    await pool.query(`UPDATE user SET ${fields.join(', ')} WHERE id = ?`, values);

    return getUserInfo(userId);
}

module.exports = {
    wxLogin,
    getUserInfo,
    updateUserInfo
};
