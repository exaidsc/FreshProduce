-- ============================================================
-- 生鲜团购小程序数据库建表脚本
-- 作者：成员4 - 数据库总设计
-- 数据库：MySQL 8.0
-- 字符集：utf8mb4
-- ============================================================

-- 删除已有数据库（谨慎使用）
DROP DATABASE IF EXISTS fresh_group_buy;
CREATE DATABASE fresh_group_buy DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE fresh_group_buy;

-- ============================================================
-- 1. 用户表
-- ============================================================
CREATE TABLE `user` (
    `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '用户ID',
    `openid` VARCHAR(64) NOT NULL COMMENT '微信openid',
    `nickname` VARCHAR(50) DEFAULT '' COMMENT '昵称',
    `avatar` VARCHAR(255) DEFAULT '' COMMENT '头像URL',
    `phone` VARCHAR(20) DEFAULT '' COMMENT '手机号',
    `status` TINYINT DEFAULT 1 COMMENT '状态：1正常 0禁用',
    `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `update_time` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_openid` (`openid`),
    KEY `idx_phone` (`phone`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户表';

-- ============================================================
-- 2. 收货地址表
-- ============================================================
CREATE TABLE `address` (
    `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '地址ID',
    `user_id` BIGINT NOT NULL COMMENT '用户ID',
    `name` VARCHAR(20) NOT NULL COMMENT '收货人姓名',
    `phone` VARCHAR(20) NOT NULL COMMENT '收货人手机号',
    `province` VARCHAR(20) NOT NULL COMMENT '省',
    `city` VARCHAR(20) NOT NULL COMMENT '市',
    `district` VARCHAR(20) NOT NULL COMMENT '区/县',
    `detail` VARCHAR(200) NOT NULL COMMENT '详细地址',
    `is_default` TINYINT DEFAULT 0 COMMENT '是否默认：1是 0否',
    `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `update_time` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`id`),
    KEY `idx_user_id` (`user_id`),
    CONSTRAINT `fk_address_user` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='收货地址表';

-- ============================================================
-- 3. 商品分类表
-- ============================================================
CREATE TABLE `category` (
    `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '分类ID',
    `name` VARCHAR(30) NOT NULL COMMENT '分类名称',
    `icon` VARCHAR(255) DEFAULT '' COMMENT '分类图标',
    `sort` INT DEFAULT 0 COMMENT '排序（数字越小越靠前）',
    `status` TINYINT DEFAULT 1 COMMENT '状态：1启用 0禁用',
    `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `update_time` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`id`),
    KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='商品分类表';

-- ============================================================
-- 4. 商品表
-- ============================================================
CREATE TABLE `product` (
    `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '商品ID',
    `category_id` BIGINT NOT NULL COMMENT '分类ID',
    `name` VARCHAR(100) NOT NULL COMMENT '商品名称',
    `price` DECIMAL(10,2) NOT NULL DEFAULT 0.00 COMMENT '原价',
    `group_price` DECIMAL(10,2) NOT NULL DEFAULT 0.00 COMMENT '团购价',
    `stock` INT NOT NULL DEFAULT 0 COMMENT '库存',
    `sales` INT NOT NULL DEFAULT 0 COMMENT '销量',
    `image` VARCHAR(255) DEFAULT '' COMMENT '商品主图',
    `images` TEXT COMMENT '商品轮播图（JSON数组）',
    `description` TEXT COMMENT '商品描述',
    `unit` VARCHAR(10) DEFAULT '份' COMMENT '单位',
    `status` TINYINT DEFAULT 1 COMMENT '状态：1上架 0下架',
    `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `update_time` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`id`),
    KEY `idx_category_id` (`category_id`),
    KEY `idx_status` (`status`),
    KEY `idx_name` (`name`),
    CONSTRAINT `fk_product_category` FOREIGN KEY (`category_id`) REFERENCES `category`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='商品表';

-- ============================================================
-- 5. 团购活动表
-- ============================================================
CREATE TABLE `group_activity` (
    `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '活动ID',
    `product_id` BIGINT NOT NULL COMMENT '商品ID',
    `group_price` DECIMAL(10,2) NOT NULL COMMENT '团购价格',
    `min_people` INT NOT NULL DEFAULT 2 COMMENT '成团最少人数',
    `current_people` INT NOT NULL DEFAULT 0 COMMENT '当前参团人数',
    `start_time` DATETIME NOT NULL COMMENT '活动开始时间',
    `end_time` DATETIME NOT NULL COMMENT '活动结束时间',
    `status` TINYINT DEFAULT 1 COMMENT '状态：1进行中 2已成团 3未成团关闭 4手动关闭',
    `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `update_time` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`id`),
    KEY `idx_product_id` (`product_id`),
    KEY `idx_status` (`status`),
    KEY `idx_end_time` (`end_time`),
    CONSTRAINT `fk_group_product` FOREIGN KEY (`product_id`) REFERENCES `product`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='团购活动表';

-- ============================================================
-- 6. 订单主表
-- ============================================================
CREATE TABLE `order` (
    `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '订单ID',
    `order_no` VARCHAR(32) NOT NULL COMMENT '订单编号',
    `user_id` BIGINT NOT NULL COMMENT '用户ID',
    `address_id` BIGINT NOT NULL COMMENT '收货地址ID',
    `activity_id` BIGINT DEFAULT NULL COMMENT '团购活动ID（非团购为NULL）',
    `total_amount` DECIMAL(10,2) NOT NULL DEFAULT 0.00 COMMENT '订单总金额',
    `status` TINYINT DEFAULT 0 COMMENT '订单状态：0待付款 1待成团 2待配送 3配送中 4已完成 5已取消',
    `pay_time` DATETIME DEFAULT NULL COMMENT '支付时间',
    `delivery_time` DATETIME DEFAULT NULL COMMENT '发货时间',
    `finish_time` DATETIME DEFAULT NULL COMMENT '完成时间',
    `cancel_time` DATETIME DEFAULT NULL COMMENT '取消时间',
    `remark` VARCHAR(200) DEFAULT '' COMMENT '订单备注',
    `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `update_time` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_order_no` (`order_no`),
    KEY `idx_user_id` (`user_id`),
    KEY `idx_status` (`status`),
    KEY `idx_activity_id` (`activity_id`),
    KEY `idx_create_time` (`create_time`),
    CONSTRAINT `fk_order_user` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`),
    CONSTRAINT `fk_order_address` FOREIGN KEY (`address_id`) REFERENCES `address`(`id`),
    CONSTRAINT `fk_order_activity` FOREIGN KEY (`activity_id`) REFERENCES `group_activity`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='订单主表';

-- ============================================================
-- 7. 订单明细表
-- ============================================================
CREATE TABLE `order_item` (
    `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '明细ID',
    `order_id` BIGINT NOT NULL COMMENT '订单ID',
    `product_id` BIGINT NOT NULL COMMENT '商品ID',
    `product_name` VARCHAR(100) NOT NULL COMMENT '商品名称（快照）',
    `product_image` VARCHAR(255) DEFAULT '' COMMENT '商品图片（快照）',
    `price` DECIMAL(10,2) NOT NULL COMMENT '成交单价',
    `quantity` INT NOT NULL DEFAULT 1 COMMENT '购买数量',
    `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    PRIMARY KEY (`id`),
    KEY `idx_order_id` (`order_id`),
    KEY `idx_product_id` (`product_id`),
    CONSTRAINT `fk_item_order` FOREIGN KEY (`order_id`) REFERENCES `order`(`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_item_product` FOREIGN KEY (`product_id`) REFERENCES `product`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='订单明细表';

-- ============================================================
-- 8. 购物车表
-- ============================================================
CREATE TABLE `cart` (
    `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '购物车ID',
    `user_id` BIGINT NOT NULL COMMENT '用户ID',
    `product_id` BIGINT NOT NULL COMMENT '商品ID',
    `quantity` INT NOT NULL DEFAULT 1 COMMENT '商品数量',
    `selected` TINYINT DEFAULT 1 COMMENT '是否选中：1选中 0未选',
    `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `update_time` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_user_product` (`user_id`, `product_id`),
    KEY `idx_user_id` (`user_id`),
    CONSTRAINT `fk_cart_user` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_cart_product` FOREIGN KEY (`product_id`) REFERENCES `product`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='购物车表';

-- ============================================================
-- 9. 团购参团记录表
-- ============================================================
CREATE TABLE `group_join` (
    `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '记录ID',
    `activity_id` BIGINT NOT NULL COMMENT '活动ID',
    `user_id` BIGINT NOT NULL COMMENT '用户ID',
    `order_id` BIGINT NOT NULL COMMENT '订单ID',
    `join_time` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '参团时间',
    PRIMARY KEY (`id`),
    KEY `idx_activity_id` (`activity_id`),
    KEY `idx_user_id` (`user_id`),
    KEY `idx_order_id` (`order_id`),
    CONSTRAINT `fk_join_activity` FOREIGN KEY (`activity_id`) REFERENCES `group_activity`(`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_join_user` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`),
    CONSTRAINT `fk_join_order` FOREIGN KEY (`order_id`) REFERENCES `order`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='团购参团记录表';

-- ============================================================
-- 10. 管理员表
-- ============================================================
CREATE TABLE `admin` (
    `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '管理员ID',
    `username` VARCHAR(30) NOT NULL COMMENT '用户名',
    `password` VARCHAR(64) NOT NULL COMMENT '密码（MD5加密）',
    `role` VARCHAR(20) DEFAULT 'admin' COMMENT '角色：admin超级管理员 operator运营',
    `status` TINYINT DEFAULT 1 COMMENT '状态：1正常 0禁用',
    `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `update_time` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='管理员表';

-- ============================================================
-- 初始化测试数据
-- ============================================================

-- 管理员账号（密码：admin123，MD5值：0192023a7bbd73250516f069df18b500）
INSERT INTO `admin` (`username`, `password`, `role`) VALUES
('admin', '0192023a7bbd73250516f069df18b500', 'admin');

-- 商品分类
INSERT INTO `category` (`name`, `icon`, `sort`) VALUES
('新鲜蔬菜', '/images/category/veg.png', 1),
('时令水果', '/images/category/fruit.png', 2),
('肉禽蛋品', '/images/category/meat.png', 3),
('海鲜水产', '/images/category/seafood.png', 4),
('粮油副食', '/images/category/grain.png', 5);

-- 测试商品
INSERT INTO `product` (`category_id`, `name`, `price`, `group_price`, `stock`, `image`, `description`, `unit`) VALUES
(1, '有机小白菜 500g', 8.80, 5.90, 200, '/images/product/1.jpg', '新鲜有机种植，无农药残留', '份'),
(1, '西红柿 1kg', 12.00, 8.80, 150, '/images/product/2.jpg', '自然成熟，沙瓤多汁', '份'),
(2, '红富士苹果 2kg', 35.00, 25.80, 100, '/images/product/3.jpg', '脆甜多汁，产地直发', '箱'),
(2, '阳光玫瑰葡萄 1kg', 45.00, 32.80, 80, '/images/product/4.jpg', '香甜无籽，颗粒饱满', '盒'),
(3, '土鸡蛋 30枚', 38.00, 28.80, 120, '/images/product/5.jpg', '散养土鸡蛋，营养丰富', '盒'),
(4, '鲜活大虾 500g', 58.00, 42.00, 60, '/images/product/6.jpg', '海捕鲜活，肉质紧实', '份'),
(5, '东北大米 5kg', 49.00, 39.90, 200, '/images/product/7.jpg', '五常大米，香糯可口', '袋');

-- 测试团购活动
INSERT INTO `group_activity` (`product_id`, `group_price`, `min_people`, `current_people`, `start_time`, `end_time`, `status`) VALUES
(1, 5.90, 3, 1, NOW(), DATE_ADD(NOW(), INTERVAL 2 DAY), 1),
(3, 25.80, 5, 2, NOW(), DATE_ADD(NOW(), INTERVAL 3 DAY), 1),
(5, 28.80, 3, 3, DATE_SUB(NOW(), INTERVAL 1 DAY), DATE_ADD(NOW(), INTERVAL 1 DAY), 1);

-- ============================================================