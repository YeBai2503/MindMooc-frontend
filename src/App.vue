<script setup>
import { ref, computed, watch, onMounted, nextTick } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search } from '@element-plus/icons-vue'
import { deleteTask, listMyTaskStatuses, searchMyTasks } from '@/api/task'
import { getToken } from '@/api/http'

const router = useRouter()
const route = useRoute()

const sidebarCollapsed = ref(false)

const utilityMenuItems = [
  { path: '/profile', title: '个人中心', icon: 'User' }
]

const currentTaskPage = ref(1)
const pageSize = 8
const hasMoreTasks = ref(false)
const taskList = ref([])
const taskListLoading = ref(false)
const taskListError = ref('')

// 搜索相关状态
const searchDialogVisible = ref(false)
const searchKeyword = ref('')
const searchResults = ref([])
const searchLoading = ref(false)
const searchPage = ref(1)
const searchHasMore = ref(false)
const searchInputRef = ref(null)
const hasSearched = ref(false)

// 是否为登录 / 注册页
const isAuthPage = computed(() => {
  return route.path === '/login' || route.path === '/register'
})

// 是否显示侧边栏（仅登录/注册不显示）
const showSidebar = computed(() => {
  return route.path !== '/' && !isAuthPage.value
})

const activeTaskId = computed(() => {
  return String(route.params.id || '')
})

const currentUtilityPath = computed(() => {
  const utilityPaths = utilityMenuItems.map((item) => item.path)
  return utilityPaths.includes(route.path) ? route.path : ''
})

const toggleSidebar = () => {
  sidebarCollapsed.value = !sidebarCollapsed.value
}

const goNewTask = () => {
  router.push('/new-task')
}

const openTask = (task) => {
  router.push(`/task/${task.id}`)
}

const normalizeTaskStatus = (task) => ({
  ...task,
  id: String(task.id),
  createdAt: task.createdAt || task.completedAt || task.startedAt || Date.now()
})

const sortTasksByNewest = (tasks) => {
  return [...tasks].sort((a, b) => {
    const aTime = new Date(a.createdAt || 0).getTime()
    const bTime = new Date(b.createdAt || 0).getTime()
    return bTime - aTime
  })
}


const loadMoreTasks = async () => {
  if (!hasMoreTasks.value || taskListLoading.value) {
    return
  }
  currentTaskPage.value += 1
  await fetchTaskList(true)
}

const removeTask = async (task) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除任务「${task.title}」吗？此操作不可恢复。`,
      '删除任务',
      {
        confirmButtonText: '删除',
        cancelButtonText: '取消',
        type: 'warning',
        distinguishCancelAndClose: true
      }
    )

    await deleteTask(task.id)
    taskList.value = taskList.value.filter((item) => item.id !== task.id)
    ElMessage.success('任务已删除')

    if (activeTaskId.value === task.id) {
      router.push('/new-task')
    }
  } catch (error) {
    if (error !== 'cancel' && error !== 'close') {
      console.error('删除任务失败:', error)
    }
  }
}

const fetchTaskList = async (append = false) => {
  if (!getToken()) {
    taskList.value = []
    taskListError.value = ''
    hasMoreTasks.value = false
    return
  }

  taskListLoading.value = true
  taskListError.value = ''
  try {
    const page = await listMyTaskStatuses({
      pageNum: currentTaskPage.value,
      pageSize
    })
    const records = Array.isArray(page?.records) ? page.records : []
    const normalized = sortTasksByNewest(records.map(normalizeTaskStatus))

    taskList.value = append
      ? sortTasksByNewest([...taskList.value, ...normalized])
      : normalized

    const total = Number(page?.total ?? taskList.value.length)
    hasMoreTasks.value = currentTaskPage.value * pageSize < total
  } catch (error) {
    console.error('获取任务列表失败:', error)
    taskListError.value = error?.message || '获取任务列表失败'
    if (!append) {
      taskList.value = []
    }
    hasMoreTasks.value = false
  } finally {
    taskListLoading.value = false
  }
}



const navigateTo = (path) => {
  router.push(path)
}

const goHome = () => {
  router.push('/')
}

// 搜索相关方法
const openSearchDialog = () => {
  searchDialogVisible.value = true
  searchKeyword.value = ''
  searchResults.value = []
  searchPage.value = 1
  searchHasMore.value = false
  hasSearched.value = false
}

const focusSearchInput = () => {
  nextTick(() => {
    searchInputRef.value?.focus()
  })
}

const handleSearch = async () => {
  if (!searchKeyword.value.trim()) {
    searchResults.value = []
    hasSearched.value = false
    return
  }

  searchLoading.value = true
  searchPage.value = 1
  hasSearched.value = true
  try {
    const page = await searchMyTasks({
      keyword: searchKeyword.value.trim(),
      pageNum: searchPage.value,
      pageSize: 10
    })
    const records = Array.isArray(page?.records) ? page.records : []
    searchResults.value = records.map(normalizeTaskStatus)
    const total = Number(page?.total ?? searchResults.value.length)
    searchHasMore.value = searchPage.value * 10 < total
  } catch (error) {
    console.error('搜索任务失败:', error)
    searchResults.value = []
  } finally {
    searchLoading.value = false
  }
}

const loadMoreSearchResults = async () => {
  if (!searchHasMore.value || searchLoading.value) return

  searchLoading.value = true
  searchPage.value += 1
  try {
    const page = await searchMyTasks({
      keyword: searchKeyword.value.trim(),
      pageNum: searchPage.value,
      pageSize: 10
    })
    const records = Array.isArray(page?.records) ? page.records : []
    const normalized = records.map(normalizeTaskStatus)
    searchResults.value = [...searchResults.value, ...normalized]
    const total = Number(page?.total ?? searchResults.value.length)
    searchHasMore.value = searchPage.value * 10 < total
  } catch (error) {
    console.error('加载更多搜索结果失败:', error)
  } finally {
    searchLoading.value = false
  }
}

const clearSearch = () => {
  searchResults.value = []
  searchHasMore.value = false
  hasSearched.value = false
}

const openSearchResult = (task) => {
  router.push(`/task/${task.id}`)
  searchDialogVisible.value = false
}

const getTaskStatusText = (status) => {
  const statusMap = {
    pending: '排队中',
    processing: '处理中',
    completed: '已完成',
    failed: '失败'
  }
  return statusMap[status] || status
}

const formatTaskDate = (timestamp) => {
  return new Date(timestamp).toLocaleDateString('zh-CN', {
    month: '2-digit',
    day: '2-digit'
  })
}

watch(
  () => route.path,
  () => {
    if (window.innerWidth <= 960) {
      sidebarCollapsed.value = true
    }
    if (!isAuthPage.value) {
      fetchTaskList()
    }
  }
)

onMounted(() => {
  if (!isAuthPage.value) {
    fetchTaskList()
  }
})
</script>

<template>
  <div class="app-container">
    <template v-if="showSidebar">
      <aside class="workspace-sidebar" :class="{ collapsed: sidebarCollapsed }">
        <div class="sidebar-top">
          <div class="logo-row" v-show="!sidebarCollapsed">
            <div class="logo-container" @click="goHome">
              <img src="/logo.svg" alt="MindMooc" class="app-logo" />
              <h1 class="app-title">MindMooc</h1>
            </div>
            <div class="logo-actions">
              <button class="action-btn search-btn" @click="openSearchDialog">
                <el-icon><Search /></el-icon>
              </button>
              <button class="action-btn collapse-btn" @click="toggleSidebar">
                <el-icon>
                  <component :is="sidebarCollapsed ? 'Expand' : 'Fold'" />
                </el-icon>
              </button>
            </div>
          </div>
          <button v-show="sidebarCollapsed" class="collapse-btn collapse-alone" @click="toggleSidebar">
            <el-icon>
              <component :is="sidebarCollapsed ? 'Expand' : 'Fold'" />
            </el-icon>
          </button>
          <div class="logo-container collapsed-logo" v-show="sidebarCollapsed" @click="goHome">
            <img src="/logo.svg" alt="MindMooc" class="app-logo" />
          </div>
          <el-button
            v-show="!sidebarCollapsed"
            type="primary"
            class="new-task-btn"
            @click="goNewTask"
          >
            <el-icon><Plus /></el-icon>
            新建任务
          </el-button>
        </div>

        <div class="task-section" v-show="!sidebarCollapsed">
          <div class="task-title">历史任务</div>
          <div v-if="taskListLoading && !taskList.length" class="task-empty-state">任务加载中...</div>
          <div v-else-if="taskListError && !taskList.length" class="task-empty-state task-empty-error">{{ taskListError }}</div>
          <div v-else-if="!taskList.length" class="task-empty-state">暂无任务</div>
          <template v-else>
            <ul class="task-list">
              <li
                v-for="task in taskList"
                :key="task.id"
                class="task-item"
                :class="{ active: activeTaskId === String(task.id) }"
                @click="openTask(task)"
              >
                <div class="task-content">
                  <div class="task-main">{{ task.title }}</div>
                  <div class="task-meta">
                    <span>{{ getTaskStatusText(task.status) }}</span>
                    <span>{{ formatTaskDate(task.createdAt) }}</span>
                  </div>
                </div>
                <el-button
                  class="task-delete-btn"
                  text
                  circle
                  @click.stop="removeTask(task)"
                >
                  <el-icon><Delete /></el-icon>
                </el-button>
              </li>
            </ul>
            <el-button
              v-if="hasMoreTasks"
              class="load-more-btn"
              text
              :loading="taskListLoading"
              @click="loadMoreTasks"
            >
              更早
            </el-button>
          </template>
        </div>

        <div class="sidebar-bottom" v-show="!sidebarCollapsed">
          <el-menu
            :default-active="currentUtilityPath"
            class="utility-menu"
            @select="navigateTo"
          >
            <el-menu-item
              v-for="item in utilityMenuItems"
              :key="item.path"
              :index="item.path"
            >
              <el-icon><component :is="item.icon" /></el-icon>
              <span>{{ item.title }}</span>
            </el-menu-item>
          </el-menu>
        </div>
      </aside>

      <main class="workspace-main" :class="{ expanded: sidebarCollapsed }">
        <div class="main-content">
          <router-view />
        </div>
      </main>
    </template>

    <template v-else>
      <router-view />
    </template>

    <!-- 搜索弹窗 -->
    <el-dialog
      v-model="searchDialogVisible"
      title="搜索任务"
      width="460px"
      :show-close="true"
      :close-on-click-modal="true"
      class="search-dialog"
      @opened="focusSearchInput"
    >
      <div class="search-dialog-content">
        <div class="search-input-wrapper">
          <el-input
            ref="searchInputRef"
            v-model="searchKeyword"
            placeholder="输入任务标题关键词..."
            :prefix-icon="Search"
            clearable
            @keyup.enter="handleSearch"
            @clear="clearSearch"
          >
            <template #append>
              <el-button :loading="searchLoading" @click="handleSearch">
                搜索
              </el-button>
            </template>
          </el-input>
        </div>

        <div class="search-results" v-if="searchResults.length > 0 || searchLoading">
          <div v-if="searchLoading && !searchResults.length" class="search-loading">
            搜索中...
          </div>
          <template v-else>
            <ul class="search-result-list">
              <li
                v-for="task in searchResults"
                :key="task.id"
                class="search-result-item"
                @click="openSearchResult(task)"
              >
                <div class="result-content">
                  <div class="result-main">{{ task.title }}</div>
                  <div class="result-meta">
                    <span class="result-status">{{ getTaskStatusText(task.status) }}</span>
                    <span class="result-date">{{ formatTaskDate(task.createdAt || task.completedAt || task.startedAt) }}</span>
                  </div>
                </div>
                <el-icon class="result-arrow"><ArrowRight /></el-icon>
              </li>
            </ul>
            <el-button
              v-if="searchHasMore"
              class="load-more-btn"
              text
              :loading="searchLoading"
              @click="loadMoreSearchResults"
            >
              加载更多
            </el-button>
          </template>
        </div>

        <div v-else-if="hasSearched && searchKeyword && !searchLoading" class="search-empty">
          未找到相关任务
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<style scoped>
@font-face {
  font-family: 'Audiowide';
  src: url('./assets/fonts/Audiowide-Regular.ttf') format('truetype');
  font-weight: normal;
  font-style: normal;
  font-display: swap;
}

.app-container {
  min-height: 100vh;
  height: 100vh;
  display: flex;
  background: #f3f5f7;
}

.workspace-sidebar {
  width: 300px;
  border-right: 1px solid rgba(16, 185, 129, 0.12);
  background:
    radial-gradient(circle at -5% 0%, rgba(167, 243, 208, 0.2), transparent 44%),
    radial-gradient(circle at 120% 5%, rgba(165, 243, 252, 0.1), transparent 46%),
    linear-gradient(180deg, #f5fef9 0%, #effcf6 42%, #eaf9f2 100%);
  display: flex;
  flex-direction: column;
  padding: 16px 12px;
  gap: 12px;
  transition: width 0.24s ease;
  box-sizing: border-box;
}

.workspace-sidebar.collapsed {
  width: 72px;
  padding: 16px 10px;
}

.sidebar-top {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.logo-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.logo-actions {
  display: flex;
  align-items: center;
  gap: 6px;
}

.action-btn {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  border: 1px solid rgba(52, 211, 153, 0.24);
  background: rgba(250, 255, 252, 0.96);
  color: #166534;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.action-btn:hover {
  background: rgba(242, 255, 248, 0.98);
  border-color: rgba(45, 212, 191, 0.34);
}

.search-btn:hover {
  background: rgba(167, 243, 208, 0.3);
}

.collapse-btn {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  border: 1px solid rgba(52, 211, 153, 0.24);
  background: rgba(250, 255, 252, 0.96);
  color: #166534;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.collapse-btn:hover {
  background: rgba(242, 255, 248, 0.98);
  border-color: rgba(45, 212, 191, 0.34);
}

.collapse-alone {
  margin: 0 auto;
}

.logo-container {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 8px;
  border-radius: 12px;
  cursor: pointer;
}

.collapsed-logo {
  justify-content: center;
}

.app-logo {
  height: 34px;
  width: 34px;
  object-fit: contain;
}

.app-title {
  margin: 0;
  font-family: 'Audiowide', sans-serif;
  font-size: 21px;
  color: #0f5132;
  letter-spacing: 0.8px;
  text-shadow: 0 1px 0 rgba(255, 255, 255, 0.5);
}

.new-task-btn {
  width: 100%;
  height: 42px;
  border: 1px solid rgba(16, 185, 129, 0.24);
  background: linear-gradient(135deg, #4ade80 0%, #34d399 48%, #22d3ee 100%);
  box-shadow: 0 8px 14px rgba(16, 185, 129, 0.22);
  color: #ffffff;
}

.new-task-btn:hover {
  filter: saturate(1.12) brightness(1.02);
}

.task-section {
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding: 8px 4px;
}

.task-title {
  font-size: 13px;
  color: #0f6b4c;
  margin-bottom: 10px;
  padding: 0 8px;
  font-weight: 600;
}

.task-empty-state {
  padding: 14px 10px;
  color: #6b7280;
  font-size: 13px;
  text-align: center;
  background: rgba(251, 255, 253, 0.75);
  border: 1px dashed rgba(16, 185, 129, 0.16);
  border-radius: 10px;
}

.task-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.task-item {
  padding: 10px 10px;
  border-radius: 10px;
  background: rgba(251, 255, 253, 0.92);
  border: 1px solid rgba(167, 243, 208, 0.2);
  cursor: pointer;
  transition: transform 0.2s ease, background-color 0.2s ease, border-color 0.2s ease;
  display: flex;
  align-items: flex-start;
  gap: 8px;
  justify-content: space-between;
  position: relative;
}

.task-item:hover .task-delete-btn {
  opacity: 1;
  transform: translateX(0);
  pointer-events: auto;
}

.task-item:hover {
  transform: translateY(-1px);
  background: rgba(255, 255, 255, 0.95);
  border-color: rgba(110, 231, 183, 0.28);
}

.task-item.active {
  background: linear-gradient(135deg, rgba(167, 243, 208, 0.26), rgba(165, 243, 252, 0.2));
  border-color: rgba(94, 234, 212, 0.3);
  box-shadow: 0 3px 8px rgba(110, 231, 183, 0.1);
}

.task-content {
  flex: 1;
  min-width: 0;
}

.task-main {
  font-size: 13px;
  color: #0f3d30;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  padding-right: 28px;
}

.task-meta {
  margin-top: 6px;
  font-size: 12px;
  color: #517d6d;
  display: flex;
  justify-content: space-between;
  gap: 10px;
  padding-right: 28px;
}

.task-delete-btn {
  position: absolute;
  top: 10px;
  right: 10px;
  flex-shrink: 0;
  width: 24px;
  height: 24px;
  min-width: 24px;
  opacity: 0;
  transform: translateX(4px);
  pointer-events: none;
  transition: opacity 0.18s ease, transform 0.18s ease, background-color 0.18s ease;
  color: #ef4444;
  border-radius: 8px;
  padding: 0;
}

.task-delete-btn:hover {
  background: rgba(239, 68, 68, 0.08);
  color: #dc2626;
}

.load-more-btn {
  width: 100%;
  margin-top: 8px;
  color: #0f766e;
  border-radius: 8px;
}

.sidebar-bottom {
  border-top: 1px solid rgba(16, 185, 129, 0.2);
  padding-top: 8px;
}

.utility-menu {
  border-right: none;
  background: transparent;
}

.utility-menu :deep(.el-menu-item) {
  height: 42px;
  border-radius: 10px;
  margin: 3px 0;
  color: #14532d;
  transition: background-color 0.2s ease;
}

.utility-menu :deep(.el-menu-item:hover) {
  background: rgba(167, 243, 208, 0.12);
}

.utility-menu :deep(.el-menu-item.is-active) {
  background: linear-gradient(135deg, rgba(167, 243, 208, 0.2), rgba(165, 243, 252, 0.16));
  color: #0f5132;
}

.workspace-main {
  flex: 1;
  min-width: 0;
  padding: 16px;
  transition: padding 0.24s ease;
  background: #fcfcfd;
}

.workspace-main.expanded {
  padding-left: 12px;
}

.main-content {
  height: calc(100vh - 32px);
  overflow: auto;
  background: #ffffff;
  border-radius: 18px;
  box-shadow: 0 8px 16px rgba(15, 23, 42, 0.05);
  border: 1px solid #eef2f7;
  padding: 24px;
  box-sizing: border-box;
}

@media (max-width: 960px) {
  .workspace-sidebar {
    width: 72px;
    padding: 16px 10px;
  }

  .task-section,
  .sidebar-bottom,
  .new-task-btn,
  .logo-row {
    display: none;
  }

  .workspace-main {
    padding: 10px;
  }

  .main-content {
    height: calc(100vh - 20px);
    padding: 14px;
  }
}

/* 搜索弹窗样式 */
.search-dialog :deep(.el-dialog) {
  border-radius: 16px;
  overflow: hidden;
}

.search-dialog :deep(.el-dialog__header) {
  padding: 20px 24px 16px;
  margin: 0;
  border-bottom: 1px solid rgba(16, 185, 129, 0.12);
}

.search-dialog :deep(.el-dialog__title) {
  font-size: 18px;
  font-weight: 600;
  color: #0f5132;
}

.search-dialog :deep(.el-dialog__body) {
  padding: 0;
}

.search-dialog-content {
  padding: 20px 24px 24px;
}

.search-input-wrapper {
  margin-bottom: 16px;
}

.search-input-wrapper :deep(.el-input__wrapper) {
  border-radius: 10px 0 0 10px;
  box-shadow: 0 0 0 1px rgba(16, 185, 129, 0.2);
}

.search-input-wrapper :deep(.el-input__wrapper:focus-within) {
  box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.3);
}

.search-input-wrapper :deep(.el-input-group__append) {
  background: linear-gradient(135deg, #4ade80 0%, #34d399 100%);
  border: none;
  border-radius: 0 10px 10px 0;
  color: white;
  padding: 0;
  box-sizing: border-box;
}

.search-input-wrapper :deep(.el-input-group__append .el-button) {
  margin: 0;
  height: 100%;
  min-height: 32px;
  border-radius: 0 10px 10px 0;
}

.search-input-wrapper :deep(.el-input-group__append:hover) {
  filter: brightness(1.05);
}

.search-results {
  max-height: 400px;
  overflow-y: auto;
}

.search-loading {
  text-align: center;
  padding: 20px;
  color: #6b7280;
  font-size: 14px;
}

.search-result-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.search-result-item {
  padding: 14px 16px;
  border-radius: 12px;
  background: rgba(251, 255, 253, 0.92);
  border: 1px solid rgba(167, 243, 208, 0.2);
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.search-result-item:hover {
  transform: translateY(-1px);
  background: rgba(255, 255, 255, 0.95);
  border-color: rgba(110, 231, 183, 0.35);
  box-shadow: 0 4px 12px rgba(110, 231, 183, 0.15);
}

.result-content {
  flex: 1;
  min-width: 0;
}

.result-main {
  font-size: 14px;
  color: #0f3d30;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-bottom: 6px;
}

.result-meta {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  font-size: 12px;
  color: #517d6d;
}

.result-status {
  padding: 2px 8px;
  border-radius: 6px;
  background: rgba(16, 185, 129, 0.1);
  color: #0f766e;
}

.result-arrow {
  color: #9ca3af;
  transition: transform 0.2s ease;
}

.search-result-item:hover .result-arrow {
  transform: translateX(4px);
  color: #166534;
}

.search-empty {
  text-align: center;
  padding: 32px 16px;
  color: #6b7280;
  font-size: 14px;
  background: rgba(251, 255, 253, 0.75);
  border: 1px dashed rgba(16, 185, 129, 0.16);
  border-radius: 12px;
}

.load-more-btn {
  width: 100%;
  margin-top: 12px;
  color: #0f766e;
  border-radius: 8px;
}

.load-more-btn:hover {
  background: rgba(16, 185, 129, 0.08);
}
</style>
