// Importar configuração do Firebase
import { app, auth, db, storage } from './modules/firebase-config.js'
import { authService } from './modules/auth.js'
import { databaseService } from './modules/database.js'

// Função para inicializar a aplicação
function initializeApp() {
  console.log('🚀 CondoFácil iniciado com Firebase!')
  // Analytics removido - não está sendo usado no projeto
  console.log('🔐 Auth:', auth)
  console.log('🗄️ Firestore:', db)
  console.log('📁 Storage:', storage)

  // Aqui você pode adicionar a lógica da sua aplicação
  setupEventListeners()
  setupUI()
  loadInitialData()
}

// Configurar event listeners
function setupEventListeners() {
  // Event listener para quando o DOM estiver carregado
  document.addEventListener('DOMContentLoaded', () => {
    console.log('✅ DOM carregado - CondoFácil pronto!')

    // Adicionar funcionalidades específicas da aplicação aqui
    setupCondoFeatures()
    setupModals()
    setupRealTimeListeners()
  })
}

// Configurar funcionalidades específicas do condomínio
function setupCondoFeatures() {
  console.log('🏢 Funcionalidades do condomínio configuradas')

  // Configurar listeners de autenticação
  authService.onAuthStateChange(user => {
    if (user) {
      console.log('👤 Usuário autenticado:', user.email)
      showAuthenticatedUI()
    } else {
      console.log('👤 Usuário não autenticado')
      showUnauthenticatedUI()
    }
  })
}

// Configurar UI inicial
function setupUI() {
  // Adicionar seção de autenticação ao header
  const headerNav = document.querySelector('.header__nav ul')
  if (headerNav) {
    const authSection = document.createElement('li')
    authSection.id = 'auth-section'
    authSection.innerHTML = `
            <button onclick="showLoginModal()" class="btn-login">Entrar</button>
            <button onclick="showRegisterModal()" class="btn-register">Cadastrar</button>
        `
    headerNav.appendChild(authSection)
  }
}

// Carregar dados iniciais
async function loadInitialData() {
  try {
    // Carregar estatísticas básicas
    const moradoresCount = await databaseService.countDocuments('moradores')
    const comunicacoesCount = await databaseService.countDocuments(
      'comunicacoes'
    )
    const reservasCount = await databaseService.countDocuments('reservas')

    console.log('📊 Estatísticas carregadas:', {
      moradores: moradoresCount,
      comunicacoes: comunicacoesCount,
      reservas: reservasCount
    })

    updateDashboardStats(moradoresCount, comunicacoesCount, reservasCount)
  } catch (error) {
    console.error('❌ Erro ao carregar dados iniciais:', error)
  }
}

// Configurar modais
function setupModals() {
  // Adicionar modais ao DOM
  const modalContainer = document.createElement('div')
  modalContainer.id = 'modal-container'
  modalContainer.innerHTML = `
        <!-- Modal de Login -->
        <div id="login-modal" class="modal">
            <div class="modal-content">
                <span class="close" onclick="closeModal('login-modal')">&times;</span>
                <h2>Entrar</h2>
                <form id="login-form">
                    <input type="email" placeholder="Email" required>
                    <input type="password" placeholder="Senha" required>
                    <button type="submit">Entrar</button>
                </form>
                <p><a href="#" onclick="showForgotPasswordModal()">Esqueceu a senha?</a></p>
            </div>
        </div>
        
        <!-- Modal de Registro -->
        <div id="register-modal" class="modal">
            <div class="modal-content">
                <span class="close" onclick="closeModal('register-modal')">&times;</span>
                <h2>Cadastrar</h2>
                <form id="register-form">
                    <input type="text" placeholder="Nome completo" required>
                    <input type="email" placeholder="Email" required>
                    <input type="password" placeholder="Senha" required>
                    <input type="password" placeholder="Confirmar senha" required>
                    <button type="submit">Cadastrar</button>
                </form>
            </div>
        </div>
    `
  document.body.appendChild(modalContainer)

  // Configurar formulários
  setupFormHandlers()
}

// Configurar handlers dos formulários
function setupFormHandlers() {
  // Login form
  const loginForm = document.getElementById('login-form')
  if (loginForm) {
    loginForm.addEventListener('submit', async e => {
      e.preventDefault()
      const email = loginForm.querySelector('input[type="email"]').value
      const password = loginForm.querySelector('input[type="password"]').value

      const result = await authService.login(email, password)
      if (result.success) {
        closeModal('login-modal')
        showNotification('Login realizado com sucesso!', 'success')
      } else {
        showNotification(result.error, 'error')
      }
    })
  }

  // Register form
  const registerForm = document.getElementById('register-form')
  if (registerForm) {
    registerForm.addEventListener('submit', async e => {
      e.preventDefault()
      const name = registerForm.querySelector('input[type="text"]').value
      const email = registerForm.querySelector('input[type="email"]').value
      const password = registerForm.querySelectorAll(
        'input[type="password"]'
      )[0].value
      const confirmPassword = registerForm.querySelectorAll(
        'input[type="password"]'
      )[1].value

      if (password !== confirmPassword) {
        showNotification('As senhas não coincidem!', 'error')
        return
      }

      const result = await authService.register(email, password, name)
      if (result.success) {
        closeModal('register-modal')
        showNotification('Cadastro realizado com sucesso!', 'success')
      } else {
        showNotification(result.error, 'error')
      }
    })
  }
}

// Configurar listeners em tempo real
function setupRealTimeListeners() {
  // Listener para comunicações
  databaseService.subscribeToComunicacoes(comunicacoes => {
    console.log('📢 Novas comunicações:', comunicacoes.length)
    updateComunicacoesUI(comunicacoes)
  })

  // Listener para reservas
  databaseService.subscribeToReservas(reservas => {
    console.log('📅 Novas reservas:', reservas.length)
    updateReservasUI(reservas)
  })
}

// Funções de UI
function showAuthenticatedUI() {
  const authSection = document.getElementById('auth-section')
  if (authSection) {
    const user = authService.getCurrentUser()
    authSection.innerHTML = `
            <div class="user-info">
                <span>👤 ${user.displayName || user.email}</span>
                <button onclick="authService.logout()" class="btn-logout">Sair</button>
            </div>
        `
  }
}

function showUnauthenticatedUI() {
  const authSection = document.getElementById('auth-section')
  if (authSection) {
    authSection.innerHTML = `
            <button onclick="showLoginModal()" class="btn-login">Entrar</button>
            <button onclick="showRegisterModal()" class="btn-register">Cadastrar</button>
        `
  }
}

// Funções de modal (globais para uso no HTML)
window.showLoginModal = function () {
  document.getElementById('login-modal').style.display = 'block'
}

window.showRegisterModal = function () {
  document.getElementById('register-modal').style.display = 'block'
}

window.closeModal = function (modalId) {
  document.getElementById(modalId).style.display = 'none'
}

// Função de notificação
function showNotification(message, type = 'info') {
  const notification = document.createElement('div')
  notification.className = `notification notification-${type}`
  notification.textContent = message

  document.body.appendChild(notification)

  setTimeout(() => {
    notification.remove()
  }, 3000)
}

// Funções de atualização de UI
function updateDashboardStats(moradores, comunicacoes, reservas) {
  // Implementar atualização de estatísticas no dashboard
  console.log('📊 Dashboard atualizado:', { moradores, comunicacoes, reservas })
}

function updateComunicacoesUI(comunicacoes) {
  // Implementar atualização da UI de comunicações
  console.log('📢 UI de comunicações atualizada')
}

function updateReservasUI(reservas) {
  // Implementar atualização da UI de reservas
  console.log('📅 UI de reservas atualizada')
}

// Inicializar a aplicação quando o script for carregado
initializeApp()

// Exportar para uso em outros módulos
export { initializeApp, setupCondoFeatures, authService, databaseService }
