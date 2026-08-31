const userService = require('../service/userService');
const { success, fail, serverError } = require('../utils/response');

/**
 * 微信登录
 * POST /api/user/login
 * body: { code }
 */
async function login(req, res) {
    try {
        const { code } = req.body;
        if (!code) {
            return fail(res, 'code不能为空');
        }
        const result = await userService.wxLogin(code);
        return success(res, result, '登录成功');
    } catch (err) {
        console.error('登录失败:', err);
        return serverError(res, err.message);
    }
}

/**
 * 获取用户信息
 * GET /api/user/info
 */
async function getUserInfo(req, res) {
    try {
        const userInfo = await userService.getUserInfo(req.user.id);
        return success(res, userInfo);
    } catch (err) {
        return fail(res, err.message);
    }
}

/**
 * 更新用户信息
 * PUT /api/user/info
 */
async function updateUserInfo(req, res) {
    try {
        const userInfo = await userService.updateUserInfo(req.user.id, req.body);
        return success(res, userInfo, '更新成功');
    } catch (err) {
        return fail(res, err.message);
    }
}

module.exports = {
    login,
    getUserInfo,
    updateUserInfo
};
