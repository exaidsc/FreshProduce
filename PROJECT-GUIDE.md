# FreshProduce 生鲜团购小程序 — 项目使用指南

> 最后更新：2026-08-31
> 本文档面向所有项目成员，涵盖环境搭建、数据库初始化、前后端启动、接口调用、各模块功能说明。

---

## 一、项目总览

### 1.1 项目简介

基于微信小程序的生鲜团购平台，包含三端：

| 端 | 技术栈 | 目录 | 说明 |
|----|--------|------|------|
| 微信小程序（用户端） | 微信原生 / WXML + JS | `miniprogram/` | 商品浏览、购物车、下单、订单管理 |
| Vue 管理后台 | Vue 3 + Element Plus + ECharts | `admin-web/vue-project/` | 商品管理、订单管理、数据看板 |
| Node.js 后端 | Express + MySQL + JWT | `server/` | 全部业务逻辑、数据库交互 |

### 1.2 团队分工

| 成员 | 负责模块 |
|------|----------|
| 成员1 | 收货地址管理 |
| 成员2 | 商品分类 + 商品管理 |
| 成员3 | 团购活动 + 定时成团 |
| 成员4 | 数据库总体设计 + 用户登录 + 后端框架搭建 + 定时任务 |
| **成员5** | **购物车 + 订单 + 文件上传 + 数据统计 + 事务处理** |

---

## 二、环境准备

### 2.1 前置软件

| 软件 | 版本要求 | 用途 |
|------|----------|------|
| Node.js | ≥ 16.x | 后端运行时 |
| npm | 随 Node.js 安装 | 依赖管理 |
| MySQL | ≥ 8.0 | 数据库 |
| 微信开发者工具 | 最新版 | 小程序预览与调试 |
| VS Code | 最新版 | 代码编辑 |

### 2.2 安装步骤

#### 后端（server/）

```bash
cd server
npm install          # 安装依赖（express, mysql2, jsonwebtoken, multer, node-schedule 等）
```

#### 管理后台（admin-web/vue-project/）

```bash
cd admin-web/vue-project
npm install          # 安装依赖（vue, element-plus, echarts, axios 等）
```

#### 小程序（miniprogram/）

用微信开发者工具直接打开 `miniprogram/` 目录即可，无需 npm install。

---

## 三、数据库初始化

### 3.1 创建数据库和表结构

```bash
# 方式一：npm 脚本（推荐）
cd server
npm run init-db

# 方式二：手动执行
mysql -u root -p < init.sql
```

这会创建 `fresh_group_buy` 数据库，包含 10 张表 + 基础测试数据（5 分类、7 商品、3 团购活动、1 管理员）。

### 3.2 补充测试数据（成员5 模块专用）

```bash
mysql -u root -p fresh_group_buy < test-data.sql
```

补充数据包括：

| 数据 | 数量 | 说明 |
|------|------|------|
| 测试用户 | 3 个 | 张三 / 李四 / 王五（openid: `dev_openid_001~003`） |
| 收货地址 | 4 个 | 每个用户 1-2 个地址 |
| 历史订单 | 14 笔 | 覆盖全部 6 种状态（待付款/待成团/待配送/配送中/已完成/已取消） |
| 订单明细 | 22 条 | 每笔订单 1-3 个商品 |
| 购物车 | 7 条 | 不同用户的待结算商品 |
| 参团记录 | 1 条 | 配合团购订单 |
| 补充商品 | 5 个 | 让销量统计更有意义 |

### 3.3 环境变量配置

在 `server/` 目录下创建 `.env` 文件：

```env
# 数据库配置
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=你的MySQL密码
DB_NAME=fresh_group_buy

# 服务端口
PORT=3000

# 微信小程序配置（开发环境可不填，会自动降级为模拟登录）
WX_APPID=你的小程序AppID
WX_SECRET=你的小程序Secret

# 运行环境
NODE_ENV=development
```

### 3.4 测试账号

| 角色 | 账号 | 密码 | 说明 |
|------|------|------|------|
| 管理员 | admin | admin123 | 后台登录用（MD5 存储） |
| 测试用户 | dev_openid_001 | — | 小程序开发模式自动登录 |

---

## 四、启动项目

### 4.1 启动后端

```bash
cd server

# 开发模式（文件修改自动重启）
npm run dev

# 生产模式
npm start
```

启动成功标志：

```
========================================
  生鲜团购小程序后端服务启动成功
  服务地址: http://localhost:3000
  健康检查: http://localhost:3000/health
  API前缀:  http://localhost:3000/api
========================================
✅ MySQL数据库连接成功
⏰ 团购定时成团任务已启动（每分钟）
⏰ 订单异常清理定时任务已启动（每5分钟）
```

验证：浏览器访问 `http://localhost:3000/health`，返回 `{"code":200,"message":"服务运行正常"}` 即成功。

### 4.2 启动管理后台

```bash
cd admin-web/vue-project
npm run dev
```

默认端口 `http://localhost:5173`。

### 4.3 启动小程序

用微信开发者工具打开 `miniprogram/` 目录，选择「不使用云开发」，编译预览即可。

> 小程序需配置「不校验合法域名」才能访问 `http://localhost:3000` 的本地后端。

---

## 五、API 接口文档

所有接口统一响应格式：

```json
{
  "code": 200,       // 200成功 / 400参数错误 / 401未登录 / 500服务器错误
  "message": "success",
  "data": {}
}
```

### 5.1 用户模块

| 方法 | 路径 | 说明 | 鉴权 |
|------|------|------|------|
| POST | `/api/user/login` | 微信登录 | 否 |
| GET | `/api/user/info` | 获取用户信息 | 用户 |
| PUT | `/api/user/info` | 更新用户信息 | 用户 |

### 5.2 收货地址模块

| 方法 | 路径 | 说明 | 鉴权 |
|------|------|------|------|
| GET | `/api/address/list` | 地址列表 | 用户 |
| GET | `/api/address/detail/:id` | 地址详情 | 用户 |
| POST | `/api/address/add` | 新增地址 | 用户 |
| PUT | `/api/address/update/:id` | 编辑地址 | 用户 |
| DELETE | `/api/address/delete/:id` | 删除地址 | 用户 |
| PUT | `/api/address/default/:id` | 设为默认地址 | 用户 |

### 5.3 商品分类模块

| 方法 | 路径 | 说明 | 鉴权 |
|------|------|------|------|
| GET | `/api/category/list` | 分类列表（用户端） | 否 |
| GET | `/api/admin/category/list` | 分类列表（后台） | 管理员 |
| POST | `/api/admin/category/add` | 新增分类 | 管理员 |
| PUT | `/api/admin/category/update/:id` | 编辑分类 | 管理员 |
| DELETE | `/api/admin/category/delete/:id` | 删除分类 | 管理员 |
| PUT | `/api/admin/category/status/:id` | 启用/禁用 | 管理员 |

### 5.4 商品模块

| 方法 | 路径 | 说明 | 鉴权 |
|------|------|------|------|
| GET | `/api/product/list` | 商品列表（用户端） | 否 |
| GET | `/api/product/detail/:id` | 商品详情 | 否 |
| GET | `/api/product/search?keyword=xx` | 模糊搜索 | 否 |
| GET | `/api/admin/product/list` | 商品列表（后台） | 管理员 |
| POST | `/api/admin/product/add` | 新增商品 | 管理员 |
| PUT | `/api/admin/product/update/:id` | 编辑商品 | 管理员 |
| DELETE | `/api/admin/product/delete/:id` | 删除商品 | 管理员 |
| PUT | `/api/admin/product/status/:id` | 上下架 | 管理员 |
| PUT | `/api/admin/product/stock/:id` | 修改库存 | 管理员 |

### 5.5 团购活动模块

| 方法 | 路径 | 说明 | 鉴权 |
|------|------|------|------|
| GET | `/api/group/list` | 活动列表（用户端） | 否 |
| GET | `/api/group/detail/:id` | 活动详情 | 否 |
| GET | `/api/group/ongoing` | 进行中活动 | 否 |
| GET | `/api/admin/group/list` | 活动列表（后台） | 管理员 |
| POST | `/api/admin/group/add` | 创建活动 | 管理员 |
| PUT | `/api/admin/group/update/:id` | 编辑活动 | 管理员 |
| PUT | `/api/admin/group/status/:id` | 启停活动 | 管理员 |

### 5.6 购物车模块（成员5）

| 方法 | 路径 | 说明 | 鉴权 |
|------|------|------|------|
| GET | `/api/cart/list` | 购物车列表（含商品信息、选中总价） | 用户 |
| POST | `/api/cart/add` | 加入购物车（同品自动累加数量） | 用户 |
| PUT | `/api/cart/quantity/:id` | 修改数量 | 用户 |
| DELETE | `/api/cart/delete/:id` | 删除单条 | 用户 |
| POST | `/api/cart/batch-delete` | 批量删除 `{ids:[...]}` | 用户 |
| PUT | `/api/cart/select/:id` | 单条选中/取消 `{selected:1/0}` | 用户 |
| POST | `/api/cart/batch-select` | 批量选中 `{ids:[...], selected:1/0}` | 用户 |
| DELETE | `/api/cart/clear` | 清空购物车（可选传 ids） | 用户 |

### 5.7 订单模块（成员5）

**用户端：**

| 方法 | 路径 | 说明 | 鉴权 |
|------|------|------|------|
| POST | `/api/order/create` | 下单（事务：扣库存+生成订单+明细+清购物车） | 用户 |
| POST | `/api/order/pay` | 支付（待付款→待成团/待配送） | 用户 |
| POST | `/api/order/cancel` | 取消订单（库存回补） | 用户 |
| GET | `/api/order/list?status=&page=&size=` | 我的订单列表 | 用户 |
| GET | `/api/order/detail/:id` | 订单详情（含明细） | 用户 |

**管理后台：**

| 方法 | 路径 | 说明 | 鉴权 |
|------|------|------|------|
| GET | `/api/admin/order/list?status=&page=&size=` | 全部订单列表 | 管理员 |
| PUT | `/api/admin/order/status` | 强制变更状态 `{order_id, status}` | 管理员 |
| POST | `/api/admin/order/cancel` | 强制取消订单 `{order_id}` | 管理员 |
| GET | `/api/admin/order/abnormal` | 异常订单查询 | 管理员 |
| POST | `/api/admin/order/auto-cancel` | 手动触发超时订单清理 | 管理员 |

### 5.8 文件上传模块（成员5）

| 方法 | 路径 | 说明 | 鉴权 |
|------|------|------|------|
| POST | `/api/upload/image` | 单图上传（field: `file`） | 用户 |
| POST | `/api/upload/images` | 多图上传（field: `files`，最多9张） | 用户 |

- 支持格式：jpg / png / gif / webp
- 单文件大小限制：5MB
- 文件保存路径：`server/public/uploads/`
- 访问地址：`http://localhost:3000/public/uploads/{filename}`

### 5.9 数据统计模块（成员5）

| 方法 | 路径 | 说明 | 鉴权 |
|------|------|------|------|
| GET | `/api/admin/statistics/overview` | 看板总览（四项汇总） | 管理员 |
| GET | `/api/admin/statistics/sales` | 销量统计 | 管理员 |
| GET | `/api/admin/statistics/orders` | 订单统计 | 管理员 |
| GET | `/api/admin/statistics/revenue` | 营收统计 | 管理员 |
| GET | `/api/admin/statistics/hot?limit=10` | 热门商品排行 | 管理员 |

所有统计接口支持日期区间筛选：`?start=2026-08-25&end=2026-08-31`

---

## 六、核心业务流程

### 6.1 下单流程（含事务保证）

```
用户提交订单
  │
  ├─ 1. 校验收货地址归属
  ├─ 2. 校验团购活动有效性（如有）
  ├─ 3. 逐商品加行锁（SELECT ... FOR UPDATE）
  │     ├─ 校验商品上架状态
  │     ├─ 校验库存充足
  │     ├─ 扣减库存（stock - qty）
  │     └─ 累加销量（sales + qty）
  ├─ 4. 生成订单主表（状态=0待付款）
  ├─ 5. 批量插入订单明细
  ├─ 6. 清空已下单购物车
  │
  └─ 全部成功 → COMMIT，任一步失败 → ROLLBACK（库存自动恢复）
```

### 6.2 订单状态流转

```
  0 待付款 ──支付──→ 1 待成团（团购）/ 2 待配送（普通）
       │                    │
       └──取消──→ 5 已取消    └──成团──→ 2 待配送
                                              │
                                    ┌─取消──→ 5 已取消
                                    └─发货──→ 3 配送中
                                                  │
                                            └─完成──→ 4 已完成
```

- 状态流转由后端白名单 `STATUS_FLOW` 强制管控，前端无法越权
- 取消订单自动回补库存和销量
- 超时未支付订单由定时任务每 5 分钟自动取消

### 6.3 团购流程

```
管理员创建团购活动（设定商品、团购价、最低人数、起止时间）
  │
  ├─ 用户下单 → 待付款(0) → 支付 → 待成团(1)
  │                              └─ 写入 group_join 参团记录
  │                              └─ current_people + 1
  │
  └─ 定时任务每分钟扫描：
       ├─ 人数 ≥ 最低要求 → 成团 → 活动→已成团，订单→待配送(2)
       ├─ 已到期且未达标 → 关闭 → 活动→未成团关闭，订单→已取消(5)，库存回补
       └─ 未到期未达标 → 跳过，等待下次
```

### 6.4 异常订单处理

| 场景 | 触发方式 | 处理逻辑 |
|------|----------|----------|
| 超时未支付 | 定时任务（每5分钟） | 自动取消 + 库存回补 + 销量回退 |
| 手动清理 | 管理员调用 `/api/admin/order/auto-cancel` | 同上 |
| 管理员强制取消 | 管理员调用 `/api/admin/order/cancel` | 同上 + 团购人数回退 |

---

## 七、数据统计说明

### 7.1 统计口径

- **有效订单**：`status IN (1,2,3,4)`（已支付及之后状态）
- 排除：`0 待付款`、`5 已取消`

### 7.2 四项统计

| 统计项 | 数据来源 | 算法 |
|--------|----------|------|
| 销量统计 | `order_item.quantity` | `SUM(quantity)` 按日分组 |
| 订单统计 | `order.status` | `GROUP BY status` 得状态分布 + `GROUP BY DATE` 得趋势 |
| 营收统计 | `order.total_amount` | `SUM(total_amount)` 仅有效订单按日分组 |
| 热门商品 | `order_item` 聚合 | `GROUP BY product_id` 按销量降序取 TOP N |

### 7.3 返回数据格式示例

```json
// GET /api/admin/statistics/overview
{
  "code": 200,
  "data": {
    "sales": {
      "order_count": 10,
      "total_quantity": 18,
      "total_sales": 520.80,
      "by_day": [
        {"day": "2026-08-25", "quantity": 3, "sales": 97.80},
        {"day": "2026-08-26", "quantity": 1, "sales": 49.00}
      ]
    },
    "orders": {
      "total": 14,
      "by_status": {"0": 2, "1": 1, "2": 2, "3": 2, "4": 5, "5": 2},
      "by_day": [...]
    },
    "revenue": {
      "total_revenue": 429.60,
      "by_day": [...]
    },
    "hot_products": [
      {"rank": 1, "product_name": "有机小白菜 500g", "sold_count": 8, "sales_amount": 68.20},
      {"rank": 2, "product_name": "西红柿 1kg", "sold_count": 6, "sales_amount": 72.00}
    ]
  }
}
```

---

## 八、项目目录结构

```
FreshProduce-WPt01/
├── server/                              # 后端服务（Node.js + Express）
│   ├── init.sql                         # 数据库建表脚本（10张表 + 基础数据）
│   ├── test-data.sql                    # 补充测试数据（成员5模块专用）
│   ├── package.json
│   ├── .env                             # 环境变量（不入库）
│   ├── public/uploads/                  # 上传图片存储目录
│   └── src/
│       ├── app.js                       # 入口文件
│       ├── config/db.js                 # MySQL 连接池
│       ├── controller/                  # 控制器（处理请求 → 调用 service → 返回响应）
│       │   ├── userController.js
│       │   ├── addressController.js
│       │   ├── categoryController.js
│       │   ├── productController.js
│       │   ├── groupController.js
│       │   ├── cartController.js        # ★ 成员5
│       │   ├── orderController.js       # ★ 成员5
│       │   ├── uploadController.js      # ★ 成员5
│       │   └── statisticsController.js  # ★ 成员5
│       ├── service/                     # 业务层（核心逻辑、数据库操作、事务）
│       │   ├── userService.js
│       │   ├── addressService.js
│       │   ├── categoryService.js
│       │   ├── productService.js
│       │   ├── groupService.js
│       │   ├── cartService.js           # ★ 成员5
│       │   ├── orderService.js          # ★ 成员5（事务+状态机+库存回补）
│       │   └── statisticsService.js     # ★ 成员5
│       ├── middleware/
│       │   ├── auth.js                  # JWT 鉴权（用户/管理员）
│       │   └── validate.js             # 参数校验
│       ├── scheduler/
│       │   ├── groupScheduler.js        # 团购定时成团
│       │   └── orderScheduler.js        # ★ 成员5：异常订单自动清理
│       ├── routes/index.js              # 路由注册（全部接口）
│       └── utils/
│           ├── response.js              # 统一响应封装
│           └── jwt.js                   # JWT 工具
│
├── admin-web/vue-project/              # 管理后台（Vue 3 + Element Plus）
│   └── src/views/
│       ├── Login.vue                    # 管理员登录
│       ├── Dashboard.vue               # 数据看板（ECharts 图表）
│       ├── Goods.vue                    # 商品管理
│       ├── Order.vue                    # 订单管理
│       └── Groupon.vue                  # 团购管理
│
├── miniprogram/                         # 微信小程序（用户端）
│   └── pages/
│       ├── index/                       # 首页（商品列表）
│       ├── cart/                        # 购物车
│       ├── orderConfirm/                # 订单确认
│       ├── orderList/                   # 订单列表
│       └── orderDetail/                 # 订单详情
│
└── README.md
```

---

## 九、常见问题

### Q1: 数据库连接失败

检查 `.env` 中的 `DB_PASSWORD` 是否正确。确认 MySQL 服务已启动：

```bash
# Windows
net start mysql80

# macOS / Linux
sudo systemctl start mysql
```

### Q2: 端口被占用

修改 `.env` 中的 `PORT`，或找到占用进程并终止：

```bash
netstat -ano | findstr :3000
taskkill /PID <进程号> /F
```

### Q3: 小程序无法连接后端

1. 微信开发者工具 → 设置 → 项目设置 → 勾选「不校验合法域名」
2. 确保后端已启动且 `app.js` 中 CORS 配置 `origin: '*'`

### Q4: 图片上传后 404

检查 `server/public/uploads/` 目录是否存在，以及 `app.js` 中静态资源中间件配置：

```javascript
app.use('/public', express.static(path.join(__dirname, '../public')));
```

### Q5: 测试数据重置

重新执行初始化会清空全部数据：

```bash
mysql -u root -p < init.sql        # 建表 + 基础数据
mysql -u root -p fresh_group_buy < test-data.sql  # 补充测试数据
```

### Q6: 订单状态流转报错

后端强制管控状态流转白名单，例如「配送中→待付款」是不允许的。检查目标状态是否在 `STATUS_FLOW` 中定义。

---

## 十、部署注意事项

1. **生产环境**：将 `app.js` 中 CORS 的 `origin` 改为具体域名，不要用 `*`
2. **数据库密码**：不要将 `.env` 提交到 Git（已在 `.gitignore` 中排除）
3. **上传目录**：`public/uploads/` 已在 `.gitignore` 中排除，部署后需手动创建
4. **HTTPS**：小程序正式版要求 HTTPS，需配置 SSL 证书
5. **域名备案**：小程序正式版需已备案域名
