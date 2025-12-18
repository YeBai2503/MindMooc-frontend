<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { uploadVideo } from '@/api/video'
import { createTask } from '@/api/task'

const router = useRouter()

// 表单数据
const form = ref({
  taskName: '',
  videoFile: null,
  description: ''
})

// 上传状态
const uploading = ref(false)

// 文件上传处理（只在前端保存文件对象，不直接上传）
// Element Plus 的 before-upload 回调参数是原始文件对象 rawFile
const handleFileChange = (rawFile) => {
  form.value.videoFile = rawFile
  return false // 阻止 el-upload 自己发请求，改为我们手动调用 uploadVideo
}

// 提交任务：上传视频 -> 创建任务 -> 跳转详情
const submitTask = async () => {
  if (!form.value.taskName) {
    ElMessage.warning('请输入任务名称')
    return
  }
  if (!form.value.videoFile) {
    ElMessage.warning('请选择视频文件')
    return
  }

  uploading.value = true

  try {
    // 1. 上传视频
    const video = await uploadVideo(form.value.videoFile, form.value.taskName)

    if (!video?.id) {
      throw new Error('视频上传结果异常')
    }

    // 2. 创建任务
    const task = await createTask({
      videoId: video.id,
      title: form.value.taskName,
      requirement: form.value.description || '',
      taskType: 'common'
    })

    if (!task?.id) {
      throw new Error('任务创建结果异常')
    }

    ElMessage.success('任务创建成功，正在进入任务等待页')

    // 如果任务已经是完成状态则直接跳详情，否则进入等待页轮询
    if (task.status === 'completed') {
      router.push(`/task/${task.id}`)
    } else {
      router.push(`/task/wait/${task.id}`)
    }
  } catch (error) {
    console.error('创建任务失败:', error)
    ElMessage.error(error.message || '任务创建失败，请重试')
  } finally {
    uploading.value = false
  }
}

// 重置表单
const resetForm = () => {
  form.value = {
    taskName: '',
    videoFile: null,
    description: ''
  }
}
</script>

<template>
  <div class="new-task-container">
    <div class="page-header">
      <h2 class="page-title">
        <el-icon><Plus /></el-icon>
        新建任务
      </h2>
      <p class="page-description">上传慕课视频，生成对应的思维导图</p>
    </div>

    <el-card class="task-form-card" shadow="hover">
      <el-form :model="form" label-width="120px" size="large">
        <el-form-item label="任务名称" required>
          <el-input
            v-model="form.taskName"
            placeholder="请输入任务名称"
            maxlength="50"
            show-word-limit
          />
        </el-form-item>

        <el-form-item label="视频文件" required>
          <el-upload
            class="video-upload"
            drag
            :before-upload="handleFileChange"
            :show-file-list="false"
            accept="video/*"
          >
            <div class="upload-content">
              <el-icon class="upload-icon"><VideoPlay /></el-icon>
              <div class="upload-text">
                <p>将视频文件拖拽到此处，或<em>点击上传</em></p>
                <p class="upload-tip">支持 MP4、AVI、MOV 等格式，文件大小不超过 500MB</p>
              </div>
            </div>
          </el-upload>
          
          <div v-if="form.videoFile" class="file-info">
            <el-icon><Document /></el-icon>
            <span>{{ form.videoFile.name }}</span>
            <el-button type="text" @click="form.videoFile = null">
              <el-icon><Delete /></el-icon>
            </el-button>
          </div>
        </el-form-item>

        <el-form-item label="任务描述">
          <el-input
            v-model="form.description"
            type="textarea"
            :rows="4"
            placeholder="请输入任务描述（可选）"
            maxlength="200"
            show-word-limit
          />
        </el-form-item>

        <el-form-item>
          <div class="form-actions">
            <el-button size="large" @click="resetForm">重置</el-button>
            <el-button
              type="primary"
              size="large"
              :loading="uploading"
              @click="submitTask"
            >
              {{ uploading ? '处理中...' : '创建任务' }}
            </el-button>
          </div>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 使用说明 -->
    <el-card class="help-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <el-icon><QuestionFilled /></el-icon>
          <span>使用说明</span>
        </div>
      </template>
      <div class="help-content">
        <ol>
          <li>选择要分析的慕课视频文件</li>
          <li>输入任务名称，便于后续管理</li>
          <li>点击"创建任务"开始处理</li>
          <li>系统将自动分析视频内容并生成思维导图</li>
          <li>处理完成后可在任务详情页查看结果</li>
        </ol>
      </div>
    </el-card>
  </div>
</template>

<style scoped>
.new-task-container {
  max-width: 800px;
  margin: 0 auto;
  animation: fadeIn 0.5s ease-in;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.page-header {
  margin-bottom: 20px;
  text-align: center;
  padding: 12px 0;
}

.page-title {
  font-size: 26px;
  font-weight: 700;
  color: #2c3e50;
  margin: 0 0 6px 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  letter-spacing: -0.5px;
  line-height: 1;
}

.page-title .el-icon {
  font-size: 26px;
  color: #2c3e50;
  display: inline-flex;
  align-items: center;
  line-height: 1;
  transform: translateY(1px);
}

.page-description {
  color: #64748b;
  font-size: 14px;
  margin: 0;
  font-weight: 400;
}

.task-form-card {
  margin-bottom: 20px;
  border-radius: 12px;
  border: 1px solid rgba(226, 232, 240, 0.8);
  box-shadow: 0 2px 12px rgba(15, 23, 42, 0.08);
  transition: all 0.3s ease;
  overflow: hidden;
}

.task-form-card:hover {
  box-shadow: 0 4px 20px rgba(15, 23, 42, 0.12);
  transform: translateY(-1px);
}

.task-form-card :deep(.el-card__body) {
  padding: 24px;
}

.task-form-card :deep(.el-form-item) {
  margin-bottom: 20px;
}

.task-form-card :deep(.el-form-item__label) {
  font-weight: 600;
  color: #2c3e50;
  font-size: 15px;
}

.task-form-card :deep(.el-input__wrapper) {
  border-radius: 10px;
  transition: all 0.3s ease;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.task-form-card :deep(.el-input__wrapper:hover) {
  box-shadow: 0 2px 8px rgba(34, 211, 238, 0.15);
}

.task-form-card :deep(.el-textarea__inner) {
  border-radius: 10px;
  transition: all 0.3s ease;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.task-form-card :deep(.el-textarea__inner:hover) {
  box-shadow: 0 2px 8px rgba(34, 211, 238, 0.15);
}

.video-upload {
  width: 100%;
}

.video-upload :deep(.el-upload) {
  width: 100%;
}

.video-upload :deep(.el-upload-dragger) {
  width: 100%;
  border-radius: 12px;
  border: 2px dashed #cbd5e1;
  background: linear-gradient(135deg, #f8fafc 0%, #f0fdf4 50%, #ecfeff 100%);
  transition: all 0.3s ease;
  padding: 30px 20px;
}

.video-upload :deep(.el-upload-dragger:hover) {
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

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
}

.upload-text {
  margin-top: 8px;
}

.upload-text p {
  margin: 6px 0;
  font-size: 14px;
  color: #475569;
  font-weight: 500;
}

.upload-text em {
  color: #22d3ee;
  font-style: normal;
  font-weight: 600;
}

.upload-tip {
  font-size: 12px;
  color: #94a3b8;
  margin-top: 4px;
}

.file-info {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 12px;
  padding: 10px 14px;
  background: linear-gradient(135deg, #ecfdf5 0%, #f0fdfa 100%);
  border: 2px solid #86efac;
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(74, 222, 128, 0.15);
  animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.file-info .el-icon {
  font-size: 20px;
  color: #4ade80;
}

.file-info span {
  flex: 1;
  font-weight: 500;
  color: #2c3e50;
  font-size: 14px;
}

.file-info .el-button {
  padding: 4px 8px;
  color: #f87171;
  transition: all 0.2s ease;
}

.file-info .el-button:hover {
  color: #ef4444;
  transform: scale(1.1);
}

.form-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
  margin-top: 4px;
  padding-top: 20px;
  border-top: 1px solid #e2e8f0;
}

.form-actions .el-button {
  min-width: 110px;
  height: 40px;
  font-weight: 600;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.form-actions .el-button--default {
  border: 2px solid #e2e8f0;
  color: #64748b;
}

.form-actions .el-button--default:hover {
  border-color: #cbd5e1;
  background: #f8fafc;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.form-actions .el-button--primary {
  background: linear-gradient(135deg, #4ade80 0%, #22d3ee 100%);
  border: none;
  box-shadow: 0 4px 15px rgba(34, 211, 238, 0.35);
}

.form-actions .el-button--primary:hover {
  box-shadow: 0 6px 20px rgba(34, 211, 238, 0.45);
  transform: translateY(-2px);
}

.form-actions .el-button--primary:active {
  transform: translateY(0);
}

.help-card {
  background: linear-gradient(135deg, #fafbfc 0%, #f8fafc 100%);
  border-radius: 12px;
  border: 1px solid rgba(226, 232, 240, 0.8);
  box-shadow: 0 2px 12px rgba(15, 23, 42, 0.06);
  transition: all 0.3s ease;
}

.help-card:hover {
  box-shadow: 0 4px 20px rgba(15, 23, 42, 0.1);
  transform: translateY(-1px);
}

.help-card :deep(.el-card__header) {
  background: linear-gradient(135deg, rgba(74, 222, 128, 0.05) 0%, rgba(34, 211, 238, 0.05) 100%);
  border-bottom: 1px solid rgba(226, 232, 240, 0.8);
  padding: 14px 20px;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  font-size: 15px;
  color: #2c3e50;
}

.card-header .el-icon {
  font-size: 18px;
  color: #22d3ee;
}

.help-content {
  padding: 4px 0;
}

.help-content ol {
  margin: 0;
  padding-left: 24px;
  counter-reset: step-counter;
}

.help-content li {
  margin: 10px 0;
  color: #475569;
  font-size: 14px;
  line-height: 1.6;
  position: relative;
  padding-left: 6px;
  list-style: none;
  counter-increment: step-counter;
}

.help-content li::marker {
  content: none;
}

.help-content li::before {
  content: counter(step-counter);
  position: absolute;
  left: -24px;
  top: 0;
  width: 20px;
  height: 20px;
  background: linear-gradient(135deg, #4ade80 0%, #22d3ee 100%);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 700;
  box-shadow: 0 2px 6px rgba(34, 211, 238, 0.3);
}

@media (max-width: 768px) {
  .new-task-container {
    max-width: 100%;
    padding: 0 16px;
  }

  .page-title {
    font-size: 26px;
  }

  .task-form-card :deep(.el-card__body) {
    padding: 24px 20px;
  }

  .form-actions {
    flex-direction: column;
  }

  .form-actions .el-button {
    width: 100%;
  }
}
</style>
