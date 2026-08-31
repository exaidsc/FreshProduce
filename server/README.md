# 生鲜团购小程序后端服务

> 成员4：数据库总体设计 + 后端核心业务接口（用户+商品+团购）+ 定时成团任务
> 成员5：购物车全套接口 + 订单事务处理 + 图片上传 + 数据统计 + 异常订单处理

## 技术栈

- **框架**：Express 4.x
- **数据库**：MySQL 8.0
- **认证**：JWT (jsonwebtoken)
- **定时任务**：node-schedule
- **HTTP请求**：axios（微信登录）
- **文件上传**：multer

## 项目结构

```
fresh-group-buy/
├── init.sql                          # 数据库建表脚本（10张表+测试数据）
├── test-data.sql                     # 补充测试数据（成员5模块专用）
├── package.json
├── .env                              # 环境配置
├── README.md
└── src/
    ├── app.js                        # 入口文件
    ├── config/
    │   └── db.js                     # 数据库连接池
    ├── controller/                   # 控制层（接收请求）
    │   ├── userController.js
    │   ├── addressController.js
    │   ├── categoryController.js
    │   ├── productController.js
    │   ├── groupController.js
    │   ├── cartController.js         # ★ 成员5：购物车
    │   ├── orderController.js        # ★ 成员5：订单
    │   ├── uploadController.js       # ★ 成员5：文件上传
    │   └── statisticsController.js   # ★ 成员5：数据统计
    ├── service/                      # 业务层（逻辑处理）
    │   ├── userService.js
    │   ├── addressService.js
    │   ├── categoryService.js
    │   ├── productService.js
    │   ├── groupService.js
    │   ├── cartService.js            # ★ 成员5：购物车
    │   ├── orderService.js           # ★ 成员5：订单（事务+状态机+库存回补）
    │   └── statisticsService.js      # ★ 成员5：数据统计
    ├── middleware/                   # 中间件
    │   ├── auth.js                   # JWT鉴权
    │   └── validate.js               # 参数校验
    ├── scheduler/
    │   ├── groupScheduler.js         # 定时成团任务
    │   └── orderScheduler.js         # ★ 成员5：异常订单自动清理
    ├── utils/
    │   ├── response.js               # 统一响应封装
    │   └── jwt.js                    # JWT工具
    └── routes/
        └── index.js                  # 路由注册
```

## 快速启动

### 1. 安装依赖

```bash
npm install
```

### 2. 初始化数据库

```bash
# 方式一：使用npm脚本
npm run init-db

# 方式二：手动执行
mysql -u root -p < init.sql
```

### 3. 配置环境变量

编辑 `.env` 文件，修改数据库密码和微信小程序配置：

```env
DB_PASSWORD=你的MySQL密码
WX_APPID=你的小程序AppID
WX_SECRET=你的小程序Secret
```

> 开发环境下微信登录会自动降级为模拟openid，不配置也能跑。

### 4. 启动服务

```bash
# 开发模式（自动重启）
npm run dev

# 生产模式
npm start
```

### 5. 验证

浏览器访问 `http://localhost:3000/health`，返回服务运行正常即启动成功。

## 数据库设计（共10张表）

| 表名 | 说明 | 核心关系 |
|------|------|----------|
| user | 用户表 | 1:N → address, cart, order |
| address | 收货地址表 | N:1 → user |
| category | 商品分类表 | 1:N → product |
| product | 商品表 | N:1 → category, 1:N → group_activity, order_item, cart |
| group_activity | 团购活动表 | N:1 → product, 1:N → group_join, order |
| order | 订单主表 | N:1 → user, address, group_activity, 1:N → order_item |
| order_item | 订单明细表 | N:1 → order, product |
| cart | 购物车表 | N:1 → user, product |
| group_join | 团购参团记录表 | N:1 → group_activity, user, order |
| admin | 管理员表 | - |

## 接口清单

### 用户模块
| 方法 | 路径 | 说明 | 鉴权 |
|------|------|------|------|
| POST | /api/user/login | 微信登录 | 否 |
| GET | /api/user/info | 获取用户信息 | 用户 |
| PUT | /api/user/info | 更新用户信息 | 用户 |

### 收货地址模块
| 方法 | 路径 | 说明 | 鉴权 |
|------|------|------|------|
| GET | /api/address/list | 地址列表 | 用户 |
| GET | /api/address/detail/:id | 地址详情 | 用户 |
| POST | /api/address/add | 新增地址 | 用户 |
| PUT | /api/address/update/:id | 编辑地址 | 用户 |
| DELETE | /api/address/delete/:id | 删除地址 | 用户 |
| PUT | /api/address/default/:id | 设为默认 | 用户 |

### 商品分类模块
| 方法 | 路径 | 说明 | 鉴权 |
|------|------|------|------|
| GET | /api/category/list | 分类列表(用户端) | 否 |
| GET | /api/admin/category/list | 分类列表(后台) | 管理员 |
| POST | /api/admin/category/add | 新增分类 | 管理员 |
| PUT | /api/admin/category/update/:id | 编辑分类 | 管理员 |
| DELETE | /api/admin/category/delete/:id | 删除分类 | 管理员 |
| PUT | /api/admin/category/status/:id | 启用/禁用 | 管理员 |

### 商品模块
| 方法 | 路径 | 说明 | 鉴权 |
|------|------|------|------|
| GET | /api/product/list | 商品列表(用户端) | 否 |
| GET | /api/product/detail/:id | 商品详情 | 否 |
| GET | /api/product/search | 模糊搜索 | 否 |
| GET | /api/admin/product/list | 商品列表(后台) | 管理员 |
| POST | /api/admin/product/add | 新增商品 | 管理员 |
| PUT | /api/admin/product/update/:id | 编辑商品 | 管理员 |
| DELETE | /api/admin/product/delete/:id | 删除商品 | 管理员 |
| PUT | /api/admin/product/status/:id | 上下架 | 管理员 |
| PUT | /api/admin/product/stock/:id | 修改库存 | 管理员 |

### 团购活动模块
| 方法 | 路径 | 说明 | 鉴权 |
|------|------|------|------|
| GET | /api/group/list | 活动列表(用户端) | 否 |
| GET | /api/group/detail/:id | 活动详情 | 否 |
| GET | /api/group/ongoing | 进行中活动 | 否 |
| GET | /api/admin/group/list | 活动列表(后台) | 管理员 |
| POST | /api/admin/group/add | 创建活动 | 管理员 |
| PUT | /api/admin/group/update/:id | 编辑活动 | 管理员 |
| PUT | /api/admin/group/status/:id | 启停活动 | 管理员 |

### 购物车模块（成员5）
| 方法 | 路径 | 说明 | 鉴权 |
|------|------|------|------|
| GET | /api/cart/list | 购物车列表（含商品信息、选中总价） | 用户 |
| POST | /api/cart/add | 加入购物车（同品自动累加数量） | 用户 |
| PUT | /api/cart/quantity/:id | 修改数量 | 用户 |
| DELETE | /api/cart/delete/:id | 删除单条 | 用户 |
| POST | /api/cart/batch-delete | 批量删除 {ids:[...]} | 用户 |
| PUT | /api/cart/select/:id | 单条选中/取消 {selected:1/0} | 用户 |
| POST | /api/cart/batch-select | 批量选中 {ids:[...], selected:1/0} | 用户 |
| DELETE | /api/cart/clear | 清空购物车 | 用户 |

### 订单模块（成员5）
| 方法 | 路径 | 说明 | 鉴权 |
|------|------|------|------|
| POST | /api/order/create | 下单（事务：扣库存+生成订单+明细+清购物车） | 用户 |
| POST | /api/order/pay | 支付（待付款→待成团/待配送） | 用户 |
| POST | /api/order/cancel | 取消订单（库存回补） | 用户 |
| GET | /api/order/list | 我的订单列表 | 用户 |
| GET | /api/order/detail/:id | 订单详情（含明细） | 用户 |
| GET | /api/admin/order/list | 全部订单（后台） | 管理员 |
| PUT | /api/admin/order/status | 强制变更状态 | 管理员 |
| POST | /api/admin/order/cancel | 强制取消订单 | 管理员 |
| GET | /api/admin/order/abnormal | 异常订单查询 | 管理员 |
| POST | /api/admin/order/auto-cancel | 手动触发超时清理 | 管理员 |

### 文件上传模块（成员5）
| 方法 | 路径 | 说明 | 鉴权 |
|------|------|------|------|
| POST | /api/upload/image | 单图上传（field: file） | 用户 |
| POST | /api/upload/images | 多图上传（field: files，最多9张） | 用户 |

### 数据统计模块（成员5）
| 方法 | 路径 | 说明 | 鉴权 |
|------|------|------|------|
| GET | /api/admin/statistics/overview | 看板总览 | 管理员 |
| GET | /api/admin/statistics/sales | 销量统计 | 管理员 |
| GET | /api/admin/statistics/orders | 订单统计 | 管理员 |
| GET | /api/admin/statistics/revenue | 营收统计 | 管理员 |
| GET | /api/admin/statistics/hot | 热门商品排行 | 管理员 |

## 统一响应格式

```json
{
    "code": 200,
    "message": "success",
    "data": {}
}
```

- code=200：成功
- code=400：参数错误/业务失败
- code=401：未登录/登录过期
- code=500：服务器错误

## 定时成团任务说明

- **执行频率**：每分钟执行一次
- **处理逻辑**：
  1. 扫描所有 status=1（进行中）的团购活动
  2. 人数达标 → 立即成团（活动→已成团，订单→待配送）
  3. 已到期且人数未达标 → 关闭活动（活动→未成团关闭，订单→已取消，库存回补）
  4. 未到期且未达标 → 跳过，等待下次扫描
- **容错设计**：事务保证一致性 + 行锁防并发 + 运行锁防重复执行 + 异常捕获日志

## 异常订单清理任务（成员5）

- **执行频率**：每5分钟执行一次
- **处理逻辑**：
  1. 扫描所有 status=0（待付款）且创建时间超过30分钟的订单
  2. 回补库存（stock + qty）和销量（sales - qty）
  3. 订单状态改为 5（已取消）
  4. 若是团购订单，删除参团记录并回退 current_people
- **手动触发**：管理员可调用 `/api/admin/order/auto-cancel` 立即执行清理

## 测试数据

### 管理员账号
- admin / admin123

### 基础数据（init.sql）
- 5 个商品分类、7 个商品、3 个团购活动

### 补充测试数据（test-data.sql）
- 3 个测试用户（张三/李四/王五，openid: dev_openid_001~003）
- 4 个收货地址
- 14 笔历史订单（覆盖全部 6 种状态，用于统计验证）
- 22 条订单明细
- 7 条购物车记录
- 1 条团购参团记录
- 5 个补充商品

```bash
# 导入补充数据
mysql -u root -p fresh_group_buy < test-data.sql

# 或一键初始化全部
npm run init-all
```
