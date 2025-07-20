// Módulo de Autenticação
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth'
import { auth } from './firebase-config.js'

class AuthService {
  constructor() {
    this.currentUser = null
    this.authStateListeners = []
    this.init()
  }

  // Inicializar listener de estado de autenticação
  init() {
    onAuthStateChanged(auth, user => {
      this.currentUser = user
      this.notifyAuthStateChange(user)

      if (user) {
        console.log('✅ Usuário logado:', user.email)
        this.updateUIForLoggedInUser(user)
      } else {
        console.log('❌ Usuário deslogado')
        this.updateUIForLoggedOutUser()
      }
    })
  }

  // Login com email e senha
  async login(email, password) {
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      )
      console.log('🎉 Login realizado com sucesso!')
      return { success: true, user: userCredential.user }
    } catch (error) {
      console.error('❌ Erro no login:', error.message)
      return { success: false, error: this.getErrorMessage(error.code) }
    }
  }

  // Login com Google
  async loginWithGoogle() {
    try {
      const provider = new GoogleAuthProvider()
      const userCredential = await signInWithPopup(auth, provider)
      console.log('🎉 Login com Google realizado com sucesso!')
      return { success: true, user: userCredential.user }
    } catch (error) {
      console.error('❌ Erro no login com Google:', error.message)
      return { success: false, error: this.getErrorMessage(error.code) }
    }
  }

  // Registro de novo usuário
  async register(email, password, displayName) {
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      )

      // Atualizar perfil com nome
      if (displayName) {
        await updateProfile(userCredential.user, { displayName })
      }

      console.log('🎉 Usuário registrado com sucesso!')
      return { success: true, user: userCredential.user }
    } catch (error) {
      console.error('❌ Erro no registro:', error.message)
      return { success: false, error: this.getErrorMessage(error.code) }
    }
  }

  // Logout
  async logout() {
    try {
      await signOut(auth)
      console.log('👋 Logout realizado com sucesso!')
      return { success: true }
    } catch (error) {
      console.error('❌ Erro no logout:', error.message)
      return { success: false, error: error.message }
    }
  }

  // Recuperar senha
  async resetPassword(email) {
    try {
      await sendPasswordResetEmail(auth, email)
      console.log('📧 Email de recuperação enviado!')
      return { success: true }
    } catch (error) {
      console.error('❌ Erro ao enviar email:', error.message)
      return { success: false, error: this.getErrorMessage(error.code) }
    }
  }

  // Obter usuário atual
  getCurrentUser() {
    return this.currentUser
  }

  // Verificar se está logado
  isLoggedIn() {
    return !!this.currentUser
  }

  // Adicionar listener de mudança de estado
  onAuthStateChange(callback) {
    this.authStateListeners.push(callback)
  }

  // Notificar mudanças de estado
  notifyAuthStateChange(user) {
    this.authStateListeners.forEach(callback => callback(user))
  }

  // Atualizar UI para usuário logado
  updateUIForLoggedInUser(user) {
    const authSection = document.getElementById('auth-section')
    if (authSection) {
      authSection.innerHTML = `
                <div class="user-info">
                    <span>👤 ${user.displayName || user.email}</span>
                    <button onclick="authService.logout()" class="btn-logout">Sair</button>
                </div>
            `
    }
  }

  // Atualizar UI para usuário deslogado
  updateUIForLoggedOutUser() {
    const authSection = document.getElementById('auth-section')
    if (authSection) {
      authSection.innerHTML = `
                <button onclick="showLoginModal()" class="btn-login">Entrar</button>
                <button onclick="showRegisterModal()" class="btn-register">Cadastrar</button>
            `
    }
  }

  // Traduzir mensagens de erro
  getErrorMessage(errorCode) {
    const errorMessages = {
      'auth/user-not-found': 'Usuário não encontrado',
      'auth/wrong-password': 'Senha incorreta',
      'auth/email-already-in-use': 'Email já está em uso',
      'auth/weak-password': 'Senha muito fraca',
      'auth/invalid-email': 'Email inválido',
      'auth/too-many-requests': 'Muitas tentativas. Tente novamente mais tarde',
      'auth/network-request-failed': 'Erro de conexão. Verifique sua internet',
      'auth/popup-closed-by-user': 'Login cancelado pelo usuário',
      'auth/popup-blocked':
        'Popup bloqueado pelo navegador. Permita popups para este site',
      'auth/cancelled-popup-request': 'Login cancelado',
      'auth/account-exists-with-different-credential':
        'Conta já existe com credenciais diferentes'
    }
    return errorMessages[errorCode] || 'Erro desconhecido'
  }
}

// Criar instância global
const authService = new AuthService()

// Exportar para uso em outros módulos
export { authService }
export default authService
