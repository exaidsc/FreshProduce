const pool = require('../config/db');
const axios = require('axios');
const crypto = require('crypto');
const { generateToken } = require('../utils/jwt');

async function wxLogin(code) {
    if (!code) throw new Error('code不能为空');
    let openid;
    try {
        const url = `https://api.weixin.qq.com/sns/jscode2session?appid=${process.env.WX_APPID}&secret=${process.env.WX_SECRET}&js_code=${code}&grant_type=authorization_code`;
        const response = await axios.get(url);
        if (response.data.errcode) {
            if (process.env.NODE_ENV === 'development') {
                openid = 'dev_openid_' + code.substring(0, 10);
            } else {
                throw new Error('微信登录失败: ' + response.data.errmsg);
            }
        } else {
            openid = response.data.openid;
        }
    } catch (err) {
        if (process.env.NODE_ENV === 'development') {
            openid = 'dev_openid_' + code.substring(0, 10);
        } else {
            throw err;
        }
    }
    const [users] = await pool.query('SELECT * FROM user WHERE openid = ?', [openid]);
    let user;
    if (users.length > 0) {
        user = users[0];
        await pool.query('UPDATE user SET update_time = NOW() WHERE id = ?', [user.id]);
    } else {
        const [result] = await pool.query(
            'INSERT INTO user (openid, nickname, avatar) VALUES (?, ?, ?)',
            [openid, '微信用户', '']
        );
        const [newUsers] = await pool.query('SELECT * FROM user WHERE id = ?', [result.insertId]);
        user = newUsers[0];
    }
    const token = generateToken({ userId: user.id, openid: user.openid, nickname: user.nickname });
    return { token, userInfo: { id: user.id, nickname: user.nickname, avatar: user.avatar, phone: user.phone } };
}

async function getUserInfo(userId) {
    const [users] = await pool.query('SELECT id, nickname, avatar, phone, create_time FROM user WHERE id = ?', [userId]);
    if (users.length === 0) throw new Error('用户不存在');
    return users[0];
}

async function updateUserInfo(userId, data) {
    const { nickname, avatar, phone } = data;
    const fields = [];
    const values = [];
    if (nickname !== undefined) { fields.push('nickname = ?'); values.push(nickname); }
    if (avatar !== undefined) { fields.push('avatar = ?'); values.push(avatar); }
    if (phone !== undefined) { fields.push('phone = ?'); values.push(phone); }
    if (fields.length === 0) throw new Error('没有需要更新的字段');
    values.push(userId);
    await pool.query(`UPDATE user SET ${fields.join(', ')} WHERE id = ?`, values);
    return getUserInfo(userId);
}

async function adminLogin(username, password) {
    if (!username || !password) throw new Error('用户名和密码不能为空');
    const md5Password = crypto.createHash('md5').update(password).digest('hex');
    const [admins] = await pool.query(
        'SELECT * FROM admin WHERE username = ? AND password = ? AND status = 1',
        [username, md5Password]
    );
    if (admins.length === 0) throw new Error('用户名或密码错误');
    const admin = admins[0];
    const token = generateToken({ adminId: admin.id, username: admin.username, role: admin.role });
    return { token, adminInfo: { id: admin.id, username: admin.username, role: admin.role } };
}

module.exports = { wxLogin, getUserInfo, updateUserInfo, adminLogin };
