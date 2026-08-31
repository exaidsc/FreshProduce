const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { success, fail, serverError } = require('../utils/response');

/**
 * 文件上传控制器（成员5）
 * 使用 multer 将图片保存到 server/public/uploads 目录，
 * 由 app.js 中 express.static('/public') 提供静态访问。
 */

const UPLOAD_DIR = path.join(__dirname, '../public/uploads');

// 确保上传目录存在
if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// 磁盘存储配置
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, UPLOAD_DIR);
    },
    filename: function (req, file, cb) {
        // 防止中文/特殊字符：使用时间戳 + 随机串 + 原扩展名
        const ext = path.extname(file.originalname) || '';
        const safeName = `img_${Date.now()}_${Math.floor(Math.random() * 10000)}${ext}`;
        cb(null, safeName);
    }
});

// 文件过滤：仅允许图片类型
function fileFilter(req, file, cb) {
    const allowed = /^image\/(jpeg|jpg|png|gif|webp)$/;
    if (allowed.test(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('仅支持上传 jpg/png/gif/webp 图片文件'), false);
    }
}

const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // 单文件最大 5MB
    }
});

/**
 * 单图上传
 * POST /api/upload/image
 * field 名: file
 */
async function uploadImage(req, res) {
    try {
        if (!req.file) {
            return fail(res, '未检测到上传文件');
        }
        // 返回可访问的静态 URL（与 app.js 的 /public 静态映射对应）
        const url = `/public/uploads/${req.file.filename}`;
        return success(res, {
            url,
            filename: req.file.filename,
            size: req.file.size
        }, '上传成功');
    } catch (err) {
        return serverError(res, err.message);
    }
}

/**
 * 多图上传
 * POST /api/upload/images
 * field 名: files（最多 9 张）
 */
async function uploadImages(req, res) {
    try {
        if (!req.files || req.files.length === 0) {
            return fail(res, '未检测到上传文件');
        }
        const list = req.files.map(f => ({
            url: `/public/uploads/${f.filename}`,
            filename: f.filename,
            size: f.size
        }));
        return success(res, list, '上传成功');
    } catch (err) {
        return serverError(res, err.message);
    }
}

module.exports = {
    upload,
    uploadImage,
    uploadImages
};
