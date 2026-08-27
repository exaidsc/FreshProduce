const productService = require('../service/productService');
const { success, fail, serverError } = require('../utils/response');

/**
 * 商品列表（用户端，只返回上架商品）
 * GET /api/product/list
 */
async function getList(req, res) {
    try {
        const params = { ...req.query, status: 1 };
        const result = await productService.getProductList(params);
        return success(res, result);
    } catch (err) {
        return serverError(res, err.message);
    }
}

/**
 * 商品列表（管理后台，含全部状态）
 * GET /api/admin/product/list
 */
async function getAdminList(req, res) {
    try {
        const result = await productService.getProductList(req.query);
        return success(res, result);
    } catch (err) {
        return serverError(res, err.message);
    }
}

/**
 * 商品详情
 * GET /api/product/detail/:id
 */
async function getDetail(req, res) {
    try {
        const detail = await productService.getProductDetail(req.params.id);
        return success(res, detail);
    } catch (err) {
        return fail(res, err.message);
    }
}

/**
 * 新增商品
 * POST /api/admin/product/add
 */
async function add(req, res) {
    try {
        const result = await productService.addProduct(req.body);
        return success(res, result, '新增商品成功');
    } catch (err) {
        return serverError(res, err.message);
    }
}

/**
 * 编辑商品
 * PUT /api/admin/product/update/:id
 */
async function update(req, res) {
    try {
        const result = await productService.updateProduct(req.params.id, req.body);
        return success(res, result, '修改商品成功');
    } catch (err) {
        return fail(res, err.message);
    }
}

/**
 * 删除商品
 * DELETE /api/admin/product/delete/:id
 */
async function remove(req, res) {
    try {
        const result = await productService.deleteProduct(req.params.id);
        return success(res, result, '删除商品成功');
    } catch (err) {
        return fail(res, err.message);
    }
}

/**
 * 商品上下架
 * PUT /api/admin/product/status/:id
 */
async function toggleStatus(req, res) {
    try {
        const { status } = req.body;
        if (status !== 0 && status !== 1) {
            return fail(res, '状态值不合法');
        }
        const result = await productService.toggleProductStatus(req.params.id, status);
        return success(res, result, status === 1 ? '商品已上架' : '商品已下架');
    } catch (err) {
        return fail(res, err.message);
    }
}

/**
 * 修改库存
 * PUT /api/admin/product/stock/:id
 */
async function updateStock(req, res) {
    try {
        const { stock } = req.body;
        const result = await productService.updateStock(req.params.id, stock);
        return success(res, result, '库存修改成功');
    } catch (err) {
        return fail(res, err.message);
    }
}

/**
 * 商品模糊搜索
 * GET /api/product/search?keyword=xxx
 */
async function search(req, res) {
    try {
        const { keyword } = req.query;
        if (!keyword) {
            return fail(res, '搜索关键词不能为空');
        }
        const result = await productService.getProductList({ keyword, status: 1, page: 1, size: 20 });
        return success(res, result.list);
    } catch (err) {
        return serverError(res, err.message);
    }
}

module.exports = {
    getList,
    getAdminList,
    getDetail,
    add,
    update,
    remove,
    toggleStatus,
    updateStock,
    search
};
