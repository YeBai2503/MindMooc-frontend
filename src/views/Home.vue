<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()

// 功能特色
const features = [
  {
    icon: 'VideoPlay',
    title: '智能视频解析',
    description: '上传慕课视频，AI自动提取关键知识点和结构信息',
    color: '#22d3ee'
  },
  {
    icon: 'Share',
    title: '思维导图生成',
    description: '基于视频内容自动生成结构化的思维导图',
    color: '#4ade80'
  },
  {
    icon: 'Edit',
    title: '可视化编辑',
    description: '支持在线编辑和自定义思维导图样式',
    color: '#fbbf24'
  },
  {
    icon: 'Files',
    title: '批量处理',
    description: '支持批量上传多个视频文件，提高学习效率',
    color: '#f87171'
  }
]

// 使用场景
const useCases = [
  {
    title: '学生学习',
    description: '快速梳理课程知识点，构建知识体系',
    icon: 'Reading'
  },
  {
    title: '教师备课',
    description: '辅助制作教学大纲和课程结构图',
    icon: 'User'
  },
  {
    title: '培训总结',
    description: '企业培训后快速生成学习要点',
    icon: 'Briefcase'
  },
  {
    title: '知识管理',
    description: '个人知识库的可视化整理工具',
    icon: 'Collection'
  }
]

// 开始使用
const startUsing = () => {
  router.push('/new-task')
}

// 了解更多
const learnMore = () => {
  // 滚动到功能介绍部分
  document.getElementById('features').scrollIntoView({ 
    behavior: 'smooth' 
  })
}
</script>

<template>
  <div class="home-container">
    <!-- 英雄区域 -->
    <section class="hero-section">
      <div class="hero-content">
        <div class="hero-text">
          <h1 class="hero-title">
            让学习更<span class="highlight">可视化</span>
          </h1>
          <p class="hero-subtitle">
            MindMooc 是一款基于AI的慕课视频思维导图生成工具
          </p>
          <p class="hero-description">
            上传您的学习视频，我们将自动分析内容并生成结构化的思维导图，
            帮助您更好地理解和记忆知识点，提升学习效率。
          </p>
          
          <div class="hero-actions">
            <el-button 
              type="primary" 
              size="large" 
              @click="startUsing"
              class="start-button"
            >
              <el-icon><Right /></el-icon>
              开始使用
            </el-button>
            <el-button 
              size="large" 
              @click="learnMore"
              class="learn-button"
            >
              了解更多
            </el-button>
          </div>
        </div>
        
        <div class="hero-image">
          <div class="image-container">
            <img src="/home.svg" alt="MindMooc" class="hero-logo" />
            <div class="floating-elements">
              <div class="floating-card card-1">
                <el-icon><VideoPlay /></el-icon>
                <span>视频解析</span>
              </div>
              <div class="floating-card card-2">
                <el-icon><Share /></el-icon>
                <span>思维导图</span>
              </div>
              <div class="floating-card card-3">
                <el-icon><BrainFilled /></el-icon>
                <span>AI智能</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- 功能特色 -->
    <section id="features" class="features-section">
      <div class="section-content">
        <div class="section-header">
          <h2 class="section-title">核心功能</h2>
          <p class="section-subtitle">强大的AI技术，简单的操作体验</p>
        </div>
        
        <div class="features-grid">
          <div 
            v-for="feature in features" 
            :key="feature.title"
            class="feature-card"
          >
            <div class="feature-icon" :style="{ color: feature.color }">
              <el-icon><component :is="feature.icon" /></el-icon>
            </div>
            <h3 class="feature-title">{{ feature.title }}</h3>
            <p class="feature-description">{{ feature.description }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- 使用场景 -->
    <section class="use-cases-section">
      <div class="section-content">
        <div class="section-header">
          <h2 class="section-title">适用场景</h2>
          <p class="section-subtitle">满足不同用户的学习和工作需求</p>
        </div>
        
        <div class="use-cases-grid">
          <div 
            v-for="useCase in useCases" 
            :key="useCase.title"
            class="use-case-card"
          >
            <div class="use-case-icon">
              <el-icon><component :is="useCase.icon" /></el-icon>
            </div>
            <h3 class="use-case-title">{{ useCase.title }}</h3>
            <p class="use-case-description">{{ useCase.description }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- 工作流程 -->
    <section class="workflow-section">
      <div class="section-content">
        <div class="section-header">
          <h2 class="section-title">简单三步，轻松使用</h2>
          <p class="section-subtitle">无需复杂操作，即可获得专业的思维导图</p>
        </div>
        
        <div class="workflow-steps">
          <div class="step-item">
            <div class="step-number">1</div>
            <div class="step-content">
              <h3 class="step-title">上传视频</h3>
              <p class="step-description">选择您的慕课视频文件，支持多种格式</p>
            </div>
          </div>
          
          <div class="step-arrow">
            <el-icon><Right /></el-icon>
          </div>
          
          <div class="step-item">
            <div class="step-number">2</div>
            <div class="step-content">
              <h3 class="step-title">AI分析</h3>
              <p class="step-description">系统自动分析视频内容，提取知识结构</p>
            </div>
          </div>
          
          <div class="step-arrow">
            <el-icon><Right /></el-icon>
          </div>
          
          <div class="step-item">
            <div class="step-number">3</div>
            <div class="step-content">
              <h3 class="step-title">获得导图</h3>
              <p class="step-description">生成可编辑的思维导图，支持导出分享</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- CTA区域 -->
    <section class="cta-section">
      <div class="cta-content">
        <h2 class="cta-title">准备好开始您的学习之旅了吗？</h2>
        <p class="cta-description">
          立即体验MindMooc，让AI帮助您构建更清晰的知识体系
        </p>
        <el-button 
          type="primary" 
          size="large" 
          @click="startUsing"
          class="cta-button"
        >
          <el-icon><Right /></el-icon>
          立即开始
        </el-button>
      </div>
    </section>
  </div>
</template>

<style scoped>
.home-container {
  min-height: 100vh;
}

/* 英雄区域 */
.hero-section {
  background: linear-gradient(135deg, #4ade80 0%, #22d3ee 50%, #06b6d4 100%);
  color: white;
  padding: 80px 0 120px;
  position: relative;
  overflow: hidden;
}

.hero-section::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse"><path d="M 10 0 L 0 0 0 10" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="0.5"/></pattern></defs><rect width="100" height="100" fill="url(%23grid)"/></svg>');
  opacity: 0.3;
}

.hero-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 24px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 60px;
  align-items: center;
  position: relative;
  z-index: 1;
}

.hero-title {
  font-size: 3.5rem;
  font-weight: 700;
  line-height: 1.2;
  margin: 0 0 24px 0;
}

.highlight {
  background: linear-gradient(45deg, #fbbf24, #f87171);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.hero-subtitle {
  font-size: 1.5rem;
  font-weight: 500;
  margin: 0 0 16px 0;
  opacity: 0.95;
}

.hero-description {
  font-size: 1.1rem;
  line-height: 1.7;
  margin: 0 0 40px 0;
  opacity: 0.9;
}

.hero-actions {
  display: flex;
  gap: 16px;
}

.start-button {
  background: linear-gradient(45deg, #4ade80, #22d3ee);
  border: none;
  padding: 20px 40px;
  font-size: 18px;
  font-weight: 700;
  box-shadow: 0 4px 15px rgba(74, 222, 128, 0.4);
  transition: all 0.3s ease;
}

.start-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(74, 222, 128, 0.5);
}

.learn-button {
  background: rgba(255, 255, 255, 0.15);
  border: 2px solid rgba(255, 255, 255, 0.4);
  color: white;
  padding: 20px 40px;
  font-size: 18px;
  font-weight: 600;
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;
}

.learn-button:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: translateY(-2px);
}

.hero-image {
  display: flex;
  justify-content: center;
  align-items: center;
}

.image-container {
  position: relative;
  width: 300px;
  height: 300px;
}

.hero-logo {
  width: 100%;
  height: 100%;
  object-fit: contain;
  filter: drop-shadow(0 10px 30px rgba(0, 0, 0, 0.2));
}

.floating-elements {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
}

.floating-card {
  position: absolute;
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  padding: 12px 16px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 500;
  animation: float 3s ease-in-out infinite;
}

.card-1 {
  top: 20px;
  right: -20px;
  animation-delay: 0s;
}

.card-2 {
  bottom: 60px;
  left: -30px;
  animation-delay: 1s;
}

.card-3 {
  top: 50%;
  right: -40px;
  animation-delay: 2s;
}

@keyframes float {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
}

/* 通用区域样式 */
.features-section,
.use-cases-section,
.workflow-section {
  padding: 80px 0;
}

.use-cases-section {
  background: #f8fafc;
}

.section-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 24px;
}

.section-header {
  text-align: center;
  margin-bottom: 60px;
}

.section-title {
  font-size: 2.5rem;
  font-weight: 700;
  color: #2c3e50;
  margin: 0 0 16px 0;
}

.section-subtitle {
  font-size: 1.2rem;
  color: #64748b;
  margin: 0;
}

/* 功能特色 */
.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 40px;
}

.feature-card {
  text-align: center;
  padding: 40px 20px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
}

.feature-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
}

.feature-icon {
  font-size: 48px;
  margin-bottom: 24px;
}

.feature-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: #2c3e50;
  margin: 0 0 16px 0;
}

.feature-description {
  color: #64748b;
  line-height: 1.6;
  margin: 0;
}

/* 使用场景 */
.use-cases-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 30px;
}

.use-case-card {
  background: white;
  padding: 30px 24px;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  transition: all 0.3s ease;
}

.use-case-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.1);
}

.use-case-icon {
  font-size: 32px;
  color: #22d3ee;
  margin-bottom: 16px;
}

.use-case-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #2c3e50;
  margin: 0 0 12px 0;
}

.use-case-description {
  color: #64748b;
  line-height: 1.6;
  margin: 0;
}

/* 工作流程 */
.workflow-steps {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 40px;
  max-width: 900px;
  margin: 0 auto;
}

.step-item {
  text-align: center;
  flex: 1;
}

.step-number {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: linear-gradient(135deg, #4ade80, #22d3ee);
  color: white;
  font-size: 24px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 20px;
  box-shadow: 0 4px 15px rgba(34, 211, 238, 0.3);
}

.step-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #2c3e50;
  margin: 0 0 12px 0;
}

.step-description {
  color: #64748b;
  line-height: 1.6;
  margin: 0;
}

.step-arrow {
  font-size: 24px;
  color: #22d3ee;
  flex-shrink: 0;
}

/* CTA区域 */
.cta-section {
  background: #ffffff;
  color: #2c3e50;
  padding: 80px 0;
  text-align: center;
  position: relative;
  border-top: 1px solid #e2e8f0;
}

.cta-content {
  max-width: 600px;
  margin: 0 auto;
  padding: 0 24px;
}

.cta-title {
  font-size: 2.5rem;
  font-weight: 700;
  color: #2c3e50;
  margin: 0 0 20px 0;
}

.cta-description {
  font-size: 1.2rem;
  color: #64748b;
  margin: 0 0 40px 0;
  line-height: 1.6;
}

.cta-button {
  background: linear-gradient(45deg, #4ade80, #22d3ee);
  border: none;
  color: white;
  padding: 24px 50px;
  font-size: 20px;
  font-weight: 700;
  border-radius: 12px;
  box-shadow: 0 8px 25px rgba(34, 211, 238, 0.3);
  transition: all 0.3s ease;
}

.cta-button:hover {
  background: linear-gradient(45deg, #22d3ee, #4ade80);
  transform: translateY(-3px);
  box-shadow: 0 12px 30px rgba(34, 211, 238, 0.4);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .hero-content {
    grid-template-columns: 1fr;
    gap: 40px;
    text-align: center;
  }
  
  .hero-title {
    font-size: 2.5rem;
  }
  
  .hero-actions {
    justify-content: center;
  }
  
  .workflow-steps {
    flex-direction: column;
    gap: 30px;
  }
  
  .step-arrow {
    transform: rotate(90deg);
  }
  
  .section-title {
    font-size: 2rem;
  }
  
  .cta-title {
    font-size: 2rem;
  }
}
</style>
