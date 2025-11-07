import { createRouter, createWebHistory } from 'vue-router'

// 页面组件
import Home from '@/views/Home.vue'
import NewTask from '@/views/NewTask.vue'
import BatchTask from '@/views/BatchTask.vue'
import HistoryTask from '@/views/HistoryTask.vue'
import Profile from '@/views/Profile.vue'

// 二级页面组件
import TaskDetail from '@/views/TaskDetail.vue'
import MapEditor from '@/views/MapEditor.vue'
import Feedback from '@/views/Feedback.vue'

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
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 路由守卫 - 设置页面标题
router.beforeEach((to, from, next) => {
  if (to.meta.title) {
    document.title = `${to.meta.title} - MindMooc`
  }
  next()
})

export default router
