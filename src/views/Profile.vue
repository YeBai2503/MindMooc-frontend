<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { getCurrentUser, updateMe } from '@/api/user'
import { listMyTasks } from '@/api/task'
import { setToken } from '@/api/http'

const router = useRouter()

// 用户信息
const userInfo = ref({
  avatar: '',
  username: '',
  email: '',
  joinDate: '',
  totalTasks: 0,
  completedTasks: 0,
  processingTasks: 0,
  errorTasks: 0
})

// 编辑状态
const editMode = ref(false)
const editForm = ref({
  username: '',
  email: '',
  password: '',
  confirmPassword: ''
})

// 统计数据
const stats = ref([
  { label: '总任务数', value: 0, icon: 'DataAnalysis', color: '#22d3ee' },
  { label: '已完成', value: 0, icon: 'CircleCheck', color: '#4ade80' },
  { label: '处理中', value: 0, icon: 'Loading', color: '#fbbf24' },
  { label: '失败任务', value: 0, icon: 'CircleClose', color: '#f87171' }
])

// 反馈功能
const feedbackAction = {
  title: '意见反馈',
  desc: '提交使用建议和问题反馈',
  icon: 'ChatDotRound',
  path: '/feedback',
  color: '#22d3ee'
}

// 从后端拉取用户信息
const fetchUserInfo = async () => {
  try {
    const user = await getCurrentUser()
    userInfo.value.username = user.username
    userInfo.value.email = user.email
    userInfo.value.joinDate = user.createdAt
  } catch (error) {
    console.error('获取用户信息失败:', error)
    ElMessage.error(error.message || '获取用户信息失败')
  }
}

// 从后端拉取任务统计（简单统计）
const fetchTaskStats = async () => {
  try {
    // 这里取前 100 条任务做简单统计，如有需要可改为后端聚合接口
    const page = await listMyTasks({ pageNum: 1, pageSize: 100 })
    const records = Array.isArray(page?.records) ? page.records : []

    const total = page?.total ?? records.length
    const completed = records.filter((t) => t.status === 'completed').length
    const processing = records.filter((t) => t.status === 'processing' || t.status === 'pending').length
    const failed = records.filter((t) => t.status === 'failed').length

    userInfo.value.totalTasks = total
    userInfo.value.completedTasks = completed
    userInfo.value.processingTasks = processing
    userInfo.value.errorTasks = failed

    stats.value = [
      { label: '总任务数', value: total, icon: 'DataAnalysis', color: '#22d3ee' },
      { label: '已完成', value: completed, icon: 'CircleCheck', color: '#4ade80' },
      { label: '处理中', value: processing, icon: 'Loading', color: '#fbbf24' },
      { label: '失败任务', value: failed, icon: 'CircleClose', color: '#f87171' }
    ]
  } catch (error) {
    console.error('获取任务统计失败:', error)
    ElMessage.error(error.message || '获取任务统计失败')
  }
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
const saveUserInfo = async () => {
  // 验证密码
  if (editForm.value.password && editForm.value.password !== editForm.value.confirmPassword) {
    ElMessage.error('两次输入的密码不一致')
    return
  }

  try {
    await updateMe({
      username: editForm.value.username,
      email: editForm.value.email
      // 密码修改暂未对接后端，仅做前端校验
    })

    userInfo.value.username = editForm.value.username
    userInfo.value.email = editForm.value.email

    editMode.value = false
    ElMessage.success('保存成功！')
  } catch (error) {
    console.error('保存用户信息失败:', error)
    ElMessage.error(error.message || '保存失败')
  }
}

// 取消编辑
const cancelEdit = () => {
  editMode.value = false
}

// 退出登录：清空本地 token 并回到登录页
const logout = () => {
  setToken(null)
  ElMessage.success('已退出登录')
  router.push('/login')
}

// 跳转到反馈页面
const goToFeedback = () => {
  router.push('/feedback')
}

onMounted(() => {
  fetchUserInfo()
  fetchTaskStats()
})
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
              <div class="info-actions">
                <el-button type="primary" @click="startEdit">
                  <el-icon><Edit /></el-icon>
                  编辑资料
                </el-button>
                <el-button type="danger" plain @click="logout">
                  退出登录
                </el-button>
              </div>
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
            <span class="info-value">v1.1.0</span>
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

.profile-content {
  display: grid;
  gap: 20px;
}

.user-info-card {
  margin-bottom: 0;
  border-radius: 12px;
  border: 1px solid rgba(226, 232, 240, 0.8);
  box-shadow: 0 2px 12px rgba(15, 23, 42, 0.08);
  transition: all 0.3s ease;
}

.user-info-card:hover {
  box-shadow: 0 4px 20px rgba(15, 23, 42, 0.12);
  transform: translateY(-1px);
}

.user-info-card :deep(.el-card__body) {
  padding: 24px;
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
  font-weight: 700;
  color: #2c3e50;
}

.email {
  margin: 0 0 8px 0;
  color: #64748b;
  font-size: 15px;
}

.join-date {
  margin: 0 0 20px 0;
  color: #909399;
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
}

.join-date .el-icon {
  color: #22d3ee;
}

.info-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.info-actions .el-button {
  border-radius: 8px;
  font-weight: 500;
  transition: all 0.3s ease;
}

.info-actions .el-button--primary {
  background: linear-gradient(135deg, #4ade80 0%, #22d3ee 100%);
  border: none;
  box-shadow: 0 2px 8px rgba(34, 211, 238, 0.25);
}

.info-actions .el-button--primary:hover {
  box-shadow: 0 4px 12px rgba(34, 211, 238, 0.35);
  transform: translateY(-1px);
}

.info-actions .el-button--danger {
  border-color: #f87171;
}

.info-actions .el-button--danger:hover {
  background: #fee2e2;
  border-color: #ef4444;
  transform: translateY(-1px);
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

.info-edit :deep(.el-input__wrapper) {
  border-radius: 8px;
  transition: all 0.3s ease;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.info-edit :deep(.el-input__wrapper:hover) {
  box-shadow: 0 2px 8px rgba(34, 211, 238, 0.15);
}

.info-edit .el-button {
  border-radius: 8px;
  font-weight: 500;
}

.info-edit .el-button--primary {
  background: linear-gradient(135deg, #4ade80 0%, #22d3ee 100%);
  border: none;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: 600;
  font-size: 16px;
  color: #2c3e50;
}

.card-header .el-icon {
  font-size: 18px;
  color: #22d3ee;
}

.stats-card {
  border-radius: 12px;
  border: 1px solid rgba(226, 232, 240, 0.8);
  box-shadow: 0 2px 12px rgba(15, 23, 42, 0.08);
  transition: all 0.3s ease;
}

.stats-card:hover {
  box-shadow: 0 4px 20px rgba(15, 23, 42, 0.12);
  transform: translateY(-1px);
}

.stats-card :deep(.el-card__header) {
  background: linear-gradient(135deg, rgba(74, 222, 128, 0.05) 0%, rgba(34, 211, 238, 0.05) 100%);
  border-bottom: 1px solid rgba(226, 232, 240, 0.8);
  padding: 16px 20px;
  border-radius: 12px 12px 0 0;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 18px;
  background: linear-gradient(135deg, #f8fafc 0%, #f0fdf4 100%);
  border-radius: 10px;
  border: 1px solid #e2e8f0;
  transition: all 0.3s ease;
}

.stat-item:hover {
  background: linear-gradient(135deg, #f0fdf4 0%, #ecfeff 100%);
  border-color: #86efac;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(34, 211, 238, 0.15);
}

.stat-icon {
  font-size: 28px;
  display: flex;
  align-items: center;
}

.stat-value {
  font-size: 26px;
  font-weight: 700;
  color: #2c3e50;
}

.stat-label {
  font-size: 14px;
  color: #64748b;
  font-weight: 500;
}

.feedback-card {
  border-radius: 12px;
  border: 1px solid rgba(226, 232, 240, 0.8);
  box-shadow: 0 2px 12px rgba(15, 23, 42, 0.08);
  transition: all 0.3s ease;
}

.feedback-card:hover {
  box-shadow: 0 4px 20px rgba(15, 23, 42, 0.12);
  transform: translateY(-1px);
}

.feedback-card :deep(.el-card__header) {
  background: linear-gradient(135deg, rgba(74, 222, 128, 0.05) 0%, rgba(34, 211, 238, 0.05) 100%);
  border-bottom: 1px solid rgba(226, 232, 240, 0.8);
  padding: 16px 20px;
  border-radius: 12px 12px 0 0;
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
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  background: linear-gradient(135deg, #fafbfc 0%, #f8fafc 100%);
}

.feedback-item:hover {
  border-color: #22d3ee;
  background: linear-gradient(135deg, #ecfdf5 0%, #f0fdfa 100%);
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(34, 211, 238, 0.2);
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

.system-card {
  border-radius: 12px;
  border: 1px solid rgba(226, 232, 240, 0.8);
  box-shadow: 0 2px 12px rgba(15, 23, 42, 0.08);
  transition: all 0.3s ease;
}

.system-card:hover {
  box-shadow: 0 4px 20px rgba(15, 23, 42, 0.12);
  transform: translateY(-1px);
}

.system-card :deep(.el-card__header) {
  background: linear-gradient(135deg, rgba(74, 222, 128, 0.05) 0%, rgba(34, 211, 238, 0.05) 100%);
  border-bottom: 1px solid rgba(226, 232, 240, 0.8);
  padding: 16px 20px;
  border-radius: 12px 12px 0 0;
}

.system-info {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #f0f0f0;
  transition: all 0.2s ease;
}

.info-item:hover {
  padding-left: 8px;
  background: #f8fafc;
  border-radius: 6px;
}

.info-item:last-child {
  border-bottom: none;
}

.info-label {
  color: #64748b;
  font-weight: 500;
}

.info-value {
  color: #2c3e50;
  font-weight: 600;
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
