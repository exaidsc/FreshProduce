const categoryService = require('../service/categoryService');
const { success, fail, serverError } = require('../utils/response');

/**
 * 获取分类列表（用户端）
 * GET /api/category/list
 */
async function getList(req, res) {
    try {
        const list = await categoryService.getCategoryList(false);
        return success(res, list);
    } catch (err) {
        return serverError(res, err.message);
    }
}

/**
 * 获取全部分类（管理后台，含禁用）
 * GET /api/admin/category/list
 */
async function getAdminList(req, res) {
    try {
        const list = await categoryService.getCategoryList(true);
        return success(res, list);
    } catch (err) {
        return serverError(res, err.message);
    }
}

/**
 * 新增分类
 * POST /api/admin/category/add
 */
async function add(req, res) {
    try {
        if (!req.body.name) {
            return fail(res, '分类名称不能为空');
        }
        const result = await categoryService.addCategory(req.body);
        return success(res, result, '新增分类成功');
    } catch (err) {
        return serverError(res, err.message);
    }
}

/**
 * 编辑分类
 * PUT /api/admin/category/update/:id
 */
async function update(req, res) {
    try {
        const result = await categoryService.updateCategory(req.params.id, req.body);
        return success(res, result, '修改分类成功');
    } catch (err) {
        return fail(res, err.message);
    }
}

/**
 * 删除分类
 * DELETE /api/admin/category/delete/:id
 */
async function remove(req, res) {
    try {
        const result = await categoryService.deleteCategory(req.params.id);
        return success(res, result, '删除分类成功');
    } catch (err) {
        return fail(res, err.message);
    }
}

/**
 * 启用/禁用分类
 * PUT /api/admin/category/status/:id
 */
async function toggleStatus(req, res) {
    try {
        const { status } = req.body;
        if (status !== 0 && status !== 1) {
            return fail(res, '状态值不合法');
        }
        const result = await categoryService.toggleCategoryStatus(req.params.id, status);
        return success(res, result, status === 1 ? '分类已启用' : '分类已禁用');
    } catch (err) {
        return fail(res, err.message);
    }
}

module.exports = {
    getList,
    getAdminList,
    add,
    update,
    remove,
    toggleStatus
};
