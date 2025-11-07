<script setup>
import { ref, onMounted, watch, nextTick } from 'vue'
import mermaid from 'mermaid'

// Props
const props = defineProps({
  code: {
    type: String,
    required: true
  },
  theme: {
    type: String,
    default: 'default'
  },
  config: {
    type: Object,
    default: () => ({})
  }
})

// Emits
const emit = defineEmits(['render-success', 'render-error'])

// Refs
const chartRef = ref(null)
const loading = ref(false)
const error = ref(null)

// 渲染图表
const renderChart = async () => {
  if (!chartRef.value || !props.code.trim()) {
    if (chartRef.value) {
      chartRef.value.innerHTML = '<p style="color: #909399; text-align: center; padding: 40px;">请提供Mermaid代码</p>'
    }
    return
  }

  loading.value = true
  error.value = null

  try {
    // 初始化mermaid配置
    const config = {
      startOnLoad: false,
      theme: props.theme,
      themeVariables: {
        primaryColor: '#22d3ee',
        primaryTextColor: '#2c3e50',
        primaryBorderColor: '#22d3ee',
        lineColor: '#6b7280',
        secondaryColor: '#ecfdf5',
        tertiaryColor: '#f0fdfa',
        background: '#ffffff',
        mainBkg: '#ffffff',
        secondaryBkg: '#f0fdfa',
        tertiaryBkg: '#ecfdf5'
      },
      ...props.config
    }

    mermaid.initialize(config)

    // 清空容器
    chartRef.value.innerHTML = ''

    // 生成唯一ID
    const chartId = `mermaid-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    // 渲染图表
    const { svg } = await mermaid.render(chartId, props.code)
    chartRef.value.innerHTML = svg

    emit('render-success', { svg, element: chartRef.value })

  } catch (err) {
    console.error('Mermaid渲染失败:', err)
    error.value = err.message || '图表渲染失败'
    chartRef.value.innerHTML = `
      <div style="
        color: #f56c6c; 
        text-align: center; 
        padding: 40px;
        background: #fef0f0;
        border: 1px solid #fbc4c4;
        border-radius: 8px;
        margin: 20px;
      ">
        <p style="margin: 0 0 8px 0; font-weight: 600;">图表渲染失败</p>
        <p style="margin: 0; font-size: 14px; opacity: 0.8;">${error.value}</p>
      </div>
    `
    emit('render-error', err)
  } finally {
    loading.value = false
  }
}

// 监听代码变化
watch(() => props.code, () => {
  nextTick(() => {
    renderChart()
  })
}, { immediate: false })

// 监听主题变化
watch(() => props.theme, () => {
  nextTick(() => {
    renderChart()
  })
})

// 监听配置变化
watch(() => props.config, () => {
  nextTick(() => {
    renderChart()
  })
}, { deep: true })

// 组件挂载后渲染
onMounted(() => {
  nextTick(() => {
    renderChart()
  })
})

// 暴露方法
defineExpose({
  renderChart,
  loading,
  error
})
</script>

<template>
  <div class="mermaid-chart-container">
    <div 
      ref="chartRef" 
      class="mermaid-chart"
      :class="{ loading: loading }"
    ></div>
    
    <!-- 加载状态 -->
    <div v-if="loading" class="loading-overlay">
      <el-icon class="loading-icon"><Loading /></el-icon>
      <span>正在渲染图表...</span>
    </div>
  </div>
</template>

<style scoped>
.mermaid-chart-container {
  position: relative;
  width: 100%;
  min-height: 200px;
}

.mermaid-chart {
  width: 100%;
  text-align: center;
  overflow-x: auto;
  padding: 20px;
  background: #fafbfc;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  transition: all 0.3s ease;
}

.mermaid-chart.loading {
  opacity: 0.6;
}

.mermaid-chart :deep(svg) {
  max-width: 100%;
  height: auto;
  display: block;
  margin: 0 auto;
}

.loading-overlay {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  color: #22d3ee;
  font-size: 14px;
  z-index: 10;
}

.loading-icon {
  font-size: 24px;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .mermaid-chart {
    padding: 12px;
  }
}
</style>
