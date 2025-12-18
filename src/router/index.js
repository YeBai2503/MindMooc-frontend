import { createRouter, createWebHistory } from 'vue-router'
import { getToken } from '@/api/http'

// 页面组件
import Home from '@/views/Home.vue'
import NewTask from '@/views/NewTask.vue'
import BatchTask from '@/views/BatchTask.vue'
import HistoryTask from '@/views/HistoryTask.vue'
import Profile from '@/views/Profile.vue'
import Login from '@/views/Login.vue'

// 二级页面组件
import TaskDetail from '@/views/TaskDetail.vue'
import MapEditor from '@/views/MapEditor.vue'
import Feedback from '@/views/Feedback.vue'
import TaskWaiting from '@/views/TaskWaiting.vue'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home,
    meta: { title: '首页' }
  },
  // 一级页面路由
  {
    path: '/new-task',
    name: 'NewTask',
    component: NewTask,
    meta: { title: '新建任务' }
  },
  {
    path: '/batch-task',
    name: 'BatchTask',
    component: BatchTask,
    meta: { title: '批量任务' }
  },
  {
    path: '/history-task',
    name: 'HistoryTask',
    component: HistoryTask,
    meta: { title: '历史任务' }
  },
  {
    path: '/profile',
    name: 'Profile',
    component: Profile,
    meta: { title: '个人中心' }
  },
  {
    path: '/login',
    name: 'Login',
    component: Login,
    meta: { title: '登录' }
  },
  // 二级页面路由
  {
    path: '/task/:id',
    name: 'TaskDetail',
    component: TaskDetail,
    meta: { title: '任务详情' }
  },
  {
    path: '/editor/:id',
    name: 'MapEditor',
    component: MapEditor,
    meta: { title: '导图编辑' }
  },
  {
    path: '/feedback',
    name: 'Feedback',
    component: Feedback,
    meta: { title: '反馈' }
  },
  {
    path: '/task/wait/:id',
    name: 'TaskWaiting',
    component: TaskWaiting,
    meta: { title: '任务处理中' }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 不需要登录的白名单路由
const whiteList = ['/', '/login']

// 路由守卫 - 简单的登录校验 + 设置页面标题
router.beforeEach((to, from, next) => {
  // 设置标题
  if (to.meta.title) {
    document.title = `${to.meta.title} - MindMooc`
  }

  const hasToken = !!getToken()

  // 已登录情况下访问登录/注册，直接跳回首页或 redirect
  if (hasToken && (to.path === '/login' || to.path === '/register')) {
    const redirect = typeof to.query.redirect === 'string' ? to.query.redirect : '/'
    next(redirect)
    return
  }

  // 未登录且访问受保护页面时，跳转到登录页
  if (!hasToken && !whiteList.includes(to.path)) {
    next({
      path: '/login',
      query: { redirect: to.fullPath }
    })
    return
  }

  next()
})

export default router
