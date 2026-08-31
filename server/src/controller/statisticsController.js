const statisticsService = require('../service/statisticsService');
const { success, fail, serverError } = require('../utils/response');

/**
 * 数据统计控制器（成员5）
 */

// GET /api/admin/statistics/overview
async function overview(req, res) {
    try {
        const result = await statisticsService.overview(req.query);
        return success(res, result);
    } catch (err) {
        return serverError(res, err.message);
    }
}

// GET /api/admin/statistics/sales
async function sales(req, res) {
    try {
        const result = await statisticsService.salesStatistics(req.query);
        return success(res, result);
    } catch (err) {
        return serverError(res, err.message);
    }
}

// GET /api/admin/statistics/orders
async function orders(req, res) {
    try {
        const result = await statisticsService.orderStatistics(req.query);
        return success(res, result);
    } catch (err) {
        return serverError(res, err.message);
    }
}

// GET /api/admin/statistics/revenue
async function revenue(req, res) {
    try {
        const result = await statisticsService.revenueStatistics(req.query);
        return success(res, result);
    } catch (err) {
        return serverError(res, err.message);
    }
}

// GET /api/admin/statistics/hot
async function hot(req, res) {
    try {
        const result = await statisticsService.hotProducts(req.query);
        return success(res, result);
    } catch (err) {
        return serverError(res, err.message);
    }
}

module.exports = {
    overview,
    sales,
    orders,
    revenue,
    hot
};
