const addressService = require('../service/addressService');
const { success, fail, serverError } = require('../utils/response');

/**
 * 获取地址列表
 * GET /api/address/list
 */
async function getList(req, res) {
    try {
        const list = await addressService.getAddressList(req.user.id);
        return success(res, list);
    } catch (err) {
        return serverError(res, err.message);
    }
}

/**
 * 获取地址详情
 * GET /api/address/detail/:id
 */
async function getDetail(req, res) {
    try {
        const detail = await addressService.getAddressDetail(req.params.id, req.user.id);
        return success(res, detail);
    } catch (err) {
        return fail(res, err.message);
    }
}

/**
 * 新增地址
 * POST /api/address/add
 */
async function add(req, res) {
    try {
        const result = await addressService.addAddress(req.user.id, req.body);
        return success(res, result, '新增地址成功');
    } catch (err) {
        return serverError(res, err.message);
    }
}

/**
 * 编辑地址
 * PUT /api/address/update/:id
 */
async function update(req, res) {
    try {
        const result = await addressService.updateAddress(req.params.id, req.user.id, req.body);
        return success(res, result, '修改地址成功');
    } catch (err) {
        return fail(res, err.message);
    }
}

/**
 * 删除地址
 * DELETE /api/address/delete/:id
 */
async function remove(req, res) {
    try {
        const result = await addressService.deleteAddress(req.params.id, req.user.id);
        return success(res, result, '删除地址成功');
    } catch (err) {
        return fail(res, err.message);
    }
}

/**
 * 设为默认地址
 * PUT /api/address/default/:id
 */
async function setDefault(req, res) {
    try {
        const result = await addressService.setDefaultAddress(req.params.id, req.user.id);
        return success(res, result, '设置默认地址成功');
    } catch (err) {
        return fail(res, err.message);
    }
}

module.exports = {
    getList,
    getDetail,
    add,
    update,
    remove,
    setDefault
};
