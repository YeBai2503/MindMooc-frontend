<script setup>
import { ref, computed, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()

// 导航菜单项
const menuItems = [
  { path: '/new-task', title: '新建任务', icon: 'Plus' },
  { path: '/batch-task', title: '批量任务', icon: 'Files' },
  { path: '/history-task', title: '历史任务', icon: 'Clock' },
  { path: '/profile', title: '个人中心', icon: 'User' }
]

// 当前激活的菜单
const activeMenu = ref(route.path)

// 监听路由变化，更新激活菜单
watch(() => route.path, (newPath) => {
  activeMenu.value = newPath
})

// 是否为登录 / 注册页
const isAuthPage = computed(() => {
  return route.path === '/login' || route.path === '/register'
})

// 是否显示侧边栏（首页和登录/注册不显示）
const showSidebar = computed(() => {
  return route.path !== '/' && !isAuthPage.value
})

// 导航到指定路径
const navigateTo = (path) => {
  activeMenu.value = path
  router.push(path)
}

// 回到首页
const goHome = () => {
  router.push('/')
}
</script>

<template>
  <div class="app-container">
    <!-- 普通布局：有顶栏 / 侧栏 -->
    <template v-if="!isAuthPage">
      <!-- 顶部导航栏 -->
      <el-header class="app-header">
        <div class="header-content">
          <div class="logo-section">
            <div class="logo-container" @click="goHome" style="cursor: pointer;">
              <img src="/logo2.svg" alt="MindMooc Logo" class="app-logo" />
              <div class="title-group">
                <h1 class="app-title">MindMooc</h1>
                <!--<span class="app-subtitle">慕课视频思维导图生成器</span>-->
              </div>
            </div>
          </div>
        </div>
      </el-header>

      <el-container class="main-container">
        <!-- 侧边导航 -->
        <el-aside v-if="showSidebar" class="app-sidebar" width="240px">
          <el-menu
            :default-active="activeMenu"
            class="sidebar-menu"
            @select="navigateTo"
          >
            <el-menu-item
              v-for="item in menuItems"
              :key="item.path"
              :index="item.path"
              class="menu-item"
            >
              <el-icon><component :is="item.icon" /></el-icon>
              <span>{{ item.title }}</span>
            </el-menu-item>
          </el-menu>
        </el-aside>

        <!-- 主内容区域 -->
        <el-main class="app-main" :class="{ 'full-width': !showSidebar }">
          <div class="content-wrapper" :class="{ 'home-content': !showSidebar }">
            <router-view />
          </div>
        </el-main>
      </el-container>
    </template>

    <!-- 登录 / 注册页：全屏渲染，不带导航栏 -->
    <template v-else>
      <router-view />
    </template>
  </div>
</template>

<style scoped>
.app-container {
  height: 100vh;
  display: flex;
  flex-direction: column;
}

.app-header {
  background: linear-gradient(135deg, #4ade80 0%, #22d3ee 50%, #06b6d4 100%);
  color: white;
  padding: 0;
  height: 70px !important;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.12);
  border-bottom: 1px solid rgba(255, 255, 255, 0.35);
  backdrop-filter: blur(16px);
}

.header-content {
  height: 100%;
  display: flex;
  align-items: center;
  padding: 0 24px;
}

.logo-section {
  display: flex;
  align-items: center;
}

.logo-container {
  display: flex;
  align-items: center;
  gap: 16px;
}

.app-logo {
  height: 48px;
  width: 48px;
  object-fit: contain;
}

.title-group {
  display: flex;
  align-items: center;
  gap: 16px;
}

.app-title {
  margin: 0;
  font-family: 'Audiowide', cursive;
  font-size: 28px;
  font-weight: 700;
  line-height: 1;
  color: #2c3e50;
  letter-spacing: 1px;
}

.app-subtitle {
  font-size: 14px;
  color: #64748b;
  font-weight: 500;
  opacity: 0.8;
}

.main-container {
  flex: 1;
  height: calc(100vh - 70px);
}

.app-sidebar {
  background: linear-gradient(180deg, #f8fafc 0%, #edf7ff 50%, #f0fdf4 100%);
  border-right: 1px solid #e2e8f0;
}

.sidebar-menu {
  border: none;
  background: transparent;
  padding: 20px 0;
}

.menu-item {
  margin: 4px 12px;
  border-radius: 8px;
  transition: all 0.3s ease;
  font-weight: 500;
}

.menu-item:hover {
  background: rgba(74, 222, 128, 0.1);
}

.menu-item.is-active {
  background: linear-gradient(135deg, #4ade80 0%, #22d3ee 100%);
  color: white;
  box-shadow: 0 6px 18px rgba(34, 211, 238, 0.35);
  transform: translateX(4px);
}

.app-main {
  background:
    radial-gradient(circle at top left, rgba(34, 211, 238, 0.06), transparent 60%),
    radial-gradient(circle at bottom right, rgba(74, 222, 128, 0.06), transparent 60%),
    #f8fafc;
  padding: 24px;
}

.content-wrapper {
  max-width: 1200px;
  margin: 0 auto;
  background-color: #ffffff;
  border-radius: 18px;
  box-shadow: 0 12px 30px rgba(15, 23, 42, 0.08);
  padding: 24px 24px 32px;
  transition: box-shadow 0.3s ease, transform 0.3s ease;
}

.content-wrapper:hover {
  box-shadow: 0 18px 40px rgba(15, 23, 42, 0.12);
  transform: translateY(-2px);
}

.app-main.full-width {
  padding: 0;
}

.content-wrapper.home-content {
  max-width: none;
  margin: 0;
  height: auto;
  background: transparent;
  box-shadow: none;
  padding: 0;
}
</style>
