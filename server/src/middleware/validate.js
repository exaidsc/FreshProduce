const { fail } = require('../utils/response');

/**
 * 全局参数校验中间件
 * 提供常用校验规则
 */

// 手机号正则
const PHONE_REGEX = /^1[3-9]\d{9}$/;

// 非空校验
function required(fields) {
    return (req, res, next) => {
        const data = { ...req.body, ...req.query, ...req.params };
        for (const field of fields) {
            if (data[field] === undefined || data[field] === null || data[field] === '') {
                return fail(res, `参数 ${field} 不能为空`, 400);
            }
        }
        next();
    };
}

// 手机号校验
function validatePhone(phone) {
    return PHONE_REGEX.test(phone);
}

// 地址参数校验（成员1表单校验对应后端校验）
function validateAddress(req, res, next) {
    const { name, phone, province, city, district, detail } = req.body;

    if (!name || name.trim() === '') {
        return fail(res, '收货人姓名不能为空');
    }
    if (name.length > 20) {
        return fail(res, '收货人姓名不能超过20个字符');
    }
    if (!phone) {
        return fail(res, '手机号不能为空');
    }
    if (!validatePhone(phone)) {
        return fail(res, '手机号格式不正确');
    }
    if (!province || !city || !district) {
        return fail(res, '省市区信息不完整');
    }
    if (!detail || detail.trim() === '') {
        return fail(res, '详细地址不能为空');
    }
    if (detail.length > 200) {
        return fail(res, '详细地址不能超过200个字符');
    }

    // 特殊字符校验
    const specialChars = /[<>'"&;\\]/;
    if (specialChars.test(name) || specialChars.test(detail)) {
        return fail(res, '输入内容包含非法字符');
    }

    next();
}

// 商品参数校验
function validateProduct(req, res, next) {
    const { name, price, stock, category_id } = req.body;

    if (!name || name.trim() === '') {
        return fail(res, '商品名称不能为空');
    }
    if (!category_id) {
        return fail(res, '商品分类不能为空');
    }
    if (price === undefined || price === null || isNaN(price) || price < 0) {
        return fail(res, '商品价格不合法');
    }
    if (stock === undefined || stock === null || isNaN(stock) || stock < 0) {
        return fail(res, '商品库存不合法');
    }

    next();
}

// 团购活动参数校验
function validateGroupActivity(req, res, next) {
    const { product_id, group_price, min_people, start_time, end_time } = req.body;

    if (!product_id) {
        return fail(res, '商品ID不能为空');
    }
    if (!group_price || group_price <= 0) {
        return fail(res, '团购价格必须大于0');
    }
    if (!min_people || min_people < 2) {
        return fail(res, '成团人数至少为2人');
    }
    if (!start_time || !end_time) {
        return fail(res, '活动起止时间不能为空');
    }
    if (new Date(end_time) <= new Date(start_time)) {
        return fail(res, '结束时间必须晚于开始时间');
    }

    next();
}

module.exports = {
    required,
    validatePhone,
    validateAddress,
    validateProduct,
    validateGroupActivity
};
