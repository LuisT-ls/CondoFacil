// Sistema de Permissões
import { auth, db } from './firebase-config.js'

// Definição de permissões por papel
const PERMISSIONS = {
  sindico: {
    // Gestão de Reservas
    canManageReservations: true,
    canApproveReservations: true,
    canRejectReservations: true,
    canViewAllReservations: true,

    // Votações
    canCreateVotings: true,
    canManageVotings: true,
    canViewVotingResults: true,

    // Comunicações
    canSendCommunications: true,
    canManageCommunications: true,
    canDeleteCommunications: true,

    // Lembretes
    canCreateReminders: true,
    canManageReminders: true,
    canDeleteReminders: true,

    // Usuários
    canManageUsers: true,
    canViewUserList: true,

    // Relatórios
    canViewReports: true,
    canGenerateReports: true,

    // Configurações
    canManageSettings: true,
    canViewSystemSettings: true,

    // Prestação de Contas
    canManageAccounts: true,
    canViewFinancialReports: true
  },

  morador: {
    // Gestão de Reservas
    canManageReservations: false,
    canApproveReservations: false,
    canRejectReservations: false,
    canViewAllReservations: false,

    // Votações
    canCreateVotings: false,
    canManageVotings: false,
    canViewVotingResults: true,

    // Comunicações
    canSendCommunications: false,
    canManageCommunications: false,
    canDeleteCommunications: false,

    // Lembretes
    canCreateReminders: false,
    canManageReminders: false,
    canDeleteReminders: false,

    // Usuários
    canManageUsers: false,
    canViewUserList: false,

    // Relatórios
    canViewReports: false,
    canGenerateReports: false,

    // Configurações
    canManageSettings: false,
    canViewSystemSettings: false
  }
}

// Função para verificar permissão
export function hasPermission(permission, userRole = null) {
  try {
    // Se não há papel definido, verificar se é síndico
    if (!userRole) {
      const currentUser = auth.currentUser
      if (!currentUser) return false

      // Tentar obter papel do usuário atual
      return checkUserPermission(permission)
    }

    // Verificar permissão baseada no papel
    return PERMISSIONS[userRole]?.[permission] || false
  } catch (error) {
    console.error('Erro ao verificar permissão:', error)
    return false
  }
}

// Verificar permissão do usuário atual
export async function checkUserPermission(permission) {
  try {
    const currentUser = auth.currentUser
    if (!currentUser) return false

    // Buscar dados do usuário no Firestore
    const userDoc = await db.collection('usuarios').doc(currentUser.uid).get()

    if (!userDoc.exists) return false

    const userData = userDoc.data()
    const userRole = userData.papel || 'morador'

    return hasPermission(permission, userRole)
  } catch (error) {
    console.error('Erro ao verificar permissão do usuário:', error)
    return false
  }
}

// Verificar múltiplas permissões
export function hasAnyPermission(permissions, userRole = null) {
  return permissions.some(permission => hasPermission(permission, userRole))
}

export function hasAllPermissions(permissions, userRole = null) {
  return permissions.every(permission => hasPermission(permission, userRole))
}

// Função para proteger elementos da UI
export function protectUI() {
  // Proteger botões e links baseado em permissões
  const protectedElements = document.querySelectorAll(
    '[data-requires-permission]'
  )

  protectedElements.forEach(async element => {
    const permission = element.dataset.requiresPermission
    const hasAccess = await checkUserPermission(permission)

    if (!hasAccess) {
      element.style.display = 'none'
      element.disabled = true
      element.remove()
    }
  })
}

// Função para mostrar/esconder seções baseado em permissões
export function protectSections() {
  const protectedSections = document.querySelectorAll(
    '[data-requires-permission]'
  )

  protectedSections.forEach(async section => {
    const permission = section.dataset.requiresPermission
    const hasAccess = await checkUserPermission(permission)

    if (!hasAccess) {
      section.style.display = 'none'
    }
  })
}

// Função para verificar se usuário é síndico
export async function isSindico() {
  return await checkUserPermission('canCreateVotings')
}

// Função para verificar se usuário é morador
export async function isMorador() {
  return !(await isSindico())
}

// Função para obter papel do usuário atual
export async function getCurrentUserRole() {
  try {
    const currentUser = auth.currentUser
    if (!currentUser) return null

    const userDoc = await db.collection('usuarios').doc(currentUser.uid).get()

    if (!userDoc.exists) return null

    const userData = userDoc.data()
    return userData.papel || 'morador'
  } catch (error) {
    console.error('Erro ao obter papel do usuário:', error)
    return null
  }
}

// Função para mostrar erro de acesso negado
export function showAccessDenied(
  message = 'Você não tem permissão para acessar esta funcionalidade.'
) {
  alert(`🚫 Acesso Negado\n\n${message}`)
}

// Função para verificar permissão antes de executar ação
export async function requirePermission(
  permission,
  action,
  errorMessage = null
) {
  const hasAccess = await checkUserPermission(permission)

  if (!hasAccess) {
    showAccessDenied(errorMessage)
    return false
  }

  return action()
}

// Exportar permissões para uso em outros módulos
export { PERMISSIONS }
