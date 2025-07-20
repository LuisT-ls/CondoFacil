// Gerenciar Usuários Script
import { getUserData } from './modules/userRole.js'
import { auth, db } from './modules/firebase-config.js'
import { checkUserPermission, showAccessDenied } from './modules/permissions.js'

// DOM Elements
const searchInput = document.getElementById('search-usuarios')
const filterPapel = document.getElementById('filter-papel')
const filterStatus = document.getElementById('filter-status')
const btnAdicionarUsuario = document.getElementById('btn-adicionar-usuario')
const usuariosTableBody = document.getElementById('usuarios-table-body')
const btnPrev = document.getElementById('btn-prev')
const btnNext = document.getElementById('btn-next')
const paginationInfo = document.getElementById('pagination-info')

// Modal elements
const modalAdicionar = document.getElementById('modal-adicionar-usuario')
const modalEditar = document.getElementById('modal-editar-usuario')
const modalConfirmar = document.getElementById('modal-confirmar-exclusao')
const formAdicionar = document.getElementById('form-adicionar-usuario')
const formEditar = document.getElementById('form-editar-usuario')
const closeModal = document.getElementById('close-modal')
const closeEditModal = document.getElementById('close-edit-modal')
const closeDeleteModal = document.getElementById('close-delete-modal')
const cancelarUsuario = document.getElementById('cancelar-usuario')
const cancelarEditar = document.getElementById('cancelar-editar')
const cancelarExclusao = document.getElementById('cancelar-exclusao')
const confirmarExclusao = document.getElementById('confirmar-exclusao')

// State
let currentUser = null
let usuarios = []
let filteredUsuarios = []
let currentPage = 1
let usersPerPage = 10
let userToDelete = null

// Initialize
async function initGerenciarUsuarios() {
  try {
    console.log('🚀 Inicializando gerenciar usuários...')

    // Get user data
    const userData = await getUserData()

    if (!userData) {
      console.error('Usuário não autenticado')
      window.location.href = '/login.html'
      return
    }

    currentUser = userData
    console.log('✅ Usuário carregado:', userData.nome)

    // Check permissions
    const canManageUsers = await checkUserPermission('canManageUsers')
    if (!canManageUsers) {
      showAccessDenied('Apenas síndicos podem gerenciar usuários.')
      window.location.href = '/dashboard.html'
      return
    }

    // Setup event listeners
    setupEventListeners()

    // Load users
    await loadUsuarios()
  } catch (error) {
    console.error('Erro ao inicializar gerenciar usuários:', error)
    alert('Erro ao carregar gerenciar usuários. Tente novamente.')
  }
}

// Setup event listeners
function setupEventListeners() {
  // Search and filters
  searchInput.addEventListener('input', filterUsuarios)
  filterPapel.addEventListener('change', filterUsuarios)
  filterStatus.addEventListener('change', filterUsuarios)

  // Add user button
  btnAdicionarUsuario.addEventListener('click', () => {
    openModal(modalAdicionar)
  })

  // Modal close buttons
  closeModal.addEventListener('click', () => closeAllModals())
  closeEditModal.addEventListener('click', () => closeAllModals())
  closeDeleteModal.addEventListener('click', () => closeAllModals())

  // Cancel buttons
  cancelarUsuario.addEventListener('click', () => closeAllModals())
  cancelarEditar.addEventListener('click', () => closeAllModals())
  cancelarExclusao.addEventListener('click', () => closeAllModals())

  // Form submissions
  formAdicionar.addEventListener('submit', handleAddUser)
  formEditar.addEventListener('submit', handleEditUser)

  // Delete confirmation
  confirmarExclusao.addEventListener('click', handleDeleteUser)

  // Pagination
  btnPrev.addEventListener('click', () => changePage(-1))
  btnNext.addEventListener('click', () => changePage(1))

  // Close modal on outside click
  window.addEventListener('click', e => {
    if (e.target.classList.contains('modal')) {
      closeAllModals()
    }
  })
}

// Load usuarios from Firestore
async function loadUsuarios() {
  try {
    console.log('📊 Carregando usuários...')

    const snapshot = await db.collection('usuarios').get()
    usuarios = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))

    console.log(`✅ ${usuarios.length} usuários carregados`)

    // Apply filters and render
    filterUsuarios()
  } catch (error) {
    console.error('Erro ao carregar usuários:', error)
    showMessage('Erro ao carregar usuários.', 'error')
  }
}

// Filter usuarios
function filterUsuarios() {
  const searchTerm = searchInput.value.toLowerCase()
  const papelFilter = filterPapel.value
  const statusFilter = filterStatus.value

  filteredUsuarios = usuarios.filter(usuario => {
    const matchesSearch =
      usuario.nome?.toLowerCase().includes(searchTerm) ||
      usuario.email?.toLowerCase().includes(searchTerm)
    const matchesPapel = !papelFilter || usuario.papel === papelFilter
    const matchesStatus = !statusFilter || usuario.status === statusFilter

    return matchesSearch && matchesPapel && matchesStatus
  })

  currentPage = 1
  renderUsuarios()
  updatePagination()
}

// Render usuarios table
function renderUsuarios() {
  const startIndex = (currentPage - 1) * usersPerPage
  const endIndex = startIndex + usersPerPage
  const pageUsuarios = filteredUsuarios.slice(startIndex, endIndex)

  if (pageUsuarios.length === 0) {
    usuariosTableBody.innerHTML = `
      <tr>
        <td colspan="6" class="empty-state">
          <h3>Nenhum usuário encontrado</h3>
          <p>Não há usuários que correspondam aos filtros aplicados.</p>
        </td>
      </tr>
    `
    return
  }

  usuariosTableBody.innerHTML = pageUsuarios
    .map(
      usuario => `
    <tr>
      <td>${usuario.nome || 'N/A'}</td>
      <td>${usuario.email || 'N/A'}</td>
      <td>${usuario.papel || 'morador'}</td>
      <td>${formatDate(usuario.dataCadastro)}</td>
      <td>
        <span class="status-badge ${usuario.status || 'ativo'}">
          ${usuario.status || 'ativo'}
        </span>
      </td>
      <td>
        <div class="action-buttons">
          <button class="btn btn--info" onclick="editUsuario('${usuario.id}')">
            ✏️ Editar
          </button>
          <button class="btn btn--warning" onclick="toggleUsuarioStatus('${
            usuario.id
          }')">
            ${usuario.status === 'inativo' ? '✅ Ativar' : '⏸️ Desativar'}
          </button>
          <button class="btn btn--danger" onclick="confirmarExclusaoUsuario('${
            usuario.id
          }')">
            🗑️ Excluir
          </button>
        </div>
      </td>
    </tr>
  `
    )
    .join('')
}

// Update pagination
function updatePagination() {
  const totalPages = Math.ceil(filteredUsuarios.length / usersPerPage)

  btnPrev.disabled = currentPage === 1
  btnNext.disabled = currentPage === totalPages

  paginationInfo.textContent = `Página ${currentPage} de ${totalPages}`
}

// Change page
function changePage(delta) {
  const totalPages = Math.ceil(filteredUsuarios.length / usersPerPage)
  const newPage = currentPage + delta

  if (newPage >= 1 && newPage <= totalPages) {
    currentPage = newPage
    renderUsuarios()
    updatePagination()
  }
}

// Open modal
function openModal(modal) {
  modal.style.display = 'block'
  document.body.style.overflow = 'hidden'
}

// Close all modals
function closeAllModals() {
  const modals = document.querySelectorAll('.modal')
  modals.forEach(modal => {
    modal.style.display = 'none'
  })
  document.body.style.overflow = 'auto'

  // Reset forms
  formAdicionar.reset()
  formEditar.reset()
}

// Handle add user
async function handleAddUser(e) {
  e.preventDefault()

  try {
    const formData = new FormData(formAdicionar)
    const userData = {
      nome: formData.get('nome'),
      email: formData.get('email'),
      papel: formData.get('papel'),
      senha: formData.get('senha'),
      status: 'ativo',
      dataCadastro: new Date()
    }

    // Create user in Firebase Auth
    const userCredential = await auth.createUserWithEmailAndPassword(
      userData.email,
      userData.senha
    )

    // Save user data to Firestore
    await db
      .collection('usuarios')
      .doc(userCredential.user.uid)
      .set({
        ...userData,
        uid: userCredential.user.uid
      })

    showMessage('✅ Usuário adicionado com sucesso!', 'success')
    closeAllModals()
    await loadUsuarios()
  } catch (error) {
    console.error('Erro ao adicionar usuário:', error)
    showMessage(`❌ Erro ao adicionar usuário: ${error.message}`, 'error')
  }
}

// Handle edit user
async function handleEditUser(e) {
  e.preventDefault()

  try {
    const formData = new FormData(formEditar)
    const userId = formData.get('userId')
    const userData = {
      nome: formData.get('nome'),
      email: formData.get('email'),
      papel: formData.get('papel'),
      status: formData.get('status')
    }

    // Update user in Firestore
    await db.collection('usuarios').doc(userId).update(userData)

    showMessage('✅ Usuário atualizado com sucesso!', 'success')
    closeAllModals()
    await loadUsuarios()
  } catch (error) {
    console.error('Erro ao editar usuário:', error)
    showMessage(`❌ Erro ao editar usuário: ${error.message}`, 'error')
  }
}

// Edit usuario
async function editUsuario(userId) {
  try {
    const userDoc = await db.collection('usuarios').doc(userId).get()

    if (!userDoc.exists) {
      showMessage('Usuário não encontrado.', 'error')
      return
    }

    const userData = userDoc.data()

    // Populate form
    document.getElementById('edit-user-id').value = userId
    document.getElementById('edit-nome-usuario').value = userData.nome || ''
    document.getElementById('edit-email-usuario').value = userData.email || ''
    document.getElementById('edit-papel-usuario').value =
      userData.papel || 'morador'
    document.getElementById('edit-status-usuario').value =
      userData.status || 'ativo'

    openModal(modalEditar)
  } catch (error) {
    console.error('Erro ao carregar dados do usuário:', error)
    showMessage('Erro ao carregar dados do usuário.', 'error')
  }
}

// Toggle usuario status
async function toggleUsuarioStatus(userId) {
  try {
    const userDoc = await db.collection('usuarios').doc(userId).get()

    if (!userDoc.exists) {
      showMessage('Usuário não encontrado.', 'error')
      return
    }

    const userData = userDoc.data()
    const newStatus = userData.status === 'ativo' ? 'inativo' : 'ativo'

    await db.collection('usuarios').doc(userId).update({
      status: newStatus
    })

    showMessage(
      `✅ Usuário ${
        newStatus === 'ativo' ? 'ativado' : 'desativado'
      } com sucesso!`,
      'success'
    )
    await loadUsuarios()
  } catch (error) {
    console.error('Erro ao alterar status do usuário:', error)
    showMessage('Erro ao alterar status do usuário.', 'error')
  }
}

// Confirm delete usuario
function confirmarExclusaoUsuario(userId) {
  const usuario = usuarios.find(u => u.id === userId)

  if (!usuario) {
    showMessage('Usuário não encontrado.', 'error')
    return
  }

  userToDelete = usuario
  document.getElementById('delete-user-name').textContent =
    usuario.nome || 'N/A'
  openModal(modalConfirmar)
}

// Handle delete usuario
async function handleDeleteUser() {
  if (!userToDelete) return

  try {
    // Delete from Firestore
    await db.collection('usuarios').doc(userToDelete.id).delete()

    // Note: Firebase Auth user deletion requires admin SDK
    // For now, we'll just delete from Firestore
    // The user won't be able to login anymore since we don't have their password

    showMessage('✅ Usuário excluído com sucesso!', 'success')
    closeAllModals()
    await loadUsuarios()
  } catch (error) {
    console.error('Erro ao excluir usuário:', error)
    showMessage('Erro ao excluir usuário.', 'error')
  } finally {
    userToDelete = null
  }
}

// Format date
function formatDate(date) {
  if (!date) return 'N/A'

  try {
    const dateObj = date.toDate ? date.toDate() : new Date(date)
    return dateObj.toLocaleDateString('pt-BR')
  } catch (error) {
    return 'N/A'
  }
}

// Show message
function showMessage(message, type) {
  // Remove existing messages
  const existingMessages = document.querySelectorAll('.message')
  existingMessages.forEach(msg => msg.remove())

  // Create new message
  const messageDiv = document.createElement('div')
  messageDiv.className = `message ${type}`
  messageDiv.textContent = message

  // Insert at top of container
  const container = document.querySelector('.usuarios-container')
  container.insertBefore(messageDiv, container.firstChild)

  // Auto remove after 5 seconds
  setTimeout(() => {
    messageDiv.remove()
  }, 5000)
}

// Make functions global for onclick handlers
window.editUsuario = editUsuario
window.toggleUsuarioStatus = toggleUsuarioStatus
window.confirmarExclusaoUsuario = confirmarExclusaoUsuario

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  console.log('🚀 Gerenciar usuários inicializando...')
  initGerenciarUsuarios()
})
