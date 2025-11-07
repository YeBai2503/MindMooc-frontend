<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'

const router = useRouter()

// 表单数据
const form = ref({
  taskName: '',
  videoFile: null,
  description: ''
})

// 上传状态
const uploading = ref(false)

// 文件上传处理
const handleFileChange = (file) => {
  form.value.videoFile = file.raw
  return false // 阻止自动上传
}

// 提交任务
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
    // 这里模拟API调用
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    ElMessage.success('任务创建成功！')
    // 跳转到任务详情页面（这里用模拟ID）
    router.push(`/task/1`)
  } catch (error) {
    ElMessage.error('任务创建失败，请重试')
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

.task-form-card {
  margin-bottom: 24px;
}

.video-upload {
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

.file-info {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 12px;
  padding: 8px 12px;
  background: #ecfdf5;
  border: 1px solid #86efac;
  border-radius: 6px;
}

.form-actions {
  display: flex;
  gap: 16px;
  justify-content: center;
}

.help-card {
  background: #fafbfc;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
}

.help-content ol {
  margin: 0;
  padding-left: 20px;
}

.help-content li {
  margin: 8px 0;
  color: #64748b;
}
</style>
