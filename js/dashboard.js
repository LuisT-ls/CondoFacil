// Dashboard Script
import { getUserData } from './modules/userRole.js'
import { auth } from './modules/firebase-config.js'
import {
  checkUserPermission,
  protectUI,
  getCurrentUserRole
} from './modules/permissions.js'

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

      // Render menu options based on user role and permissions
      await renderMenuOptions(userData.papel)

      // Protect UI elements based on permissions
      await protectUI()
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
        await auth.signOut()
        // Redirect will happen automatically via userRole.js
      } catch (error) {
        console.error('Erro ao fazer logout:', error)
        alert('Erro ao fazer logout. Tente novamente.')
      }
    })
  }
}

// Render menu options based on user role and permissions
async function renderMenuOptions(papel) {
  if (!menuOpcoes) return

  // Clear existing content
  menuOpcoes.innerHTML = ''

  let buttons = []

  if (papel === 'sindico') {
    // Buttons for Síndico with permission checks
    const sindicoButtons = [
      {
        text: 'Gerenciar Reservas',
        action: 'gerenciar-reservas',
        icon: '📅',
        permission: 'canManageReservations'
      },
      {
        text: 'Enviar Comunicados',
        action: 'enviar-comunicados',
        icon: '📢',
        permission: 'canSendCommunications'
      },
      {
        text: 'Prestação de Contas',
        action: 'prestacao-contas',
        icon: '💰',
        permission: 'canViewReports'
      },
      {
        text: 'Gerenciar Documentos',
        action: 'gerenciar-documentos',
        icon: '📄',
        permission: 'canManageSettings'
      },
      {
        text: 'Iniciar Votação',
        action: 'iniciar-votacao',
        icon: '🗳️',
        permission: 'canCreateVotings'
      },
      {
        text: 'Gerenciar Usuários',
        action: 'gerenciar-usuarios',
        icon: '👥',
        permission: 'canManageUsers'
      },
      {
        text: 'Relatórios',
        action: 'relatorios',
        icon: '📊',
        permission: 'canViewReports'
      },
      {
        text: 'Configurações',
        action: 'configuracoes',
        icon: '⚙️',
        permission: 'canManageSettings'
      }
    ]

    // Filter buttons based on permissions
    for (const button of sindicoButtons) {
      const hasPermission = await checkUserPermission(button.permission)
      if (hasPermission) {
        buttons.push(button)
      }
    }
  } else {
    // Buttons for Morador (limited permissions)
    buttons = [
      { text: 'Fazer Reserva', action: 'fazer-reserva', icon: '📅' },
      { text: 'Ver Comunicados', action: 'ver-comunicados', icon: '📢' },
      { text: 'Consultar Votações', action: 'consultar-votacoes', icon: '🗳️' },
      { text: 'Minhas Reservas', action: 'minhas-reservas', icon: '📋' },
      { text: 'Ver Lembretes', action: 'ver-lembretes', icon: '⏰' }
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
      window.location.href = '/gerenciar-reservas.html'
      break
    case 'enviar-comunicados':
      window.location.href = '/comunicados.html'
      break
    case 'prestacao-contas':
      window.location.href = '/prestacao-contas.html'
      break
    case 'gerenciar-documentos':
      alert('Funcionalidade em desenvolvimento: Gerenciar Documentos')
      break
    case 'gerenciar-usuarios':
      window.location.href = '/gerenciar-usuarios.html'
      break
    case 'relatorios':
      window.location.href = '/relatorios.html'
      break
    case 'configuracoes':
      window.location.href = '/configuracoes.html'
      break
    case 'iniciar-votacao':
      window.location.href = '/votacoes.html'
      break

    // Morador actions
    case 'fazer-reserva':
      window.location.href = '/reservas.html'
      break
    case 'ver-comunicados':
      window.location.href = '/comunicados.html'
      break
    case 'consultar-votacoes':
      window.location.href = '/votacoes.html'
      break
    case 'minhas-reservas':
      window.location.href = '/minhas-reservas.html'
      break
    case 'ver-lembretes':
      window.location.href = '/lembretes.html'
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
