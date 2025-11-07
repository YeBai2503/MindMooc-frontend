<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'

const router = useRouter()

// 用户信息
const userInfo = ref({
  avatar: '',
  username: 'MindMooc用户',
  email: 'user@mindmooc.com',
  joinDate: '2024-01-01',
  totalTasks: 15,
  completedTasks: 12,
  processingTasks: 2,
  errorTasks: 1
})

// 编辑状态
const editMode = ref(false)
const editForm = ref({
  username: userInfo.value.username,
  email: userInfo.value.email,
  password: '',
  confirmPassword: ''
})

// 统计数据
const stats = ref([
  { label: '总任务数', value: userInfo.value.totalTasks, icon: 'DataAnalysis', color: '#22d3ee' },
  { label: '已完成', value: userInfo.value.completedTasks, icon: 'CircleCheck', color: '#4ade80' },
  { label: '处理中', value: userInfo.value.processingTasks, icon: 'Loading', color: '#fbbf24' },
  { label: '失败任务', value: userInfo.value.errorTasks, icon: 'CircleClose', color: '#f87171' }
])

// 反馈功能
const feedbackAction = {
  title: '意见反馈',
  desc: '提交使用建议和问题反馈',
  icon: 'ChatDotRound',
  path: '/feedback',
  color: '#22d3ee'
}

// 开启编辑模式
const startEdit = () => {
  editMode.value = true
  editForm.value = {
    username: userInfo.value.username,
    email: userInfo.value.email,
    password: '',
    confirmPassword: ''
  }
}

// 保存用户信息
const saveUserInfo = () => {
  // 验证密码
  if (editForm.value.password && editForm.value.password !== editForm.value.confirmPassword) {
    ElMessage.error('两次输入的密码不一致')
    return
  }
  
  // 模拟保存
  userInfo.value.username = editForm.value.username
  userInfo.value.email = editForm.value.email
  
  editMode.value = false
  ElMessage.success('保存成功！')
}

// 取消编辑
const cancelEdit = () => {
  editMode.value = false
}

// 跳转到反馈页面
const goToFeedback = () => {
  router.push('/feedback')
}
</script>

<template>
  <div class="profile-container">
    <div class="page-header">
      <h2 class="page-title">
        <el-icon><User /></el-icon>
        个人中心
      </h2>
      <p class="page-description">管理个人信息和查看使用统计</p>
    </div>

    <div class="profile-content">
      <!-- 用户信息卡片 -->
      <el-card class="user-info-card" shadow="hover">
        <div class="user-info">
          <div class="user-details">
            <div v-if="!editMode" class="info-display">
              <h3 class="username">{{ userInfo.username }}</h3>
              <p class="email">{{ userInfo.email }}</p>
              <p class="join-date">
                <el-icon><Calendar /></el-icon>
                加入时间：{{ userInfo.joinDate }}
              </p>
              <el-button type="primary" @click="startEdit">
                <el-icon><Edit /></el-icon>
                编辑资料
              </el-button>
            </div>

            <div v-else class="info-edit">
              <el-form :model="editForm" label-width="100px">
                <el-form-item label="用户名">
                  <el-input v-model="editForm.username" placeholder="请输入用户名" />
                </el-form-item>
                <el-form-item label="邮箱">
                  <el-input v-model="editForm.email" placeholder="请输入邮箱地址" />
                </el-form-item>
                <el-form-item label="新密码">
                  <el-input 
                    v-model="editForm.password" 
                    type="password" 
                    placeholder="留空则不修改密码"
                    show-password
                  />
                </el-form-item>
                <el-form-item label="确认密码">
                  <el-input 
                    v-model="editForm.confirmPassword" 
                    type="password" 
                    placeholder="请再次输入新密码"
                    show-password
                  />
                </el-form-item>
                <el-form-item>
                  <el-button type="primary" @click="saveUserInfo">保存</el-button>
                  <el-button @click="cancelEdit">取消</el-button>
                </el-form-item>
              </el-form>
            </div>
          </div>
        </div>
      </el-card>

      <!-- 统计数据 -->
      <el-card class="stats-card" shadow="hover">
        <template #header>
          <div class="card-header">
            <el-icon><DataAnalysis /></el-icon>
            <span>使用统计</span>
          </div>
        </template>
        
        <div class="stats-grid">
          <div
            v-for="stat in stats"
            :key="stat.label"
            class="stat-item"
          >
            <div class="stat-icon" :style="{ color: stat.color }">
              <el-icon><component :is="stat.icon" /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stat.value }}</div>
              <div class="stat-label">{{ stat.label }}</div>
            </div>
          </div>
        </div>
      </el-card>

      <!-- 意见反馈 -->
      <el-card class="feedback-card" shadow="hover">
        <template #header>
          <div class="card-header">
            <el-icon><ChatDotRound /></el-icon>
            <span>意见反馈</span>
          </div>
        </template>
        
        <div class="feedback-content">
          <div class="feedback-item" @click="goToFeedback">
            <div class="feedback-icon" :style="{ backgroundColor: feedbackAction.color }">
              <el-icon><component :is="feedbackAction.icon" /></el-icon>
            </div>
            <div class="feedback-info">
              <div class="feedback-title">{{ feedbackAction.title }}</div>
              <div class="feedback-desc">{{ feedbackAction.desc }}</div>
            </div>
            <el-icon class="feedback-arrow"><ArrowRight /></el-icon>
          </div>
        </div>
      </el-card>

      <!-- 系统信息 -->
      <el-card class="system-card" shadow="hover">
        <template #header>
          <div class="card-header">
            <el-icon><InfoFilled /></el-icon>
            <span>系统信息</span>
          </div>
        </template>
        
        <div class="system-info">
          <div class="info-item">
            <span class="info-label">版本号：</span>
            <span class="info-value">v1.0.0</span>
          </div>
          <div class="info-item">
            <span class="info-label">最后更新：</span>
            <span class="info-value">2025-11-07</span>
          </div>
          <div class="info-item">
            <span class="info-label">技术支持：</span>
            <span class="info-value">MindMooc Team</span>
          </div>
        </div>
      </el-card>
    </div>
  </div>
</template>

<style scoped>
.profile-container {
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

.profile-content {
  display: grid;
  gap: 24px;
}

.user-info-card {
  margin-bottom: 0;
}

.user-info {
  display: flex;
  align-items: flex-start;
}

.user-details {
  flex: 1;
  max-width: 500px;
}

.username {
  margin: 0 0 8px 0;
  font-size: 24px;
  color: #2c3e50;
}

.email {
  margin: 0 0 8px 0;
  color: #64748b;
}

.join-date {
  margin: 0 0 16px 0;
  color: #909399;
  display: flex;
  align-items: center;
  gap: 4px;
}

.info-edit {
  width: 100%;
}

.info-edit .el-form {
  max-width: 400px;
}

.info-edit .el-form-item {
  margin-bottom: 20px;
}

.info-edit .el-input {
  width: 100%;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: #f8fafc;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.stat-item:hover {
  background: #f0f9ff;
  transform: translateY(-2px);
}

.stat-icon {
  font-size: 24px;
}

.stat-value {
  font-size: 24px;
  font-weight: 600;
  color: #2c3e50;
}

.stat-label {
  font-size: 14px;
  color: #64748b;
}

.feedback-content {
  display: flex;
  flex-direction: column;
}

.feedback-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  background: #fafbfc;
}

.feedback-item:hover {
  border-color: #22d3ee;
  background: #ecfdf5;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(34, 211, 238, 0.15);
}

.feedback-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 20px;
  box-shadow: 0 2px 8px rgba(34, 211, 238, 0.3);
}

.feedback-info {
  flex: 1;
}

.feedback-title {
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 6px;
  font-size: 16px;
}

.feedback-desc {
  font-size: 14px;
  color: #64748b;
  line-height: 1.5;
}

.feedback-arrow {
  color: #c0c4cc;
  transition: all 0.3s ease;
  font-size: 18px;
}

.feedback-item:hover .feedback-arrow {
  color: #22d3ee;
  transform: translateX(4px);
}

.system-info {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid #f0f0f0;
}

.info-item:last-child {
  border-bottom: none;
}

.info-label {
  color: #64748b;
}

.info-value {
  color: #2c3e50;
  font-weight: 500;
}

@media (max-width: 768px) {
  .user-details {
    max-width: none;
  }
  
  .stats-grid {
    grid-template-columns: 1fr;
  }
  
  .feedback-item {
    padding: 16px;
    gap: 12px;
  }
  
  .feedback-icon {
    width: 40px;
    height: 40px;
    font-size: 18px;
  }
}
</style>
