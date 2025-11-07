<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import mermaid from 'mermaid'

const route = useRoute()
const router = useRouter()

// 任务详情
const taskDetail = ref({
  id: null,
  name: '',
  status: 'completed',
  createTime: '',
  completeTime: '',
  videoUrl: '',
  mermaidCode: '',
  description: ''
})

const loading = ref(false)
const videoRef = ref(null)
const mermaidRef = ref(null)

// 可调整大小相关状态
const videoWidth = ref(50) // 视频区域宽度百分比
const mindmapWidth = ref(50) // 思维导图区域宽度百分比
const containerHeight = ref(500) // 容器高度
const isResizing = ref(false)
const isResizingHeight = ref(false)
const startX = ref(0)
const startY = ref(0)
const startVideoWidth = ref(50)
const startHeight = ref(500)

// 模拟任务数据
const mockTaskData = {
  id: 1,
  name: '机器学习基础课程',
  status: 'completed',
  createTime: '2024-01-15 14:30:00',
  completeTime: '2024-01-15 14:35:00',
  videoUrl: '/api/video/sample.mp4', // 模拟视频URL
  description: '这是一个关于机器学习基础概念的教学视频，包含了监督学习、无监督学习等核心内容。',
  mermaidCode: `graph TD
    A[机器学习] --> B[监督学习]
    A --> C[无监督学习]
    A --> D[强化学习]
    
    B --> E[分类]
    B --> F[回归]
    
    E --> G[决策树]
    E --> H[支持向量机]
    E --> I[神经网络]
    
    F --> J[线性回归]
    F --> K[多项式回归]
    
    C --> L[聚类]
    C --> M[降维]
    
    L --> N[K-means]
    L --> O[层次聚类]
    
    M --> P[PCA]
    M --> Q[t-SNE]
    
    D --> R[Q-learning]
    D --> S[策略梯度]`
}

// 获取任务详情
const fetchTaskDetail = async () => {
  loading.value = true
  
  try {
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    taskDetail.value = { ...mockTaskData, id: route.params.id }
    
    // 渲染思维导图
    await renderMermaid()
    
  } catch (error) {
    console.error('获取任务详情失败:', error)
  } finally {
    loading.value = false
  }
}

// 渲染Mermaid图表
const renderMermaid = async () => {
  if (!mermaidRef.value || !taskDetail.value.mermaidCode) return
  
  try {
    // 初始化mermaid
    mermaid.initialize({
      startOnLoad: false,
      theme: 'default',
      themeVariables: {
        primaryColor: '#22d3ee',
        primaryTextColor: '#2c3e50',
        primaryBorderColor: '#22d3ee',
        lineColor: '#6b7280',
        secondaryColor: '#ecfdf5',
        tertiaryColor: '#f0fdfa'
      }
    })
    
    // 清空容器
    mermaidRef.value.innerHTML = ''
    
    // 渲染图表
    const { svg } = await mermaid.render('mermaid-graph', taskDetail.value.mermaidCode)
    mermaidRef.value.innerHTML = svg
    
  } catch (error) {
    console.error('渲染思维导图失败:', error)
    mermaidRef.value.innerHTML = '<p style="color: #f56c6c;">思维导图渲染失败</p>'
  }
}

// 编辑思维导图
const editMindMap = () => {
  router.push(`/editor/${taskDetail.value.id}`)
}

// 下载思维导图
const downloadMindMap = () => {
  const svg = mermaidRef.value.querySelector('svg')
  if (!svg) return
  
  // 创建下载链接
  const svgData = new XMLSerializer().serializeToString(svg)
  const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' })
  const svgUrl = URL.createObjectURL(svgBlob)
  
  const downloadLink = document.createElement('a')
  downloadLink.href = svgUrl
  downloadLink.download = `${taskDetail.value.name}-mindmap.svg`
  document.body.appendChild(downloadLink)
  downloadLink.click()
  document.body.removeChild(downloadLink)
  URL.revokeObjectURL(svgUrl)
}

// 复制Mermaid代码
const copyMermaidCode = async () => {
  try {
    await navigator.clipboard.writeText(taskDetail.value.mermaidCode)
    ElMessage.success('代码已复制到剪贴板')
  } catch (error) {
    ElMessage.error('复制失败')
  }
}

// 返回历史任务
const goBack = () => {
  router.push('/history-task')
}

// 开始拖拽调整大小
const startResize = (e) => {
  // 在移动端禁用拖拽功能
  if (window.innerWidth <= 1024) {
    return
  }
  
  isResizing.value = true
  startX.value = e.clientX || e.touches[0].clientX
  startVideoWidth.value = videoWidth.value
  
  // 添加全局事件监听
  document.addEventListener('mousemove', handleResize)
  document.addEventListener('mouseup', stopResize)
  document.addEventListener('touchmove', handleResize)
  document.addEventListener('touchend', stopResize)
  
  // 防止选择文本
  document.body.style.userSelect = 'none'
  e.preventDefault()
}

// 处理拖拽调整
const handleResize = (e) => {
  if (!isResizing.value) return
  
  const currentX = e.clientX || e.touches[0].clientX
  const deltaX = currentX - startX.value
  const containerWidth = document.querySelector('.resizable-container').offsetWidth
  const deltaPercent = (deltaX / containerWidth) * 100
  
  let newVideoWidth = startVideoWidth.value + deltaPercent
  
  // 限制最小和最大宽度
  newVideoWidth = Math.max(20, Math.min(80, newVideoWidth))
  
  videoWidth.value = newVideoWidth
  mindmapWidth.value = 100 - newVideoWidth
}

// 停止拖拽调整
const stopResize = () => {
  isResizing.value = false
  isResizingHeight.value = false
  
  // 移除全局事件监听
  document.removeEventListener('mousemove', handleResize)
  document.removeEventListener('mouseup', stopResize)
  document.removeEventListener('touchmove', handleResize)
  document.removeEventListener('touchend', stopResize)
  document.removeEventListener('mousemove', handleHeightResize)
  document.removeEventListener('touchmove', handleHeightResize)
  
  // 恢复文本选择
  document.body.style.userSelect = ''
}

// 开始高度调整
const startHeightResize = (e) => {
  // 在移动端禁用拖拽功能
  if (window.innerWidth <= 1024) {
    return
  }
  
  isResizingHeight.value = true
  startY.value = e.clientY || e.touches[0].clientY
  startHeight.value = containerHeight.value
  
  // 添加全局事件监听
  document.addEventListener('mousemove', handleHeightResize)
  document.addEventListener('mouseup', stopResize)
  document.addEventListener('touchmove', handleHeightResize)
  document.addEventListener('touchend', stopResize)
  
  // 防止选择文本
  document.body.style.userSelect = 'none'
  e.preventDefault()
}

// 处理高度调整
const handleHeightResize = (e) => {
  if (!isResizingHeight.value) return
  
  const currentY = e.clientY || e.touches[0].clientY
  const deltaY = currentY - startY.value
  
  let newHeight = startHeight.value + deltaY
  
  // 限制最小和最大高度
  const maxHeight = window.innerHeight * 0.85 // 屏幕高度的85%
  const minHeight = 500
  
  newHeight = Math.max(minHeight, Math.min(maxHeight, newHeight))
  
  containerHeight.value = newHeight
}

onMounted(() => {
  fetchTaskDetail()
  
  // 初始化容器高度为屏幕高度的60%，但不超过800px
  const initialHeight = Math.min(window.innerHeight * 0.6, 800)
  containerHeight.value = Math.max(initialHeight, 400) // 最小400px
})
</script>

<template>
  <div class="task-detail-container" v-loading="loading">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-left">
        <el-button @click="goBack" class="back-button">
          <el-icon><ArrowLeft /></el-icon>
          返回
        </el-button>
        <div class="title-section">
          <h2 class="page-title">{{ taskDetail.name }}</h2>
          <div class="task-meta">
            <el-tag type="success" size="small">已完成</el-tag>
            <span class="create-time">创建时间：{{ taskDetail.createTime }}</span>
          </div>
        </div>
      </div>
      
      <div class="header-actions">
        <el-button type="primary" @click="editMindMap">
          <el-icon><Edit /></el-icon>
          编辑导图
        </el-button>
      </div>
    </div>

    <div class="detail-content">
      <!-- 视频和思维导图可调整大小区域 -->
      <div class="resizable-wrapper">
        <div class="resizable-container" :style="{ height: containerHeight + 'px' }">
          <!-- 视频播放区域 -->
          <div class="resizable-panel video-panel" :style="{ width: videoWidth + '%' }">
            <el-card class="video-card" shadow="hover">
              <template #header>
                <div class="card-header">
                  <div class="header-title">
                    <el-icon><VideoPlay /></el-icon>
                    <span>视频播放</span>
                  </div>
                </div>
              </template>
              
              <div class="video-container">
                <video
                  ref="videoRef"
                  controls
                  class="video-player"
                  :poster="'/api/video/poster.jpg'"
                >
                  <source :src="taskDetail.videoUrl" type="video/mp4">
                  您的浏览器不支持视频播放。
                </video>
              </div>
            </el-card>
          </div>

          <!-- 宽度拖拽分割线 -->
          <div 
            class="resize-handle resize-handle-width"
            @mousedown="startResize"
            @touchstart="startResize"
          >
            <div class="resize-line resize-line-vertical"></div>
          </div>

          <!-- 思维导图区域 -->
          <div class="resizable-panel mindmap-panel" :style="{ width: mindmapWidth + '%' }">
            <el-card class="mindmap-card" shadow="hover">
              <template #header>
                <div class="card-header">
                  <div class="header-title">
                    <el-icon><Share /></el-icon>
                    <span>思维导图</span>
                  </div>
                  <div class="header-actions">
                    <el-button size="small" @click="copyMermaidCode">
                      <el-icon><CopyDocument /></el-icon>
                      复制代码
                    </el-button>
                    <el-button size="small" @click="downloadMindMap">
                      <el-icon><Download /></el-icon>
                      下载SVG
                    </el-button>
                  </div>
                </div>
              </template>
              
              <div class="mindmap-container">
                <div ref="mermaidRef" class="mermaid-graph"></div>
              </div>
            </el-card>
          </div>
        </div>
        
        <!-- 高度拖拽分割线 -->
        <div 
          class="resize-handle resize-handle-height"
          @mousedown="startHeightResize"
          @touchstart="startHeightResize"
        >
          <div class="resize-line resize-line-horizontal"></div>
        </div>
      </div>

      <!-- 视频描述区域 -->
      <el-card v-if="taskDetail.description" class="description-card" shadow="hover">
        <template #header>
          <div class="card-header">
            <div class="header-title">
              <el-icon><InfoFilled /></el-icon>
              <span>视频描述</span>
            </div>
          </div>
        </template>
        
        <div class="description-content">
          <p>{{ taskDetail.description }}</p>
        </div>
      </el-card>

      <!-- Mermaid代码区域 -->
      <el-card class="code-card" shadow="hover">
        <template #header>
          <div class="card-header">
            <div class="header-title">
              <el-icon><Document /></el-icon>
              <span>Mermaid 代码</span>
            </div>
          </div>
        </template>
        
        <div class="code-container">
          <pre class="code-block"><code>{{ taskDetail.mermaidCode }}</code></pre>
        </div>
      </el-card>
    </div>
  </div>
</template>

<style scoped>
.task-detail-container {
  max-width: 1200px;
  margin: 0 auto;
  min-height: 100vh;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid #e2e8f0;
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
  font-size: 24px;
  color: #2c3e50;
  margin: 0 0 8px 0;
}

.task-meta {
  display: flex;
  align-items: center;
  gap: 16px;
}

.create-time {
  font-size: 14px;
  color: #64748b;
}

.header-actions {
  display: flex;
  gap: 8px;
}

.detail-content {
  display: grid;
  gap: 24px;
}

.resizable-wrapper {
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.resizable-container {
  display: flex;
  gap: 0;
  transition: height 0.1s ease;
}

.resizable-panel {
  display: flex;
  flex-direction: column;
  min-width: 20%;
  max-width: 80%;
}

.resizable-panel .el-card {
  height: 100%;
  border: none;
  border-radius: 0;
  box-shadow: none;
}

.resizable-panel .el-card__body {
  height: calc(100% - 60px);
  padding: 0;
}

.resize-handle-width {
  width: 8px;
  background: #f0f2f5;
  cursor: col-resize;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  transition: background-color 0.2s ease;
  flex-shrink: 0;
}

.resize-handle-height {
  width: 100%;
  height: 8px;
  background: #f0f2f5;
  cursor: row-resize;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  transition: background-color 0.2s ease;
  flex-shrink: 0;
}

.resize-handle-width:hover,
.resize-handle-height:hover {
  background: #e6f7ff;
}

.resize-handle-width:active,
.resize-handle-height:active {
  background: #bae7ff;
}

.resize-line-vertical {
  width: 2px;
  height: 40px;
  background: #d9d9d9;
  border-radius: 1px;
  transition: background-color 0.2s ease;
}

.resize-line-horizontal {
  width: 40px;
  height: 2px;
  background: #d9d9d9;
  border-radius: 1px;
  transition: background-color 0.2s ease;
}

.resize-handle-width:hover .resize-line-vertical,
.resize-handle-height:hover .resize-line-horizontal {
  background: #22d3ee;
}

.video-panel .el-card {
  border-right: 1px solid #f0f0f0;
}

.mindmap-panel .el-card {
  border-left: 1px solid #f0f0f0;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
}

.header-title {
  display: flex;
  align-items: center;
  gap: 8px;
}

.video-container {
  height: 100%;
  background: #000;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.video-player {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.mindmap-container {
  height: 100%;
  padding: 20px;
  background: #fafbfc;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.description-content {
  padding: 0;
}

.description-content p {
  margin: 0;
  color: #64748b;
  line-height: 1.8;
  font-size: 15px;
}

.mermaid-graph {
  width: 100%;
  overflow-x: auto;
}

.mermaid-graph :deep(svg) {
  max-width: 100%;
  height: auto;
}

.code-container {
  background: #f8fafc;
  border-radius: 8px;
  overflow: hidden;
}

.code-block {
  margin: 0;
  padding: 20px;
  background: #2d3748;
  color: #e2e8f0;
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  font-size: 14px;
  line-height: 1.6;
  overflow-x: auto;
  white-space: pre-wrap;
}

@media (max-width: 1024px) {
  .resizable-container {
    flex-direction: column;
    height: auto !important;
  }
  
  .resizable-panel {
    min-width: 100%;
    max-width: 100%;
    height: 400px;
  }
  
  .resize-handle-width,
  .resize-handle-height {
    display: none;
  }
  
  .video-panel .el-card {
    border-right: none;
    border-bottom: 1px solid #f0f0f0;
  }
  
  .mindmap-panel .el-card {
    border-left: none;
    border-top: 1px solid #f0f0f0;
  }
}

@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    gap: 16px;
  }
  
  .header-left {
    width: 100%;
  }
  
  .header-actions {
    width: 100%;
    justify-content: flex-end;
  }
  
  .card-header {
    flex-direction: column;
    gap: 12px;
    align-items: flex-start;
  }
  
  .header-actions {
    align-self: stretch;
  }
  
  .resizable-panel {
    height: 300px;
  }
  
  .mindmap-container {
    padding: 15px;
  }
}
</style>
