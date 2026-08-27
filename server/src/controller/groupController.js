const groupService = require('../service/groupService');
const { success, fail, serverError } = require('../utils/response');

/**
 * 团购活动列表（用户端，进行中）
 * GET /api/group/list
 */
async function getList(req, res) {
    try {
        const result = await groupService.getActivityList({ ...req.query, status: 1 });
        return success(res, result);
    } catch (err) {
        return serverError(res, err.message);
    }
}

/**
 * 团购活动列表（管理后台，全部状态）
 * GET /api/admin/group/list
 */
async function getAdminList(req, res) {
    try {
        const result = await groupService.getActivityList(req.query);
        return success(res, result);
    } catch (err) {
        return serverError(res, err.message);
    }
}

/**
 * 活动详情
 * GET /api/group/detail/:id
 */
async function getDetail(req, res) {
    try {
        const detail = await groupService.getActivityDetail(req.params.id);
        return success(res, detail);
    } catch (err) {
        return fail(res, err.message);
    }
}

/**
 * 创建团购活动
 * POST /api/admin/group/add
 */
async function add(req, res) {
    try {
        const result = await groupService.addActivity(req.body);
        return success(res, result, '创建团购活动成功');
    } catch (err) {
        return fail(res, err.message);
    }
}

/**
 * 编辑团购活动
 * PUT /api/admin/group/update/:id
 */
async function update(req, res) {
    try {
        const result = await groupService.updateActivity(req.params.id, req.body);
        return success(res, result, '修改团购活动成功');
    } catch (err) {
        return fail(res, err.message);
    }
}

/**
 * 启停团购活动
 * PUT /api/admin/group/status/:id
 */
async function toggleStatus(req, res) {
    try {
        const { status } = req.body;
        const result = await groupService.toggleActivityStatus(req.params.id, status);
        return success(res, result, result.status === 1 ? '活动已开启' : '活动已关闭');
    } catch (err) {
        return fail(res, err.message);
    }
}

/**
 * 获取进行中活动（首页推荐）
 * GET /api/group/ongoing
 */
async function getOngoing(req, res) {
    try {
        const list = await groupService.getOngoingActivities();
        return success(res, list);
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
    toggleStatus,
    getOngoing
};
