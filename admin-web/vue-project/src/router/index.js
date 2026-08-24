import { createRouter, createWebHistory } from 'vue-router'
import Login from '../views/Login.vue'
import Layout from '../views/Layout.vue'
import Goods from '../views/Goods.vue'
import Groupon from '../views/Groupon.vue'
import Order from '../views/Order.vue'
import Dashboard from '../views/Dashboard.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/login', component: Login },
    {
      path: '/',
      component: Layout,
      children: [
        { path: '', redirect: '/dashboard' },
        { path: 'goods', component: Goods },
        { path: 'groupon', component: Groupon },
        { path: 'order', component: Order },
        { path: 'dashboard', component: Dashboard }
      ]
    }
  ]
})

// 权限拦截代码（答辩核心）
router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token')
  if (to.path !== '/login' && !token) {
    next('/login')
  } else {
    next()
  }
})
export default router