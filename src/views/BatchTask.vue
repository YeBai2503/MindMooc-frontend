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

.task-config-card,
.upload-card,
.task-list-card {
  border-radius: 12px;
  border: 1px solid rgba(226, 232, 240, 0.8);
  box-shadow: 0 2px 12px rgba(15, 23, 42, 0.08);
  transition: all 0.3s ease;
  margin-bottom: 20px;
}

.task-config-card:hover,
.upload-card:hover,
.task-list-card:hover {
  box-shadow: 0 4px 20px rgba(15, 23, 42, 0.12);
  transform: translateY(-1px);
}

.task-config-card :deep(.el-card__header),
.upload-card :deep(.el-card__header),
.task-list-card :deep(.el-card__header) {
  background: linear-gradient(135deg, rgba(74, 222, 128, 0.05) 0%, rgba(34, 211, 238, 0.05) 100%);
  border-bottom: 1px solid rgba(226, 232, 240, 0.8);
  padding: 16px 20px;
  border-radius: 12px 12px 0 0;
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
  font-size: 15px;
  white-space: nowrap;
}

.config-label .required {
  color: #f56c6c;
  margin-left: 2px;
}

.config-item :deep(.el-input__wrapper) {
  border-radius: 8px;
  transition: all 0.3s ease;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.config-item :deep(.el-input__wrapper:hover) {
  box-shadow: 0 2px 8px rgba(34, 211, 238, 0.15);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
  font-size: 16px;
  color: #2c3e50;
}

.header-actions {
  display: flex;
  gap: 8px;
}

.header-actions .el-button {
  border-radius: 8px;
  font-weight: 500;
}

.batch-upload {
  width: 100%;
}

.batch-upload :deep(.el-upload-dragger) {
  border-radius: 12px;
  border: 2px dashed #cbd5e1;
  background: linear-gradient(135deg, #f8fafc 0%, #f0fdf4 50%, #ecfeff 100%);
  transition: all 0.3s ease;
  padding: 30px 20px;
}

.batch-upload :deep(.el-upload-dragger:hover) {
  border-color: #22d3ee;
  background: linear-gradient(135deg, #f0fdf4 0%, #ecfeff 50%, #f0f9ff 100%);
  transform: translateY(-1px);
  box-shadow: 0 4px 16px rgba(34, 211, 238, 0.15);
}

.upload-content {
  padding: 10px;
  text-align: center;
}

.upload-icon {
  font-size: 40px;
  background: linear-gradient(135deg, #4ade80 0%, #22d3ee 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 12px;
}

.upload-text p {
  margin: 6px 0;
  font-size: 14px;
}

.upload-text em {
  color: #22d3ee;
  font-style: normal;
  font-weight: 600;
}

.upload-tip {
  font-size: 12px;
  color: #94a3b8;
}

.task-list-card .card-header .el-button {
  background: linear-gradient(135deg, #4ade80 0%, #22d3ee 100%);
  border: none;
  box-shadow: 0 2px 8px rgba(34, 211, 238, 0.25);
}

.task-list-card .card-header .el-button:hover {
  box-shadow: 0 4px 12px rgba(34, 211, 238, 0.35);
  transform: translateY(-1px);
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
  border: 2px solid #e2e8f0;
  border-radius: 10px;
  background: linear-gradient(135deg, #fafbfc 0%, #f8fafc 100%);
  transition: all 0.3s ease;
}

.task-item:hover {
  border-color: #86efac;
  background: linear-gradient(135deg, #ecfdf5 0%, #f0fdfa 100%);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(34, 211, 238, 0.15);
}

.task-info {
  flex: 1;
  min-width: 0;
}

.task-name {
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: 600;
  margin-bottom: 6px;
  color: #2c3e50;
}

.task-name .el-icon {
  color: #22d3ee;
  font-size: 18px;
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
  font-size: 13px;
  color: #64748b;
}

.task-progress {
  width: 200px;
  margin: 0 16px;
}

.task-progress :deep(.el-progress-bar__outer) {
  border-radius: 10px;
}

.task-progress :deep(.el-progress-bar__inner) {
  background: linear-gradient(135deg, #4ade80 0%, #22d3ee 100%);
}

.task-actions {
  display: flex;
  gap: 8px;
}

.task-actions .el-button {
  border-radius: 6px;
  font-weight: 500;
  transition: all 0.2s ease;
}

.task-actions .el-button--primary {
  background: linear-gradient(135deg, #4ade80 0%, #22d3ee 100%);
  border: none;
}

.task-actions .el-button--primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(34, 211, 238, 0.3);
}

.task-actions .el-button--danger:hover {
  transform: translateY(-1px);
}
</style>
