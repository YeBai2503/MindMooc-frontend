<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { createTask } from '@/api/task'
import {
  completeVideoUpload,
  getFileSha256,
  initVideoUpload,
  uploadVideoToMinio
} from '@/api/video'

const getVideoDuration = (file) => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video')
    video.preload = 'metadata'

    const objectUrl = URL.createObjectURL(file)

    video.onloadedmetadata = () => {
      const duration = video.duration
      URL.revokeObjectURL(objectUrl)

      if (!Number.isFinite(duration) || duration <= 0) {
        reject(new Error('无法读取视频时长'))
        return
      }

      resolve(duration)
    }

    video.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      reject(new Error('视频时长解析失败'))
    }

    video.src = objectUrl
  })
}

const router = useRouter()

const form = ref({
  taskName: '',
  videoFile: null,
  description: ''
})

const uploading = ref(false)
const uploadState = ref('idle')
const uploadedVideoId = ref('')
const uploadedVideoMeta = ref(null)
const uploadError = ref('')

const uploadSelectedVideo = async (file) => {
  if (!file) return

  uploadState.value = 'uploading'
  uploadError.value = ''
  uploadedVideoId.value = ''
  uploadedVideoMeta.value = null
  form.value.videoFile = file

  try {
    const [fileHash, duration] = await Promise.all([
      getFileSha256(file),
      getVideoDuration(file)
    ])

    const initResult = await initVideoUpload({
      filename: file.name,
      mimeType: file.type || 'application/octet-stream',
      videoTitle: form.value.taskName || file.name,
      fileHash,
      fileSize: file.size,
      duration: Math.round(duration)
    })

    if (initResult?.duplicated && initResult?.videoId) {
      uploadedVideoId.value = initResult.videoId
      uploadedVideoMeta.value = { duplicated: true }
      uploadState.value = 'success'
      ElMessage.success('视频已存在，已直接关联到当前任务')
      return false
    }

    if (!initResult?.uploadUrl || !initResult?.uploadId || !initResult?.objectKey) {
      throw new Error('视频上传初始化失败')
    }

    await uploadVideoToMinio(initResult.uploadUrl, file)

    const completedVideo = await completeVideoUpload({
      uploadId: initResult.uploadId,
      objectKey: initResult.objectKey
    })

    if (!completedVideo?.id) {
      throw new Error('视频上传确认失败')
    }

    uploadedVideoId.value = completedVideo.id
    uploadedVideoMeta.value = {
      uploadId: initResult.uploadId,
      objectKey: initResult.objectKey
    }
    uploadState.value = 'success'
    ElMessage.success('视频上传完成')
  } catch (error) {
    console.error('视频上传失败:', error)
    form.value.videoFile = null
    uploadState.value = 'error'
    uploadError.value = error?.message || '视频上传失败，请重试'
    ElMessage.error(uploadError.value)
  }

  return false
}

const handleFileChange = (rawFile) => {
  uploadSelectedVideo(rawFile)
  return false
}

const submitTask = async () => {
  if (!form.value.taskName) {
    ElMessage.warning('请输入任务名称')
    return
  }
  if (!form.value.videoFile || !uploadedVideoId.value || uploadState.value !== 'success') {
    ElMessage.warning('请先上传完成视频')
    return
  }

  uploading.value = true

  try {
    const task = await createTask({
      videoId: uploadedVideoId.value,
      title: form.value.taskName,
      requirement: form.value.description || '',
      taskType: 'common'
    })

    if (!task?.id) {
      throw new Error('任务创建结果异常')
    }

    ElMessage.success('任务创建成功，正在进入任务等待页')
    router.push(task.status === 'completed' ? `/task/${task.id}` : `/task/wait/${task.id}`)
  } catch (error) {
    console.error('创建任务失败:', error)
    ElMessage.error(error?.message || '任务创建失败，请重试')
  } finally {
    uploading.value = false
  }
}

const resetForm = () => {
  form.value = {
    taskName: '',
    videoFile: null,
    description: ''
  }
  uploadState.value = 'idle'
  uploadedVideoId.value = ''
  uploadedVideoMeta.value = null
  uploadError.value = ''
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
        <el-form-item label="任务名称" required class="focus-item">
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
              <el-icon class="upload-icon">
                <Loading v-if="uploadState === 'uploading'" />
                <VideoPlay v-else />
              </el-icon>
              <div class="upload-text">
                <p v-if="uploadState === 'uploading'">视频正在上传，请稍候...</p>
                <p v-else>将视频文件拖拽到此处，或<em>点击上传</em></p>
                <p class="upload-tip">支持 MP4等格式，文件大小不超过 500MB</p>
              </div>
            </div>
          </el-upload>

          <div v-if="form.videoFile" class="file-info" :class="`file-info--${uploadState}`">
            <el-icon>
              <Loading v-if="uploadState === 'uploading'" />
              <Document v-else />
            </el-icon>
            <span>
              {{ form.videoFile.name }}
              <em v-if="uploadState === 'uploading'">（上传中）</em>
              <em v-else-if="uploadState === 'success'">（已完成）</em>
              <em v-else-if="uploadState === 'error'">（上传失败）</em>
            </span>
            <el-button type="text" :disabled="uploadState === 'uploading'" @click="form.videoFile = null">
              <el-icon><Delete /></el-icon>
            </el-button>
          </div>
          <div v-if="uploadState === 'uploading'" class="upload-loading-hint">
            <el-icon class="loading-icon"><Loading /></el-icon>
            <span>正在上传并处理视频，请勿关闭页面</span>
          </div>
          <div v-else-if="uploadState === 'error' && uploadError" class="upload-error-hint">
            {{ uploadError }}
          </div>
        </el-form-item>

        <el-form-item label="任务要求" class="focus-item">
          <el-input
            v-model="form.description"
            type="textarea"
            :autosize="{ minRows: 4, maxRows: 8 }"
            placeholder="请输入任务要求（可选）"
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
  </div>
</template>

<style scoped>
.new-task-container {
  max-width: 860px;
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

.task-form-card {
  margin-bottom: 8px;
  border-radius: 14px;
  border: 1px solid #e8eef5;
  box-shadow: 0 8px 22px rgba(15, 23, 42, 0.06);
  transition: all 0.3s ease;
  overflow: hidden;
}

.task-form-card:hover {
  box-shadow: 0 12px 28px rgba(15, 23, 42, 0.1);
  transform: translateY(-1px);
}

.task-form-card :deep(.el-card__body) {
  padding: 26px;
}

.task-form-card :deep(.el-form-item) {
  margin-bottom: 20px;
}

.task-form-card :deep(.el-form-item__label) {
  font-weight: 600;
  color: #1f2937;
  font-size: 15px;
}

.task-form-card :deep(.el-input__wrapper) {
  border-radius: 10px;
  transition: all 0.3s ease;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.05);
}

.task-form-card :deep(.el-input__wrapper:hover) {
  box-shadow: 0 2px 8px rgba(16, 185, 129, 0.16);
}

.task-form-card :deep(.el-textarea__inner) {
  border-radius: 10px;
  transition: all 0.3s ease;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.task-form-card :deep(.el-textarea__inner:hover) {
  box-shadow: 0 2px 8px rgba(16, 185, 129, 0.16);
}

.task-form-card :deep(.focus-item .el-input__wrapper) {
  box-shadow:
    0 0 0 1px rgba(16, 185, 129, 0.28),
    0 1px 3px rgba(15, 23, 42, 0.05);
  background: #fbfffd;
}

.task-form-card :deep(.focus-item .el-input__wrapper:hover) {
  box-shadow:
    0 0 0 1px rgba(16, 185, 129, 0.38),
    0 4px 12px rgba(16, 185, 129, 0.14);
}

.task-form-card :deep(.focus-item .el-textarea__inner) {
  box-shadow:
    0 0 0 1px rgba(16, 185, 129, 0.28),
    0 1px 3px rgba(15, 23, 42, 0.05);
  background: #fbfffd;
  max-height: 260px;
  overflow-y: auto;
  resize: none;
  transition: height 0.22s ease, box-shadow 0.22s ease, background-color 0.22s ease;
}

.task-form-card :deep(.focus-item .el-textarea__inner:hover) {
  box-shadow:
    0 0 0 1px rgba(16, 185, 129, 0.38),
    0 4px 12px rgba(16, 185, 129, 0.14);
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
  border: 2px dashed #cfe9de;
  background: linear-gradient(135deg, #f9fdfb 0%, #f2fcf7 50%, #f4fdfc 100%);
  transition: all 0.3s ease;
  padding: 30px 20px;
}

.video-upload :deep(.el-upload-dragger:hover) {
  border-color: #34d399;
  background: linear-gradient(135deg, #f4fef9 0%, #ecfdf5 55%, #f0fdfa 100%);
  transform: translateY(-1px);
  box-shadow: 0 4px 16px rgba(16, 185, 129, 0.14);
}

.upload-content {
  padding: 10px;
  text-align: center;
}

.upload-icon {
  font-size: 40px;
  background: linear-gradient(135deg, #34d399 0%, #14b8a6 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 12px;
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
  color: #0f766e;
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
  background: linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%);
  border: 1px solid #99f6e4;
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(16, 185, 129, 0.12);
  animation: slideIn 0.3s ease-out;
}

.file-info--uploading {
  border-color: #93c5fd;
  background: linear-gradient(135deg, #eff6ff 0%, #f8fbff 100%);
}

.file-info--error {
  border-color: #fca5a5;
  background: linear-gradient(135deg, #fff1f2 0%, #fff7f7 100%);
}

.file-info--success {
  border-color: #99f6e4;
}

.file-info .el-icon {
  font-size: 20px;
  color: #10b981;
}

.file-info--uploading .el-icon {
  color: #3b82f6;
}

.file-info--error .el-icon {
  color: #ef4444;
}

.file-info span {
  flex: 1;
  font-weight: 500;
  color: #2c3e50;
  font-size: 14px;
}

.file-info span em {
  font-style: normal;
  color: #64748b;
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

.upload-loading-hint,
.upload-error-hint {
  margin-top: 10px;
  padding: 10px 14px;
  border-radius: 10px;
  font-size: 13px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.upload-loading-hint {
  background: #eff6ff;
  color: #2563eb;
  border: 1px solid #bfdbfe;
}

.upload-error-hint {
  background: #fff1f2;
  color: #dc2626;
  border: 1px solid #fecaca;
}

.loading-icon {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.form-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
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
  border: 1px solid #dbe5ef;
  color: #64748b;
}

.form-actions .el-button--default:hover {
  border-color: #cbd5e1;
  background: #f8fafc;
  transform: translateY(-1px);
  box-shadow: 0 3px 10px rgba(15, 23, 42, 0.1);
}

.form-actions .el-button--primary {
  background: linear-gradient(135deg, #4ade80 0%, #2dd4bf 48%, #22d3ee 100%);
  border: 1px solid rgba(45, 212, 191, 0.24);
  box-shadow: 0 8px 14px rgba(45, 212, 191, 0.18);
}

.form-actions .el-button--primary:hover {
  box-shadow: 0 10px 18px rgba(45, 212, 191, 0.24);
  transform: translateY(-1px);
  filter: saturate(1.06) brightness(0.99);
}

.form-actions .el-button--primary:active {
  transform: translateY(0);
}

@media (max-width: 768px) {
  .new-task-container {
    max-width: 100%;
    padding: 0 16px;
  }

  .task-form-card :deep(.el-card__body) {
    padding: 24px 20px;
  }

  .form-actions {
    flex-direction: column;
    justify-content: initial;
  }

  .form-actions .el-button {
    width: 100%;
  }
}
</style>
