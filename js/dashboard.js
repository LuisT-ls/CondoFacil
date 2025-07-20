// Dashboard Script
import { getUserData } from './modules/userRole.js'
import { auth } from './modules/firebase-config.js'
import { signOut } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth-compat.js'

// DOM Elements
const userNameElement = document.getElementById('user-name')
const userRoleElement = document.getElementById('user-role')
const logoutButton = document.getElementById('btn-logout')
const menuOpcoes = document.getElementById('menu-opcoes')

// Initialize dashboard
async function initDashboard() {
  try {
    // Get user data
    const userData = await getUserData()

    if (userData) {
      // Update user information
      updateUserInfo(userData)

      // Setup logout functionality
      setupLogout()

      // Render menu options based on user role
      renderMenuOptions(userData.papel)
    }
  } catch (error) {
    console.error('Erro ao inicializar dashboard:', error)
    alert('Erro ao carregar dados do usuário. Tente novamente.')
  }
}

// Update user information in the UI
function updateUserInfo(userData) {
  // Update greeting
  if (userNameElement) {
    userNameElement.textContent = userData.nome
  }

  // Update role display
  if (userRoleElement) {
    const roleText = userData.papel === 'sindico' ? 'Síndico' : 'Morador'
    userRoleElement.textContent = roleText
  }
}

// Setup logout functionality
function setupLogout() {
  if (logoutButton) {
    logoutButton.addEventListener('click', async () => {
      try {
        await signOut(auth)
        // Redirect will happen automatically via userRole.js
      } catch (error) {
        console.error('Erro ao fazer logout:', error)
        alert('Erro ao fazer logout. Tente novamente.')
      }
    })
  }
}

// Render menu options based on user role
function renderMenuOptions(papel) {
  if (!menuOpcoes) return

  // Clear existing content
  menuOpcoes.innerHTML = ''

  let buttons = []

  if (papel === 'sindico') {
    // Buttons for Síndico
    buttons = [
      { text: 'Gerenciar Reservas', action: 'gerenciar-reservas', icon: '📅' },
      { text: 'Enviar Comunicados', action: 'enviar-comunicados', icon: '📢' },
      { text: 'Prestação de Contas', action: 'prestacao-contas', icon: '💰' },
      {
        text: 'Gerenciar Documentos',
        action: 'gerenciar-documentos',
        icon: '📄'
      },
      { text: 'Iniciar Votação', action: 'iniciar-votacao', icon: '🗳️' }
    ]
  } else {
    // Buttons for Morador
    buttons = [
      { text: 'Fazer Reserva', action: 'fazer-reserva', icon: '📅' },
      { text: 'Ver Comunicados', action: 'ver-comunicados', icon: '📢' },
      { text: 'Consultar Votações', action: 'consultar-votacoes', icon: '🗳️' }
    ]
  }

  // Create buttons
  buttons.forEach(buttonData => {
    const button = document.createElement('button')
    button.className = 'btn'
    button.setAttribute('data-action', buttonData.action)
    button.innerHTML = `
      <span>${buttonData.text}</span>
      <span>${buttonData.icon}</span>
    `

    // Add click event
    button.addEventListener('click', () => {
      handleMenuAction(buttonData.action)
    })

    menuOpcoes.appendChild(button)
  })
}

// Handle menu actions
function handleMenuAction(action) {
  switch (action) {
    // Síndico actions
    case 'gerenciar-reservas':
      alert('Funcionalidade em desenvolvimento: Gerenciar Reservas')
      break
    case 'enviar-comunicados':
      alert('Funcionalidade em desenvolvimento: Enviar Comunicados')
      break
    case 'prestacao-contas':
      alert('Funcionalidade em desenvolvimento: Prestação de Contas')
      break
    case 'gerenciar-documentos':
      alert('Funcionalidade em desenvolvimento: Gerenciar Documentos')
      break
    case 'iniciar-votacao':
      alert('Funcionalidade em desenvolvimento: Iniciar Votação')
      break

    // Morador actions
    case 'fazer-reserva':
      alert('Funcionalidade em desenvolvimento: Fazer Reserva')
      break
    case 'ver-comunicados':
      alert('Funcionalidade em desenvolvimento: Ver Comunicados')
      break
    case 'consultar-votacoes':
      alert('Funcionalidade em desenvolvimento: Consultar Votações')
      break

    default:
      alert('Opção não implementada ainda.')
  }
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  console.log('🚀 Dashboard inicializando...')
  initDashboard()
})
