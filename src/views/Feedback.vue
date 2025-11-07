<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'

const router = useRouter()

// 反馈表单
const feedbackForm = ref({
  type: 'suggestion',
  title: '',
  content: '',
  contact: '',
  attachments: []
})

// 反馈类型选项
const feedbackTypes = [
  { label: '功能建议', value: 'suggestion', icon: 'Plus', color: '#22d3ee' },
  { label: '问题反馈', value: 'bug', icon: 'Warning', color: '#f87171' },
  { label: '使用咨询', value: 'question', icon: 'QuestionFilled', color: '#fbbf24' },
  { label: '其他反馈', value: 'other', icon: 'ChatDotRound', color: '#6b7280' }
]

// 表单状态
const submitting = ref(false)
const formRef = ref(null)

// 表单验证规则
const rules = {
  title: [
    { required: true, message: '请输入反馈标题', trigger: 'blur' },
    { min: 5, max: 100, message: '标题长度在 5 到 100 个字符', trigger: 'blur' }
  ],
  content: [
    { required: true, message: '请输入反馈内容', trigger: 'blur' },
    { min: 10, max: 1000, message: '内容长度在 10 到 1000 个字符', trigger: 'blur' }
  ],
  contact: [
    { pattern: /^[\w-]+(\.[\w-]+)*@[\w-]+(\.[\w-]+)+$/, message: '请输入正确的邮箱格式', trigger: 'blur' }
  ]
}

// 获取当前选中类型的信息
const getCurrentType = () => {
  return feedbackTypes.find(type => type.value === feedbackForm.value.type) || feedbackTypes[0]
}

// 文件上传处理
const handleFileChange = (file, fileList) => {
  feedbackForm.value.attachments = fileList
  return false // 阻止自动上传
}

// 移除文件
const handleFileRemove = (file, fileList) => {
  feedbackForm.value.attachments = fileList
}

// 提交反馈
const submitFeedback = async () => {
  if (!formRef.value) return
  
  try {
    const valid = await formRef.value.validate()
    if (!valid) return
  } catch (error) {
    return
  }
  
  submitting.value = true
  
  try {
    // 模拟提交API
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    ElMessage.success('反馈提交成功！我们会尽快处理您的反馈。')
    
    // 重置表单
    resetForm()
    
  } catch (error) {
    console.error('提交反馈失败:', error)
    ElMessage.error('提交失败，请重试')
  } finally {
    submitting.value = false
  }
}

// 重置表单
const resetForm = () => {
  if (formRef.value) {
    formRef.value.resetFields()
  }
  feedbackForm.value = {
    type: 'suggestion',
    title: '',
    content: '',
    contact: '',
    attachments: []
  }
}

// 返回个人中心
const goBack = () => {
  router.push('/profile')
}
</script>

<template>
  <div class="feedback-container">
    <div class="page-header">
      <div class="header-left">
        <el-button @click="goBack" class="back-button">
          <el-icon><ArrowLeft /></el-icon>
          返回
        </el-button>
        <div class="title-section">
          <h2 class="page-title">
            <el-icon><ChatDotRound /></el-icon>
            意见反馈
          </h2>
          <p class="page-description">您的反馈对我们很重要，帮助我们不断改进产品</p>
        </div>
      </div>
    </div>

    <div class="feedback-content">
      <!-- 反馈类型选择 -->
      <el-card class="type-card" shadow="hover">
        <template #header>
          <div class="card-header">
            <el-icon><Category /></el-icon>
            <span>反馈类型</span>
          </div>
        </template>
        
        <div class="type-grid">
          <div
            v-for="type in feedbackTypes"
            :key="type.value"
            class="type-item"
            :class="{ active: feedbackForm.type === type.value }"
            @click="feedbackForm.type = type.value"
          >
            <div class="type-icon" :style="{ color: type.color }">
              <el-icon><component :is="type.icon" /></el-icon>
            </div>
            <span class="type-label">{{ type.label }}</span>
          </div>
        </div>
      </el-card>

      <!-- 反馈表单 -->
      <el-card class="form-card" shadow="hover">
        <template #header>
          <div class="card-header">
            <div class="header-title">
              <el-icon :style="{ color: getCurrentType().color }">
                <component :is="getCurrentType().icon" />
              </el-icon>
              <span>{{ getCurrentType().label }}</span>
            </div>
          </div>
        </template>
        
        <el-form
          ref="formRef"
          :model="feedbackForm"
          :rules="rules"
          label-width="100px"
          size="large"
        >
          <el-form-item label="反馈标题" prop="title">
            <el-input
              v-model="feedbackForm.title"
              placeholder="请简要描述您的反馈"
              maxlength="100"
              show-word-limit
            />
          </el-form-item>

          <el-form-item label="详细描述" prop="content">
            <el-input
              v-model="feedbackForm.content"
              type="textarea"
              :rows="8"
              placeholder="请详细描述您遇到的问题或建议..."
              maxlength="1000"
              show-word-limit
            />
          </el-form-item>

          <el-form-item label="联系邮箱" prop="contact">
            <el-input
              v-model="feedbackForm.contact"
              placeholder="请输入您的邮箱地址（可选）"
              maxlength="100"
            >
              <template #prefix>
                <el-icon><Message /></el-icon>
              </template>
            </el-input>
            <div class="form-tip">
              填写邮箱后，我们会及时回复处理结果
            </div>
          </el-form-item>

          <el-form-item label="附件上传">
            <el-upload
              :file-list="feedbackForm.attachments"
              :before-upload="() => false"
              :on-change="handleFileChange"
              :on-remove="handleFileRemove"
              multiple
              drag
              accept="image/*,.pdf,.doc,.docx,.txt"
            >
              <div class="upload-content">
                <el-icon class="upload-icon"><UploadFilled /></el-icon>
                <div class="upload-text">
                  <p>将文件拖拽到此处，或<em>点击上传</em></p>
                  <p class="upload-tip">支持图片、PDF、Word、文本文件，单个文件不超过 10MB</p>
                </div>
              </div>
            </el-upload>
          </el-form-item>

          <el-form-item>
            <div class="form-actions">
              <el-button size="large" @click="resetForm">重置</el-button>
              <el-button
                type="primary"
                size="large"
                :loading="submitting"
                @click="submitFeedback"
              >
                {{ submitting ? '提交中...' : '提交反馈' }}
              </el-button>
            </div>
          </el-form-item>
        </el-form>
      </el-card>

      <!-- 常见问题 -->
      <el-card class="faq-card" shadow="hover">
        <template #header>
          <div class="card-header">
            <el-icon><QuestionFilled /></el-icon>
            <span>常见问题</span>
          </div>
        </template>
        
        <el-collapse>
          <el-collapse-item title="如何提高思维导图生成的准确性？" name="1">
            <p>建议上传清晰度较高的视频，并确保音频质量良好。视频内容结构化程度越高，生成的思维导图越准确。</p>
          </el-collapse-item>
          
          <el-collapse-item title="支持哪些视频格式？" name="2">
            <p>目前支持 MP4、AVI、MOV、WMV 等常见视频格式，单个文件大小不超过 500MB。</p>
          </el-collapse-item>
          
          <el-collapse-item title="处理时间大概需要多久？" name="3">
            <p>处理时间取决于视频长度和复杂度，一般 30 分钟的视频需要 3-5 分钟处理时间。</p>
          </el-collapse-item>
          
          <el-collapse-item title="如何编辑生成的思维导图？" name="4">
            <p>在任务详情页面点击"编辑导图"按钮，即可进入可视化编辑器进行自定义修改。</p>
          </el-collapse-item>
        </el-collapse>
      </el-card>
    </div>
  </div>
</template>

<style scoped>
.feedback-container {
  max-width: 800px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 24px;
}

.header-left {
  display: flex;
  align-items: flex-start;
  gap: 16px;
}

.back-button {
  margin-top: 4px;
}

.title-section {
  flex: 1;
}

.page-title {
  font-size: 28px;
  color: #2c3e50;
  margin: 0 0 8px 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.page-description {
  color: #64748b;
  font-size: 16px;
  margin: 0;
}

.feedback-content {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
}

.header-title {
  display: flex;
  align-items: center;
  gap: 8px;
}

.type-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 16px;
}

.type-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 20px;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  background: #fafbfc;
}

.type-item:hover {
  border-color: #22d3ee;
  background: #ecfdf5;
  transform: translateY(-2px);
}

.type-item.active {
  border-color: #22d3ee;
  background: #ecfdf5;
  box-shadow: 0 4px 12px rgba(34, 211, 238, 0.2);
}

.type-icon {
  font-size: 32px;
  margin-bottom: 4px;
}

.type-label {
  font-weight: 500;
  color: #2c3e50;
}

.form-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
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

.form-actions {
  display: flex;
  gap: 16px;
  justify-content: center;
}

.faq-card {
  background: #fafbfc;
}

.faq-card :deep(.el-collapse-item__header) {
  background: transparent;
  border-bottom: 1px solid #f0f0f0;
}

.faq-card :deep(.el-collapse-item__content) {
  padding: 16px 0;
  color: #64748b;
  line-height: 1.6;
}

@media (max-width: 768px) {
  .header-left {
    flex-direction: column;
    gap: 12px;
  }
  
  .type-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .form-actions {
    flex-direction: column;
  }
}
</style>
