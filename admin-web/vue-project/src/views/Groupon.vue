<template>
  <div>
    <div style="margin-bottom: 20px;">
      <el-button type="primary" @click="openDialog">手动创建团购</el-button>
    </div>

    <el-table :data="grouponList" style="width: 100%">
      <el-table-column prop="id" label="ID" width="80" />
      <el-table-column prop="name" label="活动名称" />
      <el-table-column prop="people" label="成团人数" width="100" />
      <el-table-column prop="endTime" label="截止时间" width="180" />
      <el-table-column label="活动状态" width="120">
        <template #default="scope">
          <el-switch 
            v-model="scope.row.status" 
            active-value="开启" 
            inactive-value="暂停"
            @change="toggleStatus(scope.row)"
          />
        </template>
      </el-table-column>
      <el-table-column label="操作">
        <template #default="scope">
          <el-button link type="primary" @click="edit(scope.row)">编辑</el-button>
          <el-button link type="danger" @click="del(scope.row.id)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 新增/编辑弹窗 -->
    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑团购' : '创建新团购'">
      <el-form :model="form">
        <el-form-item label="活动名称"><el-input v-model="form.name" /></el-form-item>
        <el-form-item label="成团人数"><el-input v-model="form.people" type="number" /></el-form-item>
        <el-form-item label="截止时间">
          <el-date-picker v-model="form.endTime" type="datetime" placeholder="选择日期时间" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="save">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'

// 模拟后端数据
const grouponList = ref([
  { id: 1, name: '苹果10斤拼团', people: 3, endTime: '2026-09-01 12:00', status: '开启' },
  { id: 2, name: '土鸡蛋30个团', people: 5, endTime: '2026-09-05 18:00', status: '暂停' }
])

const dialogVisible = ref(false)
const isEdit = ref(false)
const form = reactive({ id: '', name: '', people: '', endTime: '' })

const openDialog = () => {
  isEdit.value = false
  form.id = ''; form.name = ''; form.people = ''; form.endTime = ''
  dialogVisible.value = true
}
const edit = (row) => {
  isEdit.value = true
  Object.assign(form, row)
  dialogVisible.value = true
}
const save = () => {
  if (isEdit.value) {
    const index = grouponList.value.findIndex(item => item.id === form.id)
    grouponList.value[index] = { ...form }
  } else {
    grouponList.value.push({ ...form, id: grouponList.value.length + 1, status: '开启' })
  }
  dialogVisible.value = false
}
const del = (id) => {
  grouponList.value = grouponList.value.filter(item => item.id !== id)
}
const toggleStatus = (row) => {
  alert(`团购活动「${row.name}」已切换为${row.status}状态`)
}
</script>