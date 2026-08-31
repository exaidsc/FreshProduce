const cartService = require('../service/cartService');
const { success, fail, serverError } = require('../utils/response');

/**
 * 购物车控制器（成员5）
 */

// GET /api/cart/list
async function list(req, res) {
    try {
        const result = await cartService.getCartList(req.user.id);
        return success(res, result);
    } catch (err) {
        return serverError(res, err.message);
    }
}

// POST /api/cart/add
async function add(req, res) {
    try {
        const { product_id, quantity } = req.body;
        if (!product_id) return fail(res, '商品ID不能为空');
        const result = await cartService.addCart(req.user.id, product_id, quantity);
        return success(res, result, '已加入购物车');
    } catch (err) {
        return fail(res, err.message);
    }
}

// PUT /api/cart/quantity/:id
async function updateQuantity(req, res) {
    try {
        const { quantity } = req.body;
        const result = await cartService.updateQuantity(req.params.id, req.user.id, quantity);
        return success(res, result, '数量已更新');
    } catch (err) {
        return fail(res, err.message);
    }
}

// DELETE /api/cart/delete/:id
async function remove(req, res) {
    try {
        const result = await cartService.removeCart(req.params.id, req.user.id);
        return success(res, result, '已删除');
    } catch (err) {
        return fail(res, err.message);
    }
}

// POST /api/cart/batch-delete
async function batchDelete(req, res) {
    try {
        const { ids } = req.body;
        const result = await cartService.batchRemove(req.user.id, ids);
        return success(res, result, '批量删除成功');
    } catch (err) {
        return fail(res, err.message);
    }
}

// PUT /api/cart/select/:id
async function select(req, res) {
    try {
        const { selected } = req.body;
        const result = await cartService.updateSelected(req.params.id, req.user.id, selected);
        return success(res, result);
    } catch (err) {
        return fail(res, err.message);
    }
}

// POST /api/cart/batch-select
async function batchSelect(req, res) {
    try {
        const { ids, selected } = req.body;
        const result = await cartService.batchUpdateSelected(req.user.id, ids, selected);
        return success(res, result);
    } catch (err) {
        return fail(res, err.message);
    }
}

// DELETE /api/cart/clear
async function clear(req, res) {
    try {
        const { ids } = req.body || {};
        const result = await cartService.clearCart(req.user.id, ids);
        return success(res, result, '购物车已清空');
    } catch (err) {
        return fail(res, err.message);
    }
}

module.exports = {
    list,
    add,
    updateQuantity,
    remove,
    batchDelete,
    select,
    batchSelect,
    clear
};
