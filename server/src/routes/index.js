const express = require('express');
const router = express.Router();

// 控制器
const userController = require('../controller/userController');
const addressController = require('../controller/addressController');
const categoryController = require('../controller/categoryController');
const productController = require('../controller/productController');
const groupController = require('../controller/groupController');
const cartController = require('../controller/cartController');
const orderController = require('../controller/orderController');
const uploadController = require('../controller/uploadController');
const statisticsController = require('../controller/statisticsController');

// 中间件
const { authMiddleware, adminAuthMiddleware } = require('../middleware/auth');
const { validateAddress, validateProduct, validateGroupActivity, required } = require('../middleware/validate');

// ============================================================
// 用户模块接口
// ============================================================
router.post('/user/login', userController.login);
router.get('/user/info', authMiddleware, userController.getUserInfo);
router.put('/user/info', authMiddleware, userController.updateUserInfo);

// ============================================================
// 收货地址模块接口（需要登录）
// ============================================================
router.get('/address/list', authMiddleware, addressController.getList);
router.get('/address/detail/:id', authMiddleware, addressController.getDetail);
router.post('/address/add', authMiddleware, validateAddress, addressController.add);
router.put('/address/update/:id', authMiddleware, validateAddress, addressController.update);
router.delete('/address/delete/:id', authMiddleware, addressController.remove);
router.put('/address/default/:id', authMiddleware, addressController.setDefault);

// ============================================================
// 商品分类模块接口
// ============================================================
// 用户端
router.get('/category/list', categoryController.getList);
// 管理后台
router.get('/admin/category/list', adminAuthMiddleware, categoryController.getAdminList);
router.post('/admin/category/add', adminAuthMiddleware, required(['name']), categoryController.add);
router.put('/admin/category/update/:id', adminAuthMiddleware, categoryController.update);
router.delete('/admin/category/delete/:id', adminAuthMiddleware, categoryController.remove);
router.put('/admin/category/status/:id', adminAuthMiddleware, categoryController.toggleStatus);

// ============================================================
// 商品模块接口
// ============================================================
// 用户端
router.get('/product/list', productController.getList);
router.get('/product/detail/:id', productController.getDetail);
router.get('/product/search', productController.search);
// 管理后台
router.get('/admin/product/list', adminAuthMiddleware, productController.getAdminList);
router.post('/admin/product/add', adminAuthMiddleware, validateProduct, productController.add);
router.put('/admin/product/update/:id', adminAuthMiddleware, validateProduct, productController.update);
router.delete('/admin/product/delete/:id', adminAuthMiddleware, productController.remove);
router.put('/admin/product/status/:id', adminAuthMiddleware, productController.toggleStatus);
router.put('/admin/product/stock/:id', adminAuthMiddleware, productController.updateStock);

// ============================================================
// 购物车模块接口（需要登录）
// ============================================================
router.get('/cart/list', authMiddleware, cartController.list);
router.post('/cart/add', authMiddleware, cartController.add);
router.put('/cart/quantity/:id', authMiddleware, cartController.updateQuantity);
router.delete('/cart/delete/:id', authMiddleware, cartController.remove);
router.post('/cart/batch-delete', authMiddleware, cartController.batchDelete);
router.put('/cart/select/:id', authMiddleware, cartController.select);
router.post('/cart/batch-select', authMiddleware, cartController.batchSelect);
router.delete('/cart/clear', authMiddleware, cartController.clear);

// ============================================================
// 订单模块接口
// ============================================================
// 用户端
router.post('/order/create', authMiddleware, orderController.create);
router.post('/order/pay', authMiddleware, orderController.pay);
router.post('/order/cancel', authMiddleware, orderController.cancel);
router.get('/order/list', authMiddleware, orderController.list);
router.get('/order/detail/:id', authMiddleware, orderController.detail);
// 管理后台
router.get('/admin/order/list', adminAuthMiddleware, orderController.adminList);
router.put('/admin/order/status', adminAuthMiddleware, orderController.changeStatus);
router.post('/admin/order/cancel', adminAuthMiddleware, orderController.adminCancel);
router.get('/admin/order/abnormal', adminAuthMiddleware, orderController.abnormal);
router.post('/admin/order/auto-cancel', adminAuthMiddleware, orderController.autoCancel);

// ============================================================
// 文件上传模块接口
// ============================================================
router.post('/upload/image', authMiddleware, uploadController.upload.single('file'), uploadController.uploadImage);
router.post('/upload/images', authMiddleware, uploadController.upload.array('files', 9), uploadController.uploadImages);

// ============================================================
// 数据统计模块接口（管理后台）
// ============================================================
router.get('/admin/statistics/overview', adminAuthMiddleware, statisticsController.overview);
router.get('/admin/statistics/sales', adminAuthMiddleware, statisticsController.sales);
router.get('/admin/statistics/orders', adminAuthMiddleware, statisticsController.orders);
router.get('/admin/statistics/revenue', adminAuthMiddleware, statisticsController.revenue);
router.get('/admin/statistics/hot', adminAuthMiddleware, statisticsController.hot);

// ============================================================
// 团购活动模块接口
// ============================================================
// 用户端
router.get('/group/list', groupController.getList);
router.get('/group/detail/:id', groupController.getDetail);
router.get('/group/ongoing', groupController.getOngoing);
// 管理后台
router.get('/admin/group/list', adminAuthMiddleware, groupController.getAdminList);
router.post('/admin/group/add', adminAuthMiddleware, validateGroupActivity, groupController.add);
router.put('/admin/group/update/:id', adminAuthMiddleware, validateGroupActivity, groupController.update);
router.put('/admin/group/status/:id', adminAuthMiddleware, groupController.toggleStatus);

module.exports = router;
