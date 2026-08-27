/**
 * 统一响应工具类
 * 所有接口返回格式统一为：{ code, message, data }
 */

// 成功响应
function success(res, data = null, message = 'success') {
    return res.json({
        code: 200,
        message,
        data
    });
}

// 失败响应
function fail(res, message = '操作失败', code = 400) {
    return res.json({
        code,
        message,
        data: null
    });
}

// 未授权响应
function unauthorized(res, message = '未登录或登录已过期') {
    return res.json({
        code: 401,
        message,
        data: null
    });
}

// 服务器错误响应
function serverError(res, message = '服务器内部错误') {
    return res.json({
        code: 500,
        message,
        data: null
    });
}

module.exports = {
    success,
    fail,
    unauthorized,
    serverError
};
