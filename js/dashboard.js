// Dashboard do CondoFácil
import { authService } from './modules/auth.js'
import { databaseService } from './modules/database.js'
import { getUserData } from './modules/register.js'

class Dashboard {
  constructor() {
    this.currentUser = null
    this.userData = null
    this.init()
  }

  async init() {
    console.log('🏠 Dashboard inicializando...')

    // Verificar se o usuário está autenticado
    this.currentUser = authService.getCurrentUser()

    if (!this.currentUser) {
      console.log('❌ Usuário não autenticado, redirecionando...')
      window.location.href = 'login.html'
      return
    }

    console.log('✅ Usuário autenticado:', this.currentUser.email)

    // Carregar dados do usuário
    await this.loadUserData()

    // Carregar estatísticas
    await this.loadStatistics()

    // Configurar listeners
    this.setupEventListeners()

    console.log('✅ Dashboard carregado com sucesso!')
  }

  // Carregar dados do usuário
  async loadUserData() {
    try {
      this.userData = await getUserData(this.currentUser.uid)

      if (this.userData) {
        this.updateUserInfo()
      } else {
        console.warn('⚠️ Dados do usuário não encontrados no Firestore')
        this.updateUserInfoWithAuthData()
      }
    } catch (error) {
      console.error('❌ Erro ao carregar dados do usuário:', error)
      this.updateUserInfoWithAuthData()
    }
  }

  // Atualizar informações do usuário
  updateUserInfo() {
    const userName = document.getElementById('user-name')
    const userEmail = document.getElementById('user-email')
    const userRole = document.getElementById('user-role')
    const avatarText = document.querySelector('.avatar-text')

    if (userName) userName.textContent = this.userData.nome
    if (userEmail) userEmail.textContent = this.userData.email
    if (userRole) {
      userRole.textContent = this.userData.papel
      userRole.className = `user-role ${this.userData.papel}`
    }
    if (avatarText) {
      avatarText.textContent = this.userData.nome.charAt(0).toUpperCase()
    }
  }

  // Atualizar com dados do Auth (fallback)
  updateUserInfoWithAuthData() {
    const userName = document.getElementById('user-name')
    const userEmail = document.getElementById('user-email')
    const userRole = document.getElementById('user-role')
    const avatarText = document.querySelector('.avatar-text')

    if (userName)
      userName.textContent = this.currentUser.displayName || 'Usuário'
    if (userEmail) userEmail.textContent = this.currentUser.email
    if (userRole) {
      userRole.textContent = 'Morador'
      userRole.className = 'user-role morador'
    }
    if (avatarText) {
      const name = this.currentUser.displayName || this.currentUser.email
      avatarText.textContent = name.charAt(0).toUpperCase()
    }
  }

  // Carregar estatísticas
  async loadStatistics() {
    try {
      const moradoresCount = await databaseService.countDocuments('moradores')
      const comunicacoesCount = await databaseService.countDocuments(
        'comunicacoes'
      )
      const reservasCount = await databaseService.countDocuments('reservas')

      this.updateStatistics(moradoresCount, comunicacoesCount, reservasCount)
    } catch (error) {
      console.error('❌ Erro ao carregar estatísticas:', error)
      this.updateStatistics(0, 0, 0)
    }
  }

  // Atualizar estatísticas na UI
  updateStatistics(moradores, comunicacoes, reservas) {
    const totalMoradores = document.getElementById('total-moradores')
    const totalComunicacoes = document.getElementById('total-comunicacoes')
    const totalReservas = document.getElementById('total-reservas')

    if (totalMoradores) totalMoradores.textContent = moradores
    if (totalComunicacoes) totalComunicacoes.textContent = comunicacoes
    if (totalReservas) totalReservas.textContent = reservas
  }

  // Configurar event listeners
  setupEventListeners() {
    // Listener para mudanças de autenticação
    authService.onAuthStateChange(user => {
      if (!user) {
        console.log('👤 Usuário deslogado, redirecionando...')
        window.location.href = 'login.html'
      }
    })
  }

  // Função de logout (global)
  async logout() {
    try {
      await authService.logout()
      console.log('👋 Logout realizado')
      window.location.href = 'index.html'
    } catch (error) {
      console.error('❌ Erro no logout:', error)
      alert('Erro ao fazer logout. Tente novamente.')
    }
  }

  // Funções para ações rápidas (globais)
  showAddMorador() {
    alert('Funcionalidade de adicionar morador será implementada em breve!')
  }

  showAddComunicacao() {
    alert('Funcionalidade de nova comunicação será implementada em breve!')
  }

  showAddReserva() {
    alert('Funcionalidade de nova reserva será implementada em breve!')
  }

  showConfiguracoes() {
    alert('Funcionalidade de configurações será implementada em breve!')
  }
}

// Inicializar dashboard quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', () => {
  console.log('🚀 Dashboard carregando...')
  const dashboard = new Dashboard()

  // Tornar funções globais para uso nos botões
  window.logout = () => dashboard.logout()
  window.showAddMorador = () => dashboard.showAddMorador()
  window.showAddComunicacao = () => dashboard.showAddComunicacao()
  window.showAddReserva = () => dashboard.showAddReserva()
  window.showConfiguracoes = () => dashboard.showConfiguracoes()
})

// Exportar para uso em outros módulos
export { Dashboard }
