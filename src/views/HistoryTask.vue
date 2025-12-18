<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { listMyTasks } from '@/api/task'

const router = useRouter()

// 任务列表和筛选
const taskList = ref([])
const loading = ref(false)
const searchKeyword = ref('')
const statusFilter = ref('')
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)

// 状态选项（与后端状态保持一致：pending / processing / completed / failed）
const statusOptions = [
  { label: '全部状态', value: '' },
  { label: '排队中', value: 'pending' },
  { label: '处理中', value: 'processing' },
  { label: '已完成', value: 'completed' },
  { label: '处理失败', value: 'failed' }
]

// 从后端获取任务列表
const fetchTasks = async () => {
  loading.value = true

  try {
    const params = {
      pageNum: currentPage.value,
      pageSize: pageSize.value
    }

    const page = await listMyTasks(params)

    // IPage<TaskVO>
    total.value = page?.total ?? 0
    const records = Array.isArray(page?.records) ? page.records : []

    // 本地搜索 / 状态过滤（在当前页内过滤）
    let filtered = records

    if (searchKeyword.value) {
      const keyword = searchKeyword.value.toLowerCase()
      filtered = filtered.filter((task) =>
        (task.title || '').toLowerCase().includes(keyword)
      )
    }

    if (statusFilter.value) {
      filtered = filtered.filter((task) => task.status === statusFilter.value)
    }

    taskList.value = filtered.map((task) => ({
      id: task.id,
      name: task.title,
      status: task.status,
      createTime: task.createdAt,
      completeTime: task.completedAt,
      fileSize: task.video?.fileSize ?? 0,
      duration: task.video?.duration ?? 0
    }))
  } catch (error) {
    console.error('获取任务列表失败:', error)
    ElMessage.error(error.message || '获取任务列表失败')
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

// 获取状态标签类型
const getStatusType = (status) => {
  const statusMap = {
    pending: 'info',
    processing: 'warning',
    completed: 'success',
    failed: 'danger'
  }
  return statusMap[status] || ''
}

// 获取状态文本
const getStatusText = (status) => {
  const statusMap = {
    pending: '排队中',
    processing: '处理中',
    completed: '已完成',
    failed: '处理失败'
  }
  return statusMap[status] || '未知状态'
}

// 格式化时间
const formatTime = (timeStr) => {
  if (!timeStr) return '-'
  return new Date(timeStr).toLocaleString('zh-CN')
}

// 格式化文件大小（字节 -> MB 文本）
const formatFileSize = (size) => {
  if (!size || size <= 0) return '-'
  const mb = size / 1024 / 1024
  return `${mb.toFixed(1)}MB`
}

// 格式化视频时长（秒 -> mm:ss）
const formatDuration = (seconds) => {
  if (!seconds || seconds <= 0) return '-'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  const mm = String(mins).padStart(2, '0')
  const ss = String(secs).padStart(2, '0')
  return `${mm}:${ss}`
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

        <el-table-column prop="fileSize" label="文件大小" width="120">
          <template #default="{ row }">
            {{ formatFileSize(row.fileSize) }}
          </template>
        </el-table-column>
        <el-table-column prop="duration" label="时长" width="100">
          <template #default="{ row }">
            {{ formatDuration(row.duration) }}
          </template>
        </el-table-column>

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
  margin-bottom: 20px;
  text-align: center;
  padding: 12px 0;
}

.page-title {
  font-size: 26px;
  color: #2c3e50;
  margin: 0 0 6px 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  line-height: 1;
  font-weight: 700;
}

.page-title .el-icon {
  font-size: 26px;
  display: inline-flex;
  align-items: center;
  line-height: 1;
  transform: translateY(1px);
}

.page-description {
  color: #64748b;
  font-size: 14px;
  margin: 0;
}

.filter-card {
  margin-bottom: 20px;
  border-radius: 12px;
  border: 1px solid rgba(226, 232, 240, 0.8);
  box-shadow: 0 2px 12px rgba(15, 23, 42, 0.08);
  transition: all 0.3s ease;
}

.filter-card:hover {
  box-shadow: 0 4px 20px rgba(15, 23, 42, 0.12);
  transform: translateY(-1px);
}

.filter-card :deep(.el-card__body) {
  padding: 20px;
}

.filter-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
}

.search-group {
  display: flex;
  gap: 12px;
  flex: 1;
}

.search-group :deep(.el-input__wrapper) {
  border-radius: 8px;
  transition: all 0.3s ease;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.search-group :deep(.el-input__wrapper:hover) {
  box-shadow: 0 2px 8px rgba(34, 211, 238, 0.15);
}

.search-group :deep(.el-select__wrapper) {
  border-radius: 8px;
  transition: all 0.3s ease;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.search-group :deep(.el-select__wrapper:hover) {
  box-shadow: 0 2px 8px rgba(34, 211, 238, 0.15);
}

.action-group {
  display: flex;
  gap: 10px;
}

.action-group .el-button {
  border-radius: 8px;
  font-weight: 500;
  transition: all 0.3s ease;
}

.action-group .el-button--primary {
  background: linear-gradient(135deg, #4ade80 0%, #22d3ee 100%);
  border: none;
  box-shadow: 0 2px 8px rgba(34, 211, 238, 0.25);
}

.action-group .el-button--primary:hover {
  box-shadow: 0 4px 12px rgba(34, 211, 238, 0.35);
  transform: translateY(-1px);
}

.action-group .el-button--default {
  border: 1px solid #e2e8f0;
}

.action-group .el-button--default:hover {
  border-color: #cbd5e1;
  background: #f8fafc;
}

.task-list-card {
  border-radius: 12px;
  border: 1px solid rgba(226, 232, 240, 0.8);
  box-shadow: 0 2px 12px rgba(15, 23, 42, 0.08);
  transition: all 0.3s ease;
}

.task-list-card:hover {
  box-shadow: 0 4px 20px rgba(15, 23, 42, 0.12);
  transform: translateY(-1px);
}

.task-list-card :deep(.el-card__header) {
  background: linear-gradient(135deg, rgba(74, 222, 128, 0.05) 0%, rgba(34, 211, 238, 0.05) 100%);
  border-bottom: 1px solid rgba(226, 232, 240, 0.8);
  padding: 16px 20px;
  border-radius: 12px 12px 0 0;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
  font-size: 16px;
  color: #2c3e50;
}

.task-count {
  font-size: 14px;
  color: #64748b;
  font-weight: normal;
}

.task-list-card :deep(.el-table) {
  border-radius: 0;
}

.task-list-card :deep(.el-table__header) {
  background: #f8fafc;
}

.task-list-card :deep(.el-table__header th) {
  background: #f8fafc;
  color: #2c3e50;
  font-weight: 600;
  border-bottom: 2px solid #e2e8f0;
}

.task-list-card :deep(.el-table__row:hover) {
  background: #f0fdf4;
}

.task-name {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 500;
}

.task-name .el-icon {
  color: #22d3ee;
}

.action-buttons {
  display: flex;
  gap: 8px;
  align-items: center;
  justify-content: flex-start;
}

.action-buttons .el-button {
  border-radius: 6px;
  font-weight: 500;
  transition: all 0.2s ease;
}

.action-buttons .el-button--primary {
  background: linear-gradient(135deg, #4ade80 0%, #22d3ee 100%);
  border: none;
}

.action-buttons .el-button--primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(34, 211, 238, 0.3);
}

.action-buttons .el-button--danger:hover {
  transform: translateY(-1px);
}

.pagination-wrapper {
  display: flex;
  justify-content: center;
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid #e2e8f0;
}

.pagination-wrapper :deep(.el-pagination) {
  --el-pagination-button-color: #64748b;
  --el-pagination-hover-color: #22d3ee;
  --el-pagination-bg-color: #ffffff;
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
