<template>
  <div>
    <div style="margin-bottom: 20px; display: flex; gap: 10px;">
      <el-select v-model="filterStatus" placeholder="请选择订单状态" style="width: 200px;">
        <el-option label="全部订单" value="全部订单" />
        <el-option label="待付款" value="待付款" />
        <el-option label="待发货" value="待发货" />
        <el-option label="已发货" value="已发货" />
        <el-option label="已完成" value="已完成" />
      </el-select>
    </div>

    <el-table :data="filteredOrders" style="width: 100%">
      <el-table-column prop="id" label="订单号" width="120" />
      <el-table-column prop="user" label="购买人" />
      <el-table-column prop="product" label="购买商品" />
      <el-table-column prop="price" label="订单金额" />
      <el-table-column prop="time" label="下单时间" width="180" />
      <el-table-column label="订单状态" width="120">
        <template #default="scope">
          <el-tag :type="getTagType(scope.row.status)">{{ scope.row.status }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="120">
        <template #default="scope">
          <el-button link type="primary" v-if="scope.row.status === '待发货'" @click="shipOrder(scope.row)">
            手动发货
          </el-button>
          <el-button link type="success" v-else-if="scope.row.status === '已发货'" @click="completeOrder(scope.row)">
            完成订单
          </el-button>
          <span v-else>无操作</span>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

// 模拟后端订单数据
const allOrders = ref([
  { id: 'ORD1001', user: '张三', product: '红富士苹果', price: 50, time: '2026-08-20 10:00', status: '待发货' },
  { id: 'ORD1002', user: '李四', product: '五常大米', price: 120, time: '2026-08-21 14:30', status: '待付款' },
  { id: 'ORD1003', user: '王五', product: '土鸡蛋', price: 30, time: '2026-08-22 09:15', status: '已发货' },
  { id: 'ORD1004', user: '赵六', product: '有机蔬菜', price: 80, time: '2026-08-23 16:00', status: '已完成' }
])

const filterStatus = ref('全部订单')

// 筛选功能
const filteredOrders = computed(() => {
  if (filterStatus.value === '全部订单') return allOrders.value
  return allOrders.value.filter(item => item.status === filterStatus.value)
})

// 获取标签颜色
const getTagType = (status) => {
  if (status === '待付款') return 'warning'
  if (status === '待发货') return 'danger'
  if (status === '已发货') return 'primary'
  return 'success'
}

// 手动发货
const shipOrder = (row) => {
  row.status = '已发货'
  alert(`订单 ${row.id} 发货成功！`)
}

// 完成订单
const completeOrder = (row) => {
  row.status = '已完成'
  alert(`订单 ${row.id} 已完成！`)
}
</script>