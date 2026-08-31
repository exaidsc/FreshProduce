const { verifyToken } = require('../utils/jwt');
const { unauthorized } = require('../utils/response');

/**
 * 用户Token鉴权中间件
 * 从请求头 Authorization: Bearer <token> 中提取并验证
 */
function authMiddleware(req, res, next) {
    // 从header获取token
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return unauthorized(res, '请先登录');
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);

    if (!decoded) {
        return unauthorized(res, '登录已过期，请重新登录');
    }

    // 将用户信息挂载到req上
    req.user = {
        id: decoded.userId,
        openid: decoded.openid,
        nickname: decoded.nickname
    };

    next();
}

/**
 * 管理员Token鉴权中间件
 */
function adminAuthMiddleware(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return unauthorized(res, '请先登录管理员账号');
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);

    if (!decoded || !decoded.adminId) {
        return unauthorized(res, '管理员登录已过期');
    }

    req.admin = {
        id: decoded.adminId,
        username: decoded.username,
        role: decoded.role
    };

    next();
}

module.exports = {
    authMiddleware,
    adminAuthMiddleware
};
