<template>
  <el-container style="height: 100vh;">
    <el-aside width="200px" style="background-color: #304156;">
      <h3 style="color: white; text-align: center; padding: 20px;">农产品后台</h3>
      <!-- 这里的 index 对应路由的 path -->
      <el-menu background-color="#304156" text-color="#fff" active-text-color="#409EFF" router>
        <el-menu-item index="/goods">商品管理</el-menu-item>
        <el-menu-item index="/groupon">团购活动</el-menu-item>
        <el-menu-item index="/order">订单管理</el-menu-item>
        <el-menu-item index="/dashboard">数据统计</el-menu-item>
      </el-menu>
    </el-aside>
    <el-container>
      <el-header style="background: #fff; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #ddd;">
        <span>欢迎回来，管理员</span>
        <el-button type="danger" size="small" @click="logout">退出登录</el-button>
      </el-header>
      <el-main>
        <router-view></router-view>
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { useRouter } from 'vue-router'
const router = useRouter()

const logout = () => {
  localStorage.removeItem('token') // 清除凭证
  router.push('/login') // 跳回登录页
}
</script>