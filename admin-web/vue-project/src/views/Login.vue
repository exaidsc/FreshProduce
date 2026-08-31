<template>
  <div style="padding: 50px; max-width: 400px; margin: 100px auto;">
    <h2>管理员登录</h2>
    <el-input v-model="username" placeholder="请输入账号" style="margin-bottom: 20px;" />
    <el-input v-model="password" type="password" placeholder="请输入密码" style="margin-bottom: 20px;" />
    <el-button type="primary" style="width: 100%;" @click="handleLogin">登录</el-button>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router' // 引入跳转工具

const username = ref('admin') // 默认填入账号方便测试
const password = ref('123456') // 默认填入密码方便测试
const router = useRouter()

const handleLogin = () => {
  if (username.value && password.value) {
    // 模拟后端成功返回了一个 token 令牌
    localStorage.setItem('token', 'my_secret_token')
    alert('登录成功！即将跳转后台')
    // 跳转到后台主页
    router.push('/')
  } else {
    alert('请输入账号和密码')
  }
}
</script>