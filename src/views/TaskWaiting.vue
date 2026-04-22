<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Loading, CircleCheck, CircleClose } from '@element-plus/icons-vue'
import { getTaskStatus } from '@/api/task'

const route = useRoute()
const router = useRouter()

const taskId = route.params.id

const status = ref('pending')
const title = ref('')
const createdAt = ref('')
const errorDetails = ref('')
const loading = ref(false)

let timer = null

const fetchStatus = async () => {
  loading.value = true
  try {
    const task = await getTaskStatus(taskId)
    if (!task) {
      router.push('/new-task')
      return
    }
    status.value = task.status
    title.value = task.title
    createdAt.value = task.createdAt
    errorDetails.value = task.errorDetails || ''

    if (status.value === 'completed') {
      ElMessage.success('任务已完成，正在跳转到详情页')
      stopPolling()
      router.push(`/task/${taskId}`)
    } else if (status.value === 'failed') {
      ElMessage.error('任务处理失败')
      stopPolling()
    }
  } catch (error) {
    console.error('获取任务状态失败:', error)
    router.push('/new-task')
  } finally {
    loading.value = false
  }
}

const startPolling = () => {
  // 先立刻查一次
  fetchStatus()
  // 然后每 1 秒轮询一次
  timer = setInterval(fetchStatus, 1000)
}

const stopPolling = () => {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
}

const goNewTask = () => {
  stopPolling()
  router.push('/new-task')
}

onMounted(() => {
  startPolling()
})

onBeforeUnmount(() => {
  stopPolling()
})
</script>

<template>
  <div class="waiting-container">
    <el-card class="waiting-card" shadow="hover">
      <div class="header">
        <h2 class="title">任务处理中...</h2>
        <p class="subtitle">
          我们正在为你分析视频并生成思维导图，这通常需要几分钟时间。
        </p>
      </div>

      <div class="status-section" v-loading="loading">
        <el-result :title="title || `任务：${title}`">
          <template #sub-title>
            <div class="status-badge" :class="status">
              当前状态：<span>{{ status }}</span>
            </div>
          </template>

          <template #icon>
            <el-icon class="status-icon" :class="status">
              <!-- <Loading v-if="status === 'pending' || status === 'processing'" />
              <CircleCheck v-else-if="status === 'completed'" />
              <CircleClose v-else /> -->
              <CircleClose v-if="status === 'failed'" />
              <CircleCheck v-else-if="status === 'completed'" />
              <Loading v-else />
            </el-icon>
          </template>
          <template #extra>
            <el-button @click="goNewTask">返回新建任务</el-button>
          </template>
        </el-result>

        <el-alert
          v-if="status === 'failed' && errorDetails"
          title="错误详情"
          type="error"
          :closable="false"
          show-icon
          class="error-alert"
        >
          <template #default>
            <p>{{ errorDetails }}</p>
          </template>
        </el-alert>

        <p class="tips" v-if="status === 'pending' || status === 'processing'">
          页面会自动刷新任务状态，你也可以稍后在任务详情查看进度。
        </p>
      </div>
    </el-card>
  </div>
</template>

<style scoped>
.waiting-container {
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

.waiting-card {
  border-radius: 12px;
  border: 1px solid rgba(226, 232, 240, 0.8);
  box-shadow: 0 2px 12px rgba(15, 23, 42, 0.08);
  transition: all 0.3s ease;
  overflow: hidden;
}

.waiting-card:hover {
  box-shadow: 0 4px 20px rgba(15, 23, 42, 0.12);
  transform: translateY(-1px);
}

.waiting-card :deep(.el-card__body) {
  padding: 32px;
}

.header {
  text-align: center;
  margin-bottom: 24px;
}

.title {
  margin: 0 0 10px 0;
  font-size: 26px;
  font-weight: 700;
  color: #2c3e50;
  background: linear-gradient(135deg, #4ade80 0%, #22d3ee 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.subtitle {
  margin: 0;
  font-size: 15px;
  color: #64748b;
  line-height: 1.6;
}

.status-section {
  margin-top: 16px;
}

.status-icon {
  font-size: 64px;
  background: linear-gradient(135deg, #4ade80 0%, #22d3ee 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.1);
  }
}

.status-icon.completed {
  background: linear-gradient(135deg, #4ade80 0%, #22d3ee 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  animation: none;
}

.status-icon.failed {
  background: linear-gradient(135deg, #f87171 0%, #ef4444 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  animation: none;
}

.waiting-card :deep(.el-result__title) {
  font-weight: 700;
  color: #1f2937;
  font-size: 26px;
  line-height: 1.35;
}

.waiting-card :deep(.el-result__extra) {
  margin-top: 22px;
}

.status-badge {
  display: block;
  width: fit-content;
  max-width: 100%;
  margin: 14px auto 0;
  padding: 14px 24px;
  border-radius: 24px;
  border: 1px solid rgba(59, 130, 246, 0.20);
  background: linear-gradient(135deg, rgba(239, 246, 255, 0.98) 0%, rgba(224, 249, 255, 0.96) 100%);
  box-shadow:
    0 12px 28px rgba(37, 99, 235, 0.11),
    0 1px 0 rgba(255, 255, 255, 0.9) inset;
  color: #0f172a;
  font-size: 22px;
  font-weight: 800;
  line-height: 1.2;
  letter-spacing: 0.01em;
  text-align: center;
}

.status-badge span {
  font-size: 22px;
  font-weight: 900;
}

.waiting-card :deep(.el-button) {
  border-radius: 8px;
  font-weight: 500;
  background: linear-gradient(135deg, #4ade80 0%, #22d3ee 100%);
  border: none;
  box-shadow: 0 2px 8px rgba(34, 211, 238, 0.25);
  transition: all 0.3s ease;
}

.waiting-card :deep(.el-button:hover) {
  box-shadow: 0 4px 12px rgba(34, 211, 238, 0.35);
  transform: translateY(-1px);
}

.error-alert {
  margin-top: 20px;
  border-radius: 8px;
}

.tips {
  margin-top: 20px;
  text-align: center;
  font-size: 14px;
  color: #64748b;
  padding: 12px;
  background: linear-gradient(135deg, #f0fdf4 0%, #ecfeff 100%);
  border-radius: 8px;
  border: 1px solid #e2e8f0;
}
</style>


