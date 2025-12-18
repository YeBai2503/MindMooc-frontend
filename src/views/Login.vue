<script setup>
import { ref, onMounted, watch, onBeforeUnmount } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { login, register } from '@/api/user'

const router = useRouter()
const route = useRoute()

// 当前 Tab：login / register / forgot
const activeTab = ref('login')
const loading = ref(false)

// 忘记密码 - 发送验证码相关
const sendingCode = ref(false)
const codeCountdown = ref(0)
let codeTimer = null

// 登录表单
const loginFormRef = ref(null)
const loginForm = ref({
  username: '',
  password: ''
})

const loginRules = {
  username: [{ required: true, message: '请输入用户名或邮箱', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }]
}

// 注册表单
const registerFormRef = ref(null)
const registerForm = ref({
  username: '',
  email: '',
  password: '',
  confirmPassword: ''
})

const registerRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 50, message: '用户名长度在 3 到 50 个字符', trigger: 'blur' }
  ],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, max: 20, message: '密码长度在 6 到 20 个字符', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请再次输入密码', trigger: 'blur' },
    {
      validator: (rule, value, callback) => {
        if (value !== registerForm.value.password) {
          callback(new Error('两次输入的密码不一致'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ]
}

// 计算登录/注册后的跳转地址：优先使用 redirect，其次跳转到新建任务页
const getRedirectPath = () => {
  return typeof route.query.redirect === 'string' ? route.query.redirect : '/new-task'
}

// 忘记密码表单：邮箱 + 验证码 + 新密码 + 确认新密码
const forgotFormRef = ref(null)
const forgotForm = ref({
  email: '',
  code: '',
  newPassword: '',
  confirmNewPassword: ''
})

const forgotRules = {
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' }
  ],
  code: [{ required: true, message: '请输入验证码', trigger: 'blur' }],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, max: 20, message: '密码长度在 6 到 20 个字符', trigger: 'blur' }
  ],
  confirmNewPassword: [
    { required: true, message: '请再次输入新密码', trigger: 'blur' },
    {
      validator: (rule, value, callback) => {
        if (value !== forgotForm.value.newPassword) {
          callback(new Error('两次输入的新密码不一致'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ]
}

// 登录
const submitLogin = async () => {
  if (!loginFormRef.value) return

  try {
    const valid = await loginFormRef.value.validate()
    if (!valid) return
  } catch {
    return
  }

  loading.value = true
  try {
    await login({
      username: loginForm.value.username,
      password: loginForm.value.password
    })
    ElMessage.success('登录成功')

    const redirect = getRedirectPath()
    router.push(redirect)
  } catch (error) {
    console.error('登录失败:', error)
  } finally {
    loading.value = false
  }
}

// 注册
const submitRegister = async () => {
  if (!registerFormRef.value) return

  try {
    const valid = await registerFormRef.value.validate()
    if (!valid) return
  } catch {
    return
  }

  loading.value = true
  try {
    await register({
      username: registerForm.value.username,
      email: registerForm.value.email,
      password: registerForm.value.password
    })
    ElMessage.success('注册成功！正在自动登录...')

    await login({
      username: registerForm.value.username,
      password: registerForm.value.password
    })

    const redirect = getRedirectPath()
    router.push(redirect)
  } catch (error) {
    console.error('注册失败:', error)
  } finally {
    loading.value = false
  }
}

// 发送验证码：只校验邮箱是否填写正确
const sendCode = async () => {
  if (!forgotFormRef.value) return

  try {
    await forgotFormRef.value.validateField('email')
  } catch {
    // 邮箱未通过校验（例如没填），直接返回
    return
  }

  if (sendingCode.value || codeCountdown.value > 0) return

  sendingCode.value = true
  try {
    // TODO: 对接后端发送验证码接口
    await new Promise((resolve) => setTimeout(resolve, 1000))
    ElMessage.success('验证码已发送到您的邮箱，请注意查收')

    codeCountdown.value = 60
    codeTimer = setInterval(() => {
      if (codeCountdown.value > 0) {
        codeCountdown.value -= 1
      } else if (codeTimer) {
        clearInterval(codeTimer)
        codeTimer = null
      }
    }, 1000)
  } catch (error) {
    console.error('发送验证码失败:', error)
    ElMessage.error('发送失败，请重试')
  } finally {
    sendingCode.value = false
  }
}

// 忘记密码：这里只做前端校验和提示，留出后端接口位置
const submitForgot = async () => {
  if (!forgotFormRef.value) return

  try {
    const valid = await forgotFormRef.value.validate()
    if (!valid) return
  } catch {
    return
  }

  loading.value = true
  try {
    // TODO: 对接后端重置密码接口：校验验证码 + 更新密码
    await new Promise((resolve) => setTimeout(resolve, 1500))
    ElMessage.success('密码已重置，请使用新密码登录')
    activeTab.value = 'login'
  } catch (error) {
    console.error('重置密码失败:', error)
    ElMessage.error('重置失败，请重试')
  } finally {
    loading.value = false
  }
}

// 在输入框中按下回车时，根据当前 Tab 触发对应提交
const handleEnter = () => {
  if (activeTab.value === 'login') {
    submitLogin()
  } else if (activeTab.value === 'register') {
    submitRegister()
  } else if (activeTab.value === 'forgot') {
    submitForgot()
  }
}

// 底部“立即注册”点击
const goRegister = () => {
  activeTab.value = 'register'
}

// 根据路由自动选择初始 Tab（/register 或 ?tab=register）
const syncTabWithRoute = () => {
  const queryTab = typeof route.query.tab === 'string' ? route.query.tab : ''
  if (route.path === '/register' || queryTab === 'register') {
    activeTab.value = 'register'
  } else {
    activeTab.value = 'login'
  }
}

onMounted(() => {
  syncTabWithRoute()
})

watch(
  () => route.fullPath,
  () => {
    syncTabWithRoute()
  }
)

onBeforeUnmount(() => {
  if (codeTimer) {
    clearInterval(codeTimer)
    codeTimer = null
  }
})
</script>

<template>
  <div class="auth-container">
    <el-card class="auth-card" shadow="hover">
      <h1 class="title">欢迎使用 MindMooc</h1>
      <!-- <p class="subtitle">使用账号登录以创建和管理你的学习任务</p> -->

      <!-- Tab 切换 -->
      <div class="tabs">
        <div
          class="tab-item"
          :class="{ active: activeTab === 'login' }"
          @click="activeTab = 'login'"
        >
          登录
        </div>
        <div
          class="tab-item"
          :class="{ active: activeTab === 'register' }"
          @click="activeTab = 'register'"
        >
          注册
        </div>
        <div
          class="tab-item"
          :class="{ active: activeTab === 'forgot' }"
          @click="activeTab = 'forgot'"
        >
          忘记密码
        </div>
      </div>

      <!-- 登录表单 -->
      <el-form
        v-show="activeTab === 'login'"
        ref="loginFormRef"
        :model="loginForm"
        :rules="loginRules"
        @keyup.enter.prevent="handleEnter"
        label-width="0"
        size="large"
        class="auth-form"
      >
        <el-form-item prop="username">
          <el-input v-model="loginForm.username" placeholder="用户名或邮箱" />
        </el-form-item>
        <el-form-item prop="password">
          <el-input
            v-model="loginForm.password"
            type="password"
            show-password
            placeholder="密码"
          />
        </el-form-item>
        <el-form-item>
          <el-button
            type="primary"
            class="submit-btn"
            :loading="loading"
            @click="submitLogin"
          >
            登录
          </el-button>
        </el-form-item>
      </el-form>

      <!-- 注册表单 -->
      <el-form
        v-show="activeTab === 'register'"
        ref="registerFormRef"
        :model="registerForm"
        :rules="registerRules"
        @keyup.enter.prevent="handleEnter"
        label-width="0"
        size="large"
        class="auth-form"
      >
        <el-form-item prop="username">
          <el-input v-model="registerForm.username" placeholder="用户名" />
        </el-form-item>
        <el-form-item prop="email">
          <el-input v-model="registerForm.email" placeholder="邮箱" />
        </el-form-item>
        <el-form-item prop="password">
          <el-input
            v-model="registerForm.password"
            type="password"
            show-password
            placeholder="密码（6~20个字符）"
          />
        </el-form-item>
        <el-form-item prop="confirmPassword">
          <el-input
            v-model="registerForm.confirmPassword"
            type="password"
            show-password
            placeholder="确认密码"
          />
        </el-form-item>
        <el-form-item>
          <el-button
            type="primary"
            class="submit-btn"
            :loading="loading"
            @click="submitRegister"
          >
            注册
          </el-button>
        </el-form-item>
      </el-form>

      <!-- 忘记密码表单 -->
      <el-form
        v-show="activeTab === 'forgot'"
        ref="forgotFormRef"
        :model="forgotForm"
        :rules="forgotRules"
        @keyup.enter.prevent="handleEnter"
        label-width="0"
        size="large"
        class="auth-form"
      >
        <el-form-item prop="email">
          <el-input v-model="forgotForm.email" placeholder="注册邮箱" />
        </el-form-item>
        <el-form-item prop="code">
          <div class="code-row">
            <el-input
              v-model="forgotForm.code"
              placeholder="验证码"
              class="code-input"
            />
            <el-button
              type="primary"
              class="code-btn"
              :loading="sendingCode"
              :disabled="sendingCode || codeCountdown > 0"
              @click="sendCode"
            >
              {{ codeCountdown > 0 ? codeCountdown + 's后重发' : '发送验证码' }}
            </el-button>
          </div>
        </el-form-item>
        <el-form-item prop="newPassword">
          <el-input
            v-model="forgotForm.newPassword"
            type="password"
            show-password
            placeholder="新密码（6~20个字符）"
          />
        </el-form-item>
        <el-form-item prop="confirmNewPassword">
          <el-input
            v-model="forgotForm.confirmNewPassword"
            type="password"
            show-password
            placeholder="确认新密码"
          />
        </el-form-item>
        <el-form-item>
          <el-button
            type="primary"
            class="submit-btn"
            :loading="loading"
            @click="submitForgot"
          >
            提交
          </el-button>
        </el-form-item>
      </el-form>

      <!-- 底部提示：只在登录 Tab 下显示 -->
      <div class="footer" v-if="activeTab === 'login'">
        <span class="footer-text">还没有账号？</span>
        <el-button type="text" class="footer-link" @click="goRegister">
          立即注册
        </el-button>
      </div>
    </el-card>
  </div>
</template>

<style scoped>
.auth-container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background:
    radial-gradient(circle at 0% 0%, rgba(45, 212, 191, 0.45), transparent 55%),
    radial-gradient(circle at 100% 0%, rgba(56, 189, 248, 0.4), transparent 55%),
    radial-gradient(circle at 0% 100%, rgba(74, 222, 128, 0.35), transparent 55%),
    linear-gradient(135deg, #e0fdfa 0%, #e0f2fe 40%, #f9fafb 100%);
}

.auth-card {
  width: 360px;
  padding: 8px 16px 24px;
  border-radius: 16px;
  box-shadow: 0 18px 45px rgba(15, 23, 42, 0.18);
  border: 1px solid rgba(148, 163, 184, 0.3);
}

.title {
  text-align: center;
  margin: 12px 0 20px;
  font-size: 24px;
  background: linear-gradient(135deg, #0ea5e9, #22c55e);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.subtitle {
  text-align: center;
  margin: 0 0 24px 0;
  font-size: 14px;
  color: #909399;
}

.auth-form {
  margin-top: 18px;
}

/* 顶部 Tab 样式 */
.tabs {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 12px;
  margin-bottom: 4px;
}

.tab-item {
  font-size: 14px;
  color: #94a3b8;
  cursor: pointer;
  padding: 4px 10px;
  border-radius: 999px;
  transition: all 0.2s ease;
}

.tab-item:hover {
  color: #1f2937;
}

.tab-item.active {
  background: rgba(34, 197, 94, 0.12);
  color: #16a34a;
  font-weight: 600;
}

.tip-text {
  margin-top: 4px;
  text-align: center;
  font-size: 12px;
  color: #94a3b8;
}

/* 忘记密码验证码行 */
.code-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.code-input {
  flex: 1;
}

.code-btn {
  white-space: nowrap;
  padding: 0 14px;
  height: 34px;
  border-radius: 999px;
  background: linear-gradient(135deg, #22c55e, #0ea5e9);
  border: none;
  font-size: 13px;
}

.code-btn:hover {
  filter: brightness(1.03);
}

.submit-btn {
  width: 100%;
  background: linear-gradient(135deg, #22c55e, #0ea5e9);
  border: none;
}

.submit-btn:hover {
  filter: brightness(1.03);
}

.footer {
  margin-top: 8px;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  color: #64748b;
}

.footer-text {
  line-height: 1;
}

.footer-link {
  padding: 0;
  height: auto;
  line-height: 1;
  font-size: 13px;
  color: #0ea5e9;
}

.footer-link:hover {
  color: #0284c7;
}
</style>


