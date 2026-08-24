<template>
  <div>
    <div style="margin-bottom: 20px;">
      <el-input v-model="searchKey" placeholder="搜索商品名称" style="width: 200px; margin-right: 10px;" />
      <el-button type="primary" @click="openDialog">新增商品</el-button>
    </div>

    <el-table :data="goodsList" style="width: 100%">
      <el-table-column prop="id" label="ID" width="80" />
      <el-table-column prop="name" label="商品名称" />
      <el-table-column prop="price" label="价格" />
      <el-table-column label="状态">
        <template #default="scope">
          <el-tag v-if="scope.row.status === 1">上架中</el-tag>
          <el-tag type="danger" v-else>已下架</el-tag>
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
    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑商品' : '新增商品'">
      <el-form :model="form">
        <el-form-item label="商品名称"><el-input v-model="form.name" /></el-form-item>
        <el-form-item label="商品价格"><el-input v-model="form.price" type="number" /></el-form-item>
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

const searchKey = ref('')
const goodsList = ref([
  { id: 1, name: '红富士苹果', price: 10, status: 1 },
  { id: 2, name: '五常大米', price: 50, status: 0 }
])

const dialogVisible = ref(false)
const isEdit = ref(false)
const form = reactive({ id: '', name: '', price: '' })

const openDialog = () => {
  isEdit.value = false
  form.id = ''; form.name = ''; form.price = ''
  dialogVisible.value = true
}
const edit = (row) => {
  isEdit.value = true
  Object.assign(form, row)
  dialogVisible.value = true
}
const save = () => {
  if (isEdit.value) {
    const index = goodsList.value.findIndex(item => item.id === form.id)
    goodsList.value[index] = { ...form }
  } else {
    goodsList.value.push({ ...form, id: goodsList.value.length + 1, status: 1 })
  }
  dialogVisible.value = false
}
const del = (id) => {
  goodsList.value = goodsList.value.filter(item => item.id !== id)
}
</script>