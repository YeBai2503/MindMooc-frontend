<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

// 任务列表和筛选
const taskList = ref([])
const loading = ref(false)
const searchKeyword = ref('')
const statusFilter = ref('')
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)

// 状态选项
const statusOptions = [
  { label: '全部状态', value: '' },
  { label: '处理中', value: 'processing' },
  { label: '已完成', value: 'completed' },
  { label: '处理失败', value: 'error' }
]

// 模拟数据
const mockTasks = [
  {
    id: 1,
    name: '机器学习基础课程',
    status: 'completed',
    createTime: '2024-01-15 14:30:00',
    completeTime: '2024-01-15 14:35:00',
    fileSize: '125.6MB',
    duration: '45:30'
  },
  {
    id: 2,
    name: 'Vue3实战教程',
    status: 'completed',
    createTime: '2024-01-14 10:20:00',
    completeTime: '2024-01-14 10:28:00',
    fileSize: '89.2MB',
    duration: '32:15'
  },
  {
    id: 3,
    name: 'Python数据分析',
    status: 'processing',
    createTime: '2024-01-13 16:45:00',
    completeTime: null,
    fileSize: '234.8MB',
    duration: '78:20'
  },
  {
    id: 4,
    name: '深度学习入门',
    status: 'error',
    createTime: '2024-01-12 09:15:00',
    completeTime: null,
    fileSize: '156.3MB',
    duration: '52:40'
  }
]

// 获取任务列表
const fetchTasks = async () => {
  loading.value = true
  
  try {
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    let filteredTasks = [...mockTasks]
    
    // 搜索过滤
    if (searchKeyword.value) {
      filteredTasks = filteredTasks.filter(task =>
        task.name.toLowerCase().includes(searchKeyword.value.toLowerCase())
      )
    }
    
    // 状态过滤
    if (statusFilter.value) {
      filteredTasks = filteredTasks.filter(task => task.status === statusFilter.value)
    }
    
    total.value = filteredTasks.length
    
    // 分页
    const start = (currentPage.value - 1) * pageSize.value
    const end = start + pageSize.value
    taskList.value = filteredTasks.slice(start, end)
    
  } catch (error) {
    console.error('获取任务列表失败:', error)
  } finally {
    loading.value = false
  }
}

// 搜索
const handleSearch = () => {
  currentPage.value = 1
  fetchTasks()
}

// 重置搜索
const resetSearch = () => {
  searchKeyword.value = ''
  statusFilter.value = ''
  currentPage.value = 1
  fetchTasks()
}

// 页码改变
const handlePageChange = (page) => {
  currentPage.value = page
  fetchTasks()
}

// 查看任务详情
const viewTask = (taskId) => {
  router.push(`/task/${taskId}`)
}

// 删除任务
const deleteTask = async (taskId) => {
  try {
    // 模拟删除API
    await new Promise(resolve => setTimeout(resolve, 500))
    
    const index = taskList.value.findIndex(task => task.id === taskId)
    if (index > -1) {
      taskList.value.splice(index, 1)
      total.value--
    }
  } catch (error) {
    console.error('删除任务失败:', error)
  }
}

// 获取状态标签类型
const getStatusType = (status) => {
  const statusMap = {
    processing: 'warning',
    completed: 'success',
    error: 'danger'
  }
  return statusMap[status] || ''
}

// 获取状态文本
const getStatusText = (status) => {
  const statusMap = {
    processing: '处理中',
    completed: '已完成',
    error: '处理失败'
  }
  return statusMap[status] || '未知状态'
}

// 格式化时间
const formatTime = (timeStr) => {
  if (!timeStr) return '-'
  return new Date(timeStr).toLocaleString('zh-CN')
}

onMounted(() => {
  fetchTasks()
})
</script>

<template>
  <div class="history-task-container">
    <div class="page-header">
      <h2 class="page-title">
        <el-icon><Clock /></el-icon>
        历史任务
      </h2>
      <p class="page-description">查看和管理所有历史任务记录</p>
    </div>

    <!-- 搜索和筛选 -->
    <el-card class="filter-card" shadow="hover">
      <div class="filter-row">
        <div class="search-group">
          <el-input
            v-model="searchKeyword"
            placeholder="搜索任务名称"
            style="width: 300px"
            @keyup.enter="handleSearch"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
          
          <el-select
            v-model="statusFilter"
            placeholder="选择状态"
            style="width: 150px"
          >
            <el-option
              v-for="option in statusOptions"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            />
          </el-select>
        </div>
        
        <div class="action-group">
          <el-button type="primary" @click="handleSearch">
            <el-icon><Search /></el-icon>
            搜索
          </el-button>
          <el-button @click="resetSearch">
            <el-icon><Refresh /></el-icon>
            重置
          </el-button>
        </div>
      </div>
    </el-card>

    <!-- 任务列表 -->
    <el-card class="task-list-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <span>任务列表</span>
          <span class="task-count">共 {{ total }} 个任务</span>
        </div>
      </template>

      <el-table
        :data="taskList"
        v-loading="loading"
        stripe
        style="width: 100%"
      >
        <el-table-column prop="name" label="任务名称" min-width="200">
          <template #default="{ row }">
            <div class="task-name">
              <el-icon><VideoPlay /></el-icon>
              <span>{{ row.name }}</span>
            </div>
          </template>
        </el-table-column>

        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)" size="small">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="fileSize" label="文件大小" width="100" />
        <el-table-column prop="duration" label="时长" width="100" />

        <el-table-column prop="createTime" label="创建时间" width="180">
          <template #default="{ row }">
            {{ formatTime(row.createTime) }}
          </template>
        </el-table-column>

        <el-table-column prop="completeTime" label="完成时间" width="180">
          <template #default="{ row }">
            {{ formatTime(row.completeTime) }}
          </template>
        </el-table-column>

        <el-table-column label="操作" width="160" fixed="right">
          <template #default="{ row }">
            <div class="action-buttons">
              <el-button
                type="primary"
                size="small"
                @click="viewTask(row.id)"
              >
                查看详情
              </el-button>
              <el-popconfirm
                title="确定要删除这个任务吗？"
                @confirm="deleteTask(row.id)"
              >
                <template #reference>
                  <el-button type="danger" size="small">
                    删除
                  </el-button>
                </template>
              </el-popconfirm>
            </div>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="currentPage"
          :page-size="pageSize"
          :total="total"
          layout="total, prev, pager, next, jumper"
          @current-change="handlePageChange"
        />
      </div>
    </el-card>

    <!-- 空状态 -->
    <el-empty
      v-if="!loading && taskList.length === 0"
      description="暂无历史任务"
      :image-size="120"
    />
  </div>
</template>

<style scoped>
.history-task-container {
  max-width: 1200px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 24px;
  text-align: center;
}

.page-title {
  font-size: 28px;
  color: #2c3e50;
  margin: 0 0 8px 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.page-description {
  color: #64748b;
  font-size: 16px;
  margin: 0;
}

.filter-card {
  margin-bottom: 24px;
}

.filter-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
}

.search-group {
  display: flex;
  gap: 16px;
}

.action-group {
  display: flex;
  gap: 8px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
}

.task-count {
  font-size: 14px;
  color: #64748b;
  font-weight: normal;
}

.task-name {
  display: flex;
  align-items: center;
  gap: 8px;
}

.action-buttons {
  display: flex;
  gap: 8px;
  align-items: center;
  justify-content: flex-start;
}

.pagination-wrapper {
  display: flex;
  justify-content: center;
  margin-top: 24px;
}

@media (max-width: 768px) {
  .filter-row {
    flex-direction: column;
    align-items: stretch;
  }
  
  .search-group {
    flex-direction: column;
  }
  
  .action-buttons {
    flex-direction: column;
  }
}
</style>
