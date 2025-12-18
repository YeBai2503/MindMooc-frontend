<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import mermaid from 'mermaid'
import { getMindmap } from '@/api/mindmap'

const route = useRoute()
const router = useRouter()

// 编辑器状态
const mermaidCode = ref('')
const originalCode = ref('')
const previewRef = ref(null)
const codeEditorRef = ref(null)
const loading = ref(false)
const saving = ref(false)
const hasChanges = ref(false)

// 任务 / 导图信息
const taskInfo = ref({
  id: null, // 对应 TaskId，便于返回详情页
  name: ''
})

// 编辑器配置
const editorConfig = ref({
  theme: 'default',
  direction: 'TD',
  autoSave: true
})

// 主题选项
const themeOptions = [
  { label: '默认主题', value: 'default' },
  { label: '暗色主题', value: 'dark' },
  { label: '森林主题', value: 'forest' },
  { label: '中性主题', value: 'neutral' }
]

// 方向选项
const directionOptions = [
  { label: '从上到下', value: 'TD' },
  { label: '从下到上', value: 'BT' },
  { label: '从左到右', value: 'LR' },
  { label: '从右到左', value: 'RL' }
]

// 根据导图ID获取导图数据
const fetchTaskData = async () => {
  loading.value = true

  try {
    const mindmapId = route.params.id

    // MindmapVO
    const mindmap = await getMindmap(mindmapId)

    taskInfo.value = {
      id: mindmap.taskId,
      name: mindmap.title
    }

    mermaidCode.value = mindmap.mermaidCode || ''
    originalCode.value = mindmap.mermaidCode || ''

    await renderPreview()
  } catch (error) {
    console.error('获取导图数据失败:', error)
    ElMessage.error(error.message || '加载失败')
  } finally {
    loading.value = false
  }
}

// 渲染预览
const renderPreview = async () => {
  if (!previewRef.value || !mermaidCode.value.trim()) {
    if (previewRef.value) {
      previewRef.value.innerHTML = '<p style="color: #909399; text-align: center; padding: 40px;">请输入Mermaid代码</p>'
    }
    return
  }
  
  try {
    // 初始化mermaid
    mermaid.initialize({
      startOnLoad: false,
      theme: editorConfig.value.theme,
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
    previewRef.value.innerHTML = ''
    
    // 更新代码中的方向
    let codeToRender = mermaidCode.value
    if (codeToRender.startsWith('graph ')) {
      codeToRender = codeToRender.replace(/^graph \w+/, `graph ${editorConfig.value.direction}`)
    }
    
    // 渲染图表
    const { svg } = await mermaid.render('preview-graph', codeToRender)
    previewRef.value.innerHTML = svg
    
  } catch (error) {
    console.error('渲染预览失败:', error)
    previewRef.value.innerHTML = `<p style="color: #f56c6c; text-align: center; padding: 40px;">语法错误：${error.message}</p>`
  }
}

// 代码变化处理
const handleCodeChange = () => {
  hasChanges.value = mermaidCode.value !== originalCode.value
  
  // 防抖渲染
  clearTimeout(window.renderTimer)
  window.renderTimer = setTimeout(() => {
    renderPreview()
  }, 500)
  
  // 自动保存
  if (editorConfig.value.autoSave && hasChanges.value) {
    clearTimeout(window.autoSaveTimer)
    window.autoSaveTimer = setTimeout(() => {
      saveChanges(false)
    }, 3000)
  }
}

// 主题变化处理
const handleThemeChange = () => {
  renderPreview()
}

// 方向变化处理
const handleDirectionChange = () => {
  renderPreview()
}

// 保存更改
const saveChanges = async (showMessage = true) => {
  if (!hasChanges.value) {
    if (showMessage) ElMessage.info('没有需要保存的更改')
    return
  }
  
  saving.value = true
  
  try {
    // 模拟保存API
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    originalCode.value = mermaidCode.value
    hasChanges.value = false
    
    if (showMessage) ElMessage.success('保存成功！')
    
  } catch (error) {
    console.error('保存失败:', error)
    if (showMessage) ElMessage.error('保存失败')
  } finally {
    saving.value = false
  }
}

// 重置更改
const resetChanges = () => {
  mermaidCode.value = originalCode.value
  hasChanges.value = false
  renderPreview()
  ElMessage.info('已重置到原始版本')
}

// 插入模板
const insertTemplate = (template) => {
  const templates = {
    basic: `graph TD
    A[开始] --> B[步骤1]
    B --> C[步骤2]
    C --> D[结束]`,
    
    flowchart: `graph TD
    A[开始] --> B{判断条件}
    B -->|是| C[执行A]
    B -->|否| D[执行B]
    C --> E[结束]
    D --> E`,
    
    mindmap: `graph TD
    Root[主题] --> A[分支1]
    Root --> B[分支2]
    Root --> C[分支3]
    A --> A1[子分支1.1]
    A --> A2[子分支1.2]
    B --> B1[子分支2.1]
    B --> B2[子分支2.2]`
  }
  
  mermaidCode.value = templates[template] || ''
  handleCodeChange()
}

// 下载图表
const downloadChart = () => {
  const svg = previewRef.value?.querySelector('svg')
  if (!svg) {
    ElMessage.warning('请先生成图表')
    return
  }
  
  const svgData = new XMLSerializer().serializeToString(svg)
  const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' })
  const svgUrl = URL.createObjectURL(svgBlob)
  
  const downloadLink = document.createElement('a')
  downloadLink.href = svgUrl
  downloadLink.download = `${taskInfo.value.name}-mindmap-edited.svg`
  document.body.appendChild(downloadLink)
  downloadLink.click()
  document.body.removeChild(downloadLink)
  URL.revokeObjectURL(svgUrl)
}

// 返回任务详情
const goBack = () => {
  if (hasChanges.value) {
    ElMessageBox.confirm('有未保存的更改，确定要离开吗？', '提示', {
      confirmButtonText: '保存并离开',
      cancelButtonText: '直接离开',
      distinguishCancelAndClose: true,
      type: 'warning'
    }).then(() => {
      saveChanges(false).then(() => {
        router.push(`/task/${taskInfo.value.id}`)
      })
    }).catch((action) => {
      if (action === 'cancel') {
        router.push(`/task/${taskInfo.value.id}`)
      }
    })
  } else {
    router.push(`/task/${taskInfo.value.id}`)
  }
}

onMounted(() => {
  fetchTaskData()
})
</script>

<template>
  <div class="map-editor-container" v-loading="loading">
    <!-- 工具栏 -->
    <div class="toolbar">
      <div class="toolbar-left">
        <el-button @click="goBack" class="back-button">
          <el-icon><ArrowLeft /></el-icon>
          返回
        </el-button>
        <div class="title-section">
          <h3 class="editor-title">编辑思维导图</h3>
          <span class="task-name">{{ taskInfo.name }}</span>
        </div>
      </div>
      
      <div class="toolbar-right">
        <el-button-group>
          <el-button @click="resetChanges" :disabled="!hasChanges">
            <el-icon><RefreshLeft /></el-icon>
            重置
          </el-button>
          <el-button type="primary" @click="saveChanges()" :loading="saving">
            <el-icon><Check /></el-icon>
            {{ saving ? '保存中...' : '保存' }}
          </el-button>
        </el-button-group>
      </div>
    </div>

    <div class="editor-content">
      <!-- 左侧编辑区 -->
      <div class="editor-panel">
        <!-- 配置区 -->
        <el-card class="config-card" shadow="never">
          <template #header>
            <span>配置选项</span>
          </template>
          
          <div class="config-row">
            <el-select
              v-model="editorConfig.theme"
              placeholder="选择主题"
              @change="handleThemeChange"
              style="width: 120px"
            >
              <el-option
                v-for="option in themeOptions"
                :key="option.value"
                :label="option.label"
                :value="option.value"
              />
            </el-select>
            
            <el-select
              v-model="editorConfig.direction"
              placeholder="选择方向"
              @change="handleDirectionChange"
              style="width: 120px"
            >
              <el-option
                v-for="option in directionOptions"
                :key="option.value"
                :label="option.label"
                :value="option.value"
              />
            </el-select>
            
            <el-switch
              v-model="editorConfig.autoSave"
              active-text="自动保存"
              style="margin-left: 16px"
            />
          </div>
        </el-card>

        <!-- 模板区 -->
        <el-card class="template-card" shadow="never">
          <template #header>
            <span>快速模板</span>
          </template>
          
          <div class="template-buttons">
            <el-button size="small" @click="insertTemplate('basic')">
              基础流程
            </el-button>
            <el-button size="small" @click="insertTemplate('flowchart')">
              条件流程
            </el-button>
            <el-button size="small" @click="insertTemplate('mindmap')">
              思维导图
            </el-button>
          </div>
        </el-card>

        <!-- 代码编辑器 -->
        <el-card class="code-editor-card" shadow="never">
          <template #header>
            <div class="editor-header">
              <span>Mermaid 代码</span>
              <div class="editor-actions">
                <el-button size="small" @click="downloadChart">
                  <el-icon><Download /></el-icon>
                  下载
                </el-button>
              </div>
            </div>
          </template>
          
          <div class="code-editor">
            <el-input
              ref="codeEditorRef"
              v-model="mermaidCode"
              type="textarea"
              :rows="20"
              placeholder="请输入Mermaid代码..."
              @input="handleCodeChange"
              class="code-textarea"
            />
          </div>
        </el-card>
      </div>

      <!-- 右侧预览区 -->
      <div class="preview-panel">
        <el-card class="preview-card" shadow="never">
          <template #header>
            <div class="preview-header">
              <span>实时预览</span>
              <div class="preview-status">
                <el-tag v-if="hasChanges" type="warning" size="small">
                  未保存
                </el-tag>
                <el-tag v-else type="success" size="small">
                  已保存
                </el-tag>
              </div>
            </div>
          </template>
          
          <div class="preview-container">
            <div ref="previewRef" class="preview-content"></div>
          </div>
        </el-card>
      </div>
    </div>
  </div>
</template>

<style scoped>
.map-editor-container {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: linear-gradient(135deg, #f8fafc 0%, #f0fdf4 50%, #ecfeff 100%);
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  background: white;
  border-bottom: 2px solid #e2e8f0;
  box-shadow: 0 2px 8px rgba(15, 23, 42, 0.08);
}

.toolbar-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.back-button {
  border-radius: 8px;
  font-weight: 500;
  transition: all 0.3s ease;
}

.back-button:hover {
  transform: translateX(-2px);
}

.title-section {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.editor-title {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  color: #2c3e50;
}

.task-name {
  font-size: 14px;
  color: #64748b;
}

.toolbar-right .el-button {
  border-radius: 8px;
  font-weight: 500;
  transition: all 0.3s ease;
}

.toolbar-right .el-button--primary {
  background: linear-gradient(135deg, #4ade80 0%, #22d3ee 100%);
  border: none;
  box-shadow: 0 2px 8px rgba(34, 211, 238, 0.25);
}

.toolbar-right .el-button--primary:hover {
  box-shadow: 0 4px 12px rgba(34, 211, 238, 0.35);
  transform: translateY(-1px);
}

.editor-content {
  flex: 1;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  padding: 16px;
  overflow: hidden;
}

.editor-panel,
.preview-panel {
  display: flex;
  flex-direction: column;
  gap: 16px;
  overflow: hidden;
}

.config-card,
.template-card {
  flex-shrink: 0;
  border-radius: 12px;
  border: 1px solid rgba(226, 232, 240, 0.8);
  box-shadow: 0 2px 12px rgba(15, 23, 42, 0.08);
  transition: all 0.3s ease;
}

.config-card:hover,
.template-card:hover {
  box-shadow: 0 4px 20px rgba(15, 23, 42, 0.12);
  transform: translateY(-1px);
}

.config-card :deep(.el-card__header),
.template-card :deep(.el-card__header) {
  background: linear-gradient(135deg, rgba(74, 222, 128, 0.05) 0%, rgba(34, 211, 238, 0.05) 100%);
  border-bottom: 1px solid rgba(226, 232, 240, 0.8);
  padding: 14px 20px;
  border-radius: 12px 12px 0 0;
  font-weight: 600;
  color: #2c3e50;
}

.config-row {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.config-row :deep(.el-select__wrapper),
.config-row :deep(.el-input__wrapper) {
  border-radius: 8px;
  transition: all 0.3s ease;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.config-row :deep(.el-select__wrapper:hover),
.config-row :deep(.el-input__wrapper:hover) {
  box-shadow: 0 2px 8px rgba(34, 211, 238, 0.15);
}

.template-buttons {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.template-buttons .el-button {
  border-radius: 8px;
  font-weight: 500;
  transition: all 0.2s ease;
}

.template-buttons .el-button:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(34, 211, 238, 0.15);
}

.code-editor-card {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border-radius: 12px;
  border: 1px solid rgba(226, 232, 240, 0.8);
  box-shadow: 0 2px 12px rgba(15, 23, 42, 0.08);
}

.code-editor-card :deep(.el-card__header) {
  background: linear-gradient(135deg, rgba(74, 222, 128, 0.05) 0%, rgba(34, 211, 238, 0.05) 100%);
  border-bottom: 1px solid rgba(226, 232, 240, 0.8);
  padding: 14px 20px;
  border-radius: 12px 12px 0 0;
  font-weight: 600;
  color: #2c3e50;
}

.code-editor-card :deep(.el-card__body) {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding: 0;
}

.editor-header,
.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.editor-actions {
  display: flex;
  gap: 8px;
}

.editor-actions .el-button {
  border-radius: 6px;
  font-weight: 500;
  transition: all 0.2s ease;
}

.editor-actions .el-button:hover {
  transform: translateY(-1px);
}

.code-editor {
  flex: 1;
  overflow: hidden;
}

.code-textarea {
  height: 100%;
}

.code-textarea :deep(.el-textarea__inner) {
  height: 100% !important;
  resize: none;
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  font-size: 14px;
  line-height: 1.6;
  border: none;
  background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
  color: #e2e8f0;
  padding: 20px;
  border-radius: 0 0 12px 12px;
}

.preview-card {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border-radius: 12px;
  border: 1px solid rgba(226, 232, 240, 0.8);
  box-shadow: 0 2px 12px rgba(15, 23, 42, 0.08);
}

.preview-card :deep(.el-card__header) {
  background: linear-gradient(135deg, rgba(74, 222, 128, 0.05) 0%, rgba(34, 211, 238, 0.05) 100%);
  border-bottom: 1px solid rgba(226, 232, 240, 0.8);
  padding: 14px 20px;
  border-radius: 12px 12px 0 0;
  font-weight: 600;
  color: #2c3e50;
}

.preview-card :deep(.el-card__body) {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding: 0;
}

.preview-container {
  flex: 1;
  overflow: auto;
  background: linear-gradient(135deg, #fafbfc 0%, #f8fafc 100%);
}

.preview-content {
  min-height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.preview-content :deep(svg) {
  max-width: 100%;
  height: auto;
}

.preview-status {
  display: flex;
  align-items: center;
  gap: 8px;
}

@media (max-width: 1024px) {
  .editor-content {
    grid-template-columns: 1fr;
    grid-template-rows: 1fr 1fr;
  }
}

@media (max-width: 768px) {
  .toolbar {
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
  }
  
  .toolbar-left,
  .toolbar-right {
    justify-content: space-between;
  }
  
  .config-row {
    flex-direction: column;
    align-items: stretch;
  }
  
  .config-row .el-select {
    width: 100% !important;
  }
}
</style>
