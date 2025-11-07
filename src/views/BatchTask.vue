<script setup>
import { ref } from 'vue'
import { ElMessage } from 'element-plus'

// 批量任务列表
const taskList = ref([])
const uploading = ref(false)
const batchTaskName = ref('')

// 添加任务到列表
const handleFilesChange = (files) => {
  const newTasks = Array.from(files).map((file, index) => ({
    id: Date.now() + index,
    name: file.name.replace(/\.[^/.]+$/, ''), // 移除文件扩展名
    file: file,
    status: 'pending', // pending, processing, completed, error
    progress: 0,
    result: null
  }))
  
  taskList.value.push(...newTasks)
  return false // 阻止自动上传
}

// 移除任务
const removeTask = (taskId) => {
  const index = taskList.value.findIndex(task => task.id === taskId)
  if (index > -1) {
    taskList.value.splice(index, 1)
  }
}

// 开始批量处理
const startBatchProcess = async () => {
  if (taskList.value.length === 0) {
    ElMessage.warning('请先添加视频文件')
    return
  }
  
  if (!batchTaskName.value.trim()) {
    ElMessage.warning('请输入批量任务名称')
    return
  }

  uploading.value = true

  // 模拟批量处理
  for (let task of taskList.value) {
    if (task.status === 'pending') {
      task.status = 'processing'
      
      // 模拟处理进度
      for (let i = 0; i <= 100; i += 10) {
        task.progress = i
        await new Promise(resolve => setTimeout(resolve, 100))
      }
      
      task.status = 'completed'
      task.result = `task-${task.id}` // 模拟结果ID
    }
  }

  uploading.value = false
  ElMessage.success('批量处理完成！')
}

// 清空列表
const clearList = () => {
  taskList.value = []
  batchTaskName.value = ''
}

// 获取状态标签类型
const getStatusType = (status) => {
  const statusMap = {
    pending: '',
    processing: 'warning',
    completed: 'success',
    error: 'danger'
  }
  return statusMap[status] || ''
}

// 获取状态文本
const getStatusText = (status) => {
  const statusMap = {
    pending: '等待处理',
    processing: '处理中',
    completed: '已完成',
    error: '处理失败'
  }
  return statusMap[status] || '未知状态'
}
</script>

<template>
  <div class="batch-task-container">
    <div class="page-header">
      <h2 class="page-title">
        <el-icon><Files /></el-icon>
        批量任务
      </h2>
      <p class="page-description">一次性上传多个视频文件，批量生成思维导图</p>
    </div>

    <!-- 任务设置区域 -->
    <el-card class="task-config-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <span>任务设置</span>
        </div>
      </template>
      
      <div class="task-config">
        <div class="config-item">
          <label class="config-label">批量任务名称 <span class="required">*</span></label>
          <el-input
            v-model="batchTaskName"
            placeholder="请输入批量任务名称，便于管理"
            maxlength="50"
            show-word-limit
            style="width: 350px"
          />
        </div>
      </div>
    </el-card>

    <!-- 文件上传区域 -->
    <el-card class="upload-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <span>添加视频文件</span>
          <div class="header-actions">
            <el-button size="small" @click="clearList" :disabled="taskList.length === 0">
              清空列表
            </el-button>
          </div>
        </div>
      </template>

      <el-upload
        class="batch-upload"
        drag
        multiple
        :before-upload="() => false"
        :on-change="(file, fileList) => handleFilesChange([file.raw])"
        accept="video/*"
        :show-file-list="false"
      >
        <div class="upload-content">
          <el-icon class="upload-icon"><FolderAdd /></el-icon>
          <div class="upload-text">
            <p>将多个视频文件拖拽到此处，或<em>点击选择文件</em></p>
            <p class="upload-tip">支持同时选择多个文件，单个文件不超过 500MB</p>
          </div>
        </div>
      </el-upload>
    </el-card>

    <!-- 任务列表 -->
    <el-card v-if="taskList.length > 0" class="task-list-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <span>任务列表 ({{ taskList.length }})</span>
          <el-button
            type="primary"
            :loading="uploading"
            @click="startBatchProcess"
            :disabled="taskList.every(task => task.status !== 'pending')"
          >
            {{ uploading ? '处理中...' : '开始批量处理' }}
          </el-button>
        </div>
      </template>

      <div class="task-list">
        <div
          v-for="task in taskList"
          :key="task.id"
          class="task-item"
        >
          <div class="task-info">
            <div class="task-name">
              <el-icon><VideoPlay /></el-icon>
              <span>{{ task.name }}</span>
            </div>
            <div class="task-meta">
              <el-tag :type="getStatusType(task.status)" size="small">
                {{ getStatusText(task.status) }}
              </el-tag>
              <span class="file-size">{{ (task.file.size / 1024 / 1024).toFixed(1) }}MB</span>
            </div>
          </div>

          <div class="task-progress" v-if="task.status === 'processing'">
            <el-progress :percentage="task.progress" :show-text="false" />
          </div>

          <div class="task-actions">
            <el-button
              v-if="task.status === 'completed'"
              type="primary"
              size="small"
              @click="$router.push(`/task/${task.result}`)"
            >
              查看结果
            </el-button>
            <el-button
              type="danger"
              size="small"
              @click="removeTask(task.id)"
              :disabled="task.status === 'processing'"
            >
              <el-icon><Delete /></el-icon>
            </el-button>
          </div>
        </div>
      </div>
    </el-card>

    <!-- 空状态 -->
    <el-empty
      v-if="taskList.length === 0"
      description="暂无任务，请添加视频文件"
      :image-size="120"
    />
  </div>
</template>

<style scoped>
.batch-task-container {
  max-width: 1000px;
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

.task-config-card {
  margin-bottom: 24px;
}

.task-config {
  padding: 20px 0;
}

.config-item {
  display: flex;
  align-items: center;
  gap: 16px;
}

.config-label {
  font-weight: 600;
  color: #2c3e50;
  font-size: 14px;
  white-space: nowrap;
}

.config-label .required {
  color: #f56c6c;
  margin-left: 2px;
}

.upload-card {
  margin-bottom: 24px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
}

.header-actions {
  display: flex;
  gap: 8px;
}

.batch-upload {
  width: 100%;
}

.upload-content {
  padding: 40px 20px;
  text-align: center;
}

.upload-icon {
  font-size: 48px;
  color: #22d3ee;
  margin-bottom: 16px;
}

.upload-text p {
  margin: 8px 0;
}

.upload-tip {
  font-size: 12px;
  color: #909399;
}

.task-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.task-item {
  display: flex;
  align-items: center;
  padding: 16px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #fafbfc;
  transition: all 0.3s ease;
}

.task-item:hover {
  border-color: #22d3ee;
  background: #ecfdf5;
}

.task-info {
  flex: 1;
  min-width: 0;
}

.task-name {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 500;
  margin-bottom: 4px;
}

.task-name span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.task-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 12px;
  color: #64748b;
}

.task-progress {
  width: 200px;
  margin: 0 16px;
}

.task-actions {
  display: flex;
  gap: 8px;
}
</style>
