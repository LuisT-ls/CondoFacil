// Index Script - Gerenciar navegação baseada em autenticação
import { auth } from './modules/firebase-config.js'

// DOM Elements
const headerNav = document.querySelector('.header__nav ul')
const btnRegister = document.querySelector('.btn-register')

// Initialize
async function initIndex() {
  try {
    console.log('🚀 Index inicializando...')

    // Check authentication status
    await checkAuthStatus()

    // Setup auth listener
    setupAuthListener()
  } catch (error) {
    console.error('Erro ao inicializar index:', error)
  }
}

// Check authentication status
async function checkAuthStatus() {
  try {
    const currentUser = auth.currentUser

    if (currentUser) {
      // User is logged in
      console.log('✅ Usuário logado:', currentUser.email)
      updateNavigationForLoggedUser()
    } else {
      // User is not logged in
      console.log('ℹ️ Usuário não logado')
      updateNavigationForGuest()
    }
  } catch (error) {
    console.error('Erro ao verificar status de autenticação:', error)
    // Default to guest navigation
    updateNavigationForGuest()
  }
}

// Setup authentication listener
function setupAuthListener() {
  auth.onAuthStateChanged(user => {
    if (user) {
      // User signed in
      console.log('✅ Usuário logado:', user.email)
      updateNavigationForLoggedUser()
    } else {
      // User signed out
      console.log('ℹ️ Usuário deslogado')
      updateNavigationForGuest()
    }
  })
}

// Update navigation for logged user
function updateNavigationForLoggedUser() {
  if (!headerNav) return

  // Remove login and register buttons if exist
  const loginItem = headerNav.querySelector('li:has(.btn-login)')
  if (loginItem) {
    loginItem.remove()
  }

  const registerItem = headerNav.querySelector('li:has(.btn-register)')
  if (registerItem) {
    registerItem.remove()
  }

  // Add dashboard link
  const dashboardItem = headerNav.querySelector('li:has(.btn-dashboard)')
  if (!dashboardItem) {
    const li = document.createElement('li')
    li.innerHTML = '<a href="dashboard.html" class="btn-dashboard">Painel</a>'
    headerNav.appendChild(li)
  }

  // Add logout link
  const logoutItem = headerNav.querySelector('li:has(.btn-logout)')
  if (!logoutItem) {
    const li = document.createElement('li')
    li.innerHTML = '<a href="#" class="btn-logout">Sair</a>'
    headerNav.appendChild(li)

    // Add logout functionality
    const logoutBtn = li.querySelector('.btn-logout')
    logoutBtn.addEventListener('click', async e => {
      e.preventDefault()
      try {
        await auth.signOut()
        console.log('✅ Logout realizado com sucesso')
      } catch (error) {
        console.error('Erro ao fazer logout:', error)
      }
    })
  }
}

// Update navigation for guest user
function updateNavigationForGuest() {
  if (!headerNav) return

  // Remove dashboard and logout links if exist
  const dashboardItem = headerNav.querySelector('li:has(.btn-dashboard)')
  if (dashboardItem) {
    dashboardItem.remove()
  }

  const logoutItem = headerNav.querySelector('li:has(.btn-logout)')
  if (logoutItem) {
    logoutItem.remove()
  }

  // Add login button if not exists
  const loginItem = headerNav.querySelector('li:has(.btn-login)')
  if (!loginItem) {
    const li = document.createElement('li')
    li.innerHTML = '<a href="login.html" class="btn-login">Entrar</a>'
    headerNav.appendChild(li)
  }

  // Add register button if not exists
  const registerItem = headerNav.querySelector('li:has(.btn-register)')
  if (!registerItem) {
    const li = document.createElement('li')
    li.innerHTML = '<a href="cadastro.html" class="btn-register">Cadastrar</a>'
    headerNav.appendChild(li)
  }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  console.log('🚀 Index inicializando...')
  initIndex()
})
