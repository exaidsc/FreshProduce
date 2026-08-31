const orderService = require('../service/orderService');
const { success, fail, serverError } = require('../utils/response');

/**
 * 订单控制器（成员5）
 */

// POST /api/order/create
async function create(req, res) {
    try {
        const result = await orderService.createOrder(req.user.id, req.body);
        return success(res, result, '下单成功，请尽快支付');
    } catch (err) {
        return fail(res, err.message);
    }
}

// POST /api/order/pay
async function pay(req, res) {
    try {
        const { order_id } = req.body;
        if (!order_id) return fail(res, '订单ID不能为空');
        const result = await orderService.payOrder(order_id, req.user.id);
        return success(res, result, '支付成功');
    } catch (err) {
        return fail(res, err.message);
    }
}

// POST /api/order/cancel
async function cancel(req, res) {
    try {
        const { order_id } = req.body;
        if (!order_id) return fail(res, '订单ID不能为空');
        const result = await orderService.cancelOrder(order_id, req.user.id, false);
        return success(res, result, '订单已取消，库存已回补');
    } catch (err) {
        return fail(res, err.message);
    }
}

// PUT /api/admin/order/status
async function changeStatus(req, res) {
    try {
        const { order_id, status } = req.body;
        if (!order_id || status === undefined) return fail(res, '订单ID和状态不能为空');
        const result = await orderService.changeStatus(order_id, parseInt(status));
        return success(res, result, '订单状态已更新');
    } catch (err) {
        return fail(res, err.message);
    }
}

// POST /api/admin/order/cancel
async function adminCancel(req, res) {
    try {
        const { order_id } = req.body;
        if (!order_id) return fail(res, '订单ID不能为空');
        const result = await orderService.cancelOrder(order_id, null, true);
        return success(res, result, '订单已强制取消，库存已回补');
    } catch (err) {
        return fail(res, err.message);
    }
}

// GET /api/order/list
async function list(req, res) {
    try {
        const { status, page, size } = req.query;
        const result = await orderService.getOrderList({
            userId: req.user.id,
            status,
            page,
            size,
            isAdmin: false
        });
        return success(res, result);
    } catch (err) {
        return serverError(res, err.message);
    }
}

// GET /api/order/detail/:id
async function detail(req, res) {
    try {
        const result = await orderService.getOrderDetail(req.params.id, req.user.id, false);
        return success(res, result);
    } catch (err) {
        return fail(res, err.message);
    }
}

// GET /api/admin/order/list
async function adminList(req, res) {
    try {
        const { status, page, size } = req.query;
        const result = await orderService.getOrderList({
            status,
            page,
            size,
            isAdmin: true
        });
        return success(res, result);
    } catch (err) {
        return serverError(res, err.message);
    }
}

// GET /api/admin/order/abnormal
async function abnormal(req, res) {
    try {
        const result = await orderService.getAbnormalOrders();
        return success(res, result);
    } catch (err) {
        return serverError(res, err.message);
    }
}

// POST /api/admin/order/auto-cancel  （手动触发异常订单清理）
async function autoCancel(req, res) {
    try {
        const { expire_minutes } = req.body || {};
        const result = await orderService.autoCancelExpiredOrders(expire_minutes || 30);
        return success(res, result, `已自动取消 ${result.cancelled} 笔超时订单`);
    } catch (err) {
        return serverError(res, err.message);
    }
}

module.exports = {
    create,
    pay,
    cancel,
    changeStatus,
    adminCancel,
    list,
    detail,
    adminList,
    abnormal,
    autoCancel
};
