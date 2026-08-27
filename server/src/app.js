/**
 * 生鲜团购小程序后端服务入口
 * 作者：成员4
 * 技术栈：Express + MySQL + JWT + node-schedule
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

// 数据库连接
require('./config/db');

// 定时任务
const { startGroupScheduler } = require('./scheduler/groupScheduler');

// 路由
const routes = require('./routes/index');

const app = express();
const PORT = process.env.PORT || 3000;

// ============================================================
// 中间件配置
// ============================================================

// CORS跨域配置：允许小程序和Vue后台访问
app.use(cors({
    origin: '*',  // 开发环境允许所有来源，生产环境应指定具体域名
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));

// 解析JSON请求体
app.use(express.json());
// 解析表单数据
app.use(express.urlencoded({ extended: true }));

// 静态资源访问（上传的图片等）
app.use('/public', express.static(path.join(__dirname, '../public')));

// ============================================================
// 全局请求日志（开发环境）
// ============================================================
if (process.env.NODE_ENV === 'development') {
    app.use((req, res, next) => {
        console.log(`[${new Date().toLocaleString()}] ${req.method} ${req.url}`);
        next();
    });
}

// ============================================================
// 路由注册
// ============================================================
app.use('/api', routes);

// 健康检查接口
app.get('/health', (req, res) => {
    res.json({
        code: 200,
        message: '服务运行正常',
        data: {
            service: '生鲜团购小程序后端',
            version: '1.0.0',
            time: new Date().toLocaleString()
        }
    });
});

// 404处理
app.use((req, res) => {
    res.status(404).json({
        code: 404,
        message: '接口不存在',
        data: null
    });
});

// 全局错误处理
app.use((err, req, res, next) => {
    console.error('全局错误:', err);
    res.status(500).json({
        code: 500,
        message: err.message || '服务器内部错误',
        data: null
    });
});

// ============================================================
// 启动服务
// ============================================================
app.listen(PORT, () => {
    console.log('========================================');
    console.log('  生鲜团购小程序后端服务启动成功');
    console.log(`  服务地址: http://localhost:${PORT}`);
    console.log(`  健康检查: http://localhost:${PORT}/health`);
    console.log(`  API前缀:  http://localhost:${PORT}/api`);
    console.log('========================================');

    // 启动团购定时成团任务
    startGroupScheduler();
});

module.exports = app;
