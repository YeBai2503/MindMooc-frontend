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

// 是否显示侧边栏（首页不显示）
const showSidebar = computed(() => {
  return route.path !== '/'
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
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1); 
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
  align-items: baseline;
  gap: 16px;
}

.app-title {
  margin: 0;
  font-size: 26px;
  font-weight: 700;
  line-height: 1.2;
  color: #2c3e50;
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
  background: #f8fafc;
  border-right: 1px solid #e2e8f0;
}

.sidebar-menu {
  border: none;
  background: transparent;
  padding: 16px 0;
}

.menu-item {
  margin: 4px 12px;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.menu-item:hover {
  background: rgba(74, 222, 128, 0.1);
}

.menu-item.is-active {
  background: linear-gradient(135deg, #4ade80 0%, #22d3ee 100%);
  color: white;
}

.app-main {
  background: #ffffff;
  padding: 24px;
}

.content-wrapper {
  max-width: 1200px;
  margin: 0 auto;
  height: 100%;
}

.app-main.full-width {
  padding: 0;
}

.content-wrapper.home-content {
  max-width: none;
  margin: 0;
  height: auto;
}
</style>
