const userService = require('../service/userService');
const { success, fail, serverError } = require('../utils/response');

async function login(req, res) {
    try {
        const { code } = req.body;
        if (!code) return fail(res, 'code不能为空');
        const result = await userService.wxLogin(code);
        return success(res, result, '登录成功');
    } catch (err) {
        console.error('登录失败:', err);
        return serverError(res, err.message);
    }
}

async function getUserInfo(req, res) {
    try {
        const userInfo = await userService.getUserInfo(req.user.id);
        return success(res, userInfo);
    } catch (err) {
        return fail(res, err.message);
    }
}

async function updateUserInfo(req, res) {
    try {
        const userInfo = await userService.updateUserInfo(req.user.id, req.body);
        return success(res, userInfo, '更新成功');
    } catch (err) {
        return fail(res, err.message);
    }
}

async function adminLogin(req, res) {
    try {
        const { username, password } = req.body;
        if (!username || !password) return fail(res, '用户名和密码不能为空');
        const result = await userService.adminLogin(username, password);
        return success(res, result, '管理员登录成功');
    } catch (err) {
        return fail(res, err.message);
    }
}

module.exports = { login, getUserInfo, updateUserInfo, adminLogin };
