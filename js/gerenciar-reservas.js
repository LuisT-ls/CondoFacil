// Gerenciar Reservas Script
import { getUserData } from './modules/userRole.js'
import { auth, db } from './modules/firebase-config.js'
import {
  checkUserPermission,
  requirePermission,
  showAccessDenied
} from './modules/permissions.js'
import { formatarData, getLocalDisplayName } from './modules/reservas.js'

// DOM Elements
const listaReservas = document.getElementById('lista-reservas-admin')
const filterStatus = document.getElementById('filter-status')
const filterLocal = document.getElementById('filter-local')
const totalReservas = document.getElementById('total-reservas')
const pendentes = document.getElementById('pendentes')
const aprovadas = document.getElementById('aprovadas')
const rejeitadas = document.getElementById('rejeitadas')

// State
let allReservas = []
let currentUser = null

// Initialize
async function initGerenciarReservas() {
  try {
    console.log('🚀 Inicializando gerenciamento de reservas...')

    // Get user data
    const userData = await getUserData()

    if (!userData) {
      console.error('Usuário não autenticado')
      window.location.href = '/login.html'
      return
    }

    // Check if user has permission to manage reservations
    const canManage = await checkUserPermission('canManageReservations')
    if (!canManage) {
      showAccessDenied('Apenas síndicos podem gerenciar reservas.')
      window.location.href = '/dashboard.html'
      return
    }

    currentUser = userData
    console.log('✅ Usuário autorizado:', userData.nome)

    // Load reservations
    await loadReservations()

    // Setup filters
    setupFilters()
  } catch (error) {
    console.error('Erro ao inicializar:', error)
    alert('Erro ao carregar dados. Tente novamente.')
  }
}

// Load all reservations
async function loadReservations() {
  try {
    listaReservas.innerHTML = `
      <div class="loading-message">
        <span class="spinner"></span>
        Carregando reservas...
      </div>
    `

    // Get all reservations from Firestore
    const reservasRef = db.collection('reservas')
    const snapshot = await reservasRef.orderBy('dataCriacao', 'desc').get()

    allReservas = []

    snapshot.forEach(doc => {
      const reserva = {
        id: doc.id,
        ...doc.data()
      }
      allReservas.push(reserva)
    })

    console.log(`✅ ${allReservas.length} reservas carregadas`)

    // Render and update stats
    renderReservations(allReservas)
    updateStatistics(allReservas)
  } catch (error) {
    console.error('Erro ao carregar reservas:', error)
    listaReservas.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">⚠️</div>
        <p>Erro ao carregar reservas. Tente novamente.</p>
      </div>
    `
  }
}

// Render reservations
function renderReservations(reservas) {
  if (reservas.length === 0) {
    listaReservas.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">📅</div>
        <p>Nenhuma reserva encontrada.</p>
      </div>
    `
    return
  }

  listaReservas.innerHTML = reservas
    .map(
      reserva => `
    <div class="reserva-card" data-id="${reserva.id}">
      <div class="reserva-header">
        <div class="reserva-info">
          <div class="reserva-morador">${reserva.nomeMorador || 'Morador'}</div>
          <div class="reserva-data">${formatarData(reserva.dataCompleta)}</div>
        </div>
        <span class="reserva-status status-${reserva.status}">${
        reserva.status
      }</span>
      </div>
      
      <div class="reserva-details">
        <div class="detail-item">
          <span class="detail-label">Local</span>
          <span class="detail-value">${getLocalDisplayName(
            reserva.local
          )}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Horário</span>
          <span class="detail-value">${reserva.hora}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Data de Criação</span>
          <span class="detail-value">${formatarData(reserva.dataCriacao)}</span>
        </div>
      </div>
      
      <div class="reserva-actions">
        ${
          reserva.status === 'pendente'
            ? `
          <button class="btn-approve" onclick="approveReservation('${reserva.id}')">
            ✅ Aprovar
          </button>
          <button class="btn-reject" onclick="rejectReservation('${reserva.id}')">
            ❌ Rejeitar
          </button>
        `
            : `
          <button class="btn-view" onclick="viewReservation('${reserva.id}')">
            👁️ Ver Detalhes
          </button>
        `
        }
      </div>
    </div>
  `
    )
    .join('')
}

// Update statistics
function updateStatistics(reservas) {
  const total = reservas.length
  const pendentesCount = reservas.filter(r => r.status === 'pendente').length
  const aprovadasCount = reservas.filter(r => r.status === 'aprovada').length
  const rejeitadasCount = reservas.filter(r => r.status === 'rejeitada').length

  totalReservas.textContent = total
  pendentes.textContent = pendentesCount
  aprovadas.textContent = aprovadasCount
  rejeitadas.textContent = rejeitadasCount
}

// Setup filters
function setupFilters() {
  filterStatus.addEventListener('change', filterReservations)
  filterLocal.addEventListener('change', filterReservations)
}

// Filter reservations
function filterReservations() {
  const statusFilter = filterStatus.value
  const localFilter = filterLocal.value

  let filtered = allReservas

  if (statusFilter !== 'todos') {
    filtered = filtered.filter(r => r.status === statusFilter)
  }

  if (localFilter !== 'todos') {
    filtered = filtered.filter(r => r.local === localFilter)
  }

  renderReservations(filtered)
}

// Approve reservation
window.approveReservation = async function (reservaId) {
  // Check permission
  const canApprove = await requirePermission(
    'canApproveReservations',
    () => true,
    'Você não tem permissão para aprovar reservas.'
  )

  if (!canApprove) return

  try {
    if (!confirm('Confirmar aprovação desta reserva?')) return

    await db.collection('reservas').doc(reservaId).update({
      status: 'aprovada',
      dataAtualizacao: new Date().toISOString(),
      aprovadoPor: currentUser.nome
    })

    alert('✅ Reserva aprovada com sucesso!')
    await loadReservations()
  } catch (error) {
    console.error('Erro ao aprovar reserva:', error)
    alert('❌ Erro ao aprovar reserva. Tente novamente.')
  }
}

// Reject reservation
window.rejectReservation = async function (reservaId) {
  // Check permission
  const canReject = await requirePermission(
    'canRejectReservations',
    () => true,
    'Você não tem permissão para rejeitar reservas.'
  )

  if (!canReject) return

  try {
    const motivo = prompt('Motivo da rejeição:')
    if (!motivo) return

    await db.collection('reservas').doc(reservaId).update({
      status: 'rejeitada',
      dataAtualizacao: new Date().toISOString(),
      rejeitadoPor: currentUser.nome,
      motivoRejeicao: motivo
    })

    alert('✅ Reserva rejeitada com sucesso!')
    await loadReservations()
  } catch (error) {
    console.error('Erro ao rejeitar reserva:', error)
    alert('❌ Erro ao rejeitar reserva. Tente novamente.')
  }
}

// View reservation details
window.viewReservation = function (reservaId) {
  const reserva = allReservas.find(r => r.id === reservaId)
  if (!reserva) return

  const details = `
    📅 Detalhes da Reserva
    
    Morador: ${reserva.nomeMorador || 'N/A'}
    Local: ${getLocalDisplayName(reserva.local)}
    Data: ${formatarData(reserva.dataCompleta)}
    Horário: ${reserva.hora}
    Status: ${reserva.status}
    Data de Criação: ${formatarData(reserva.dataCriacao)}
    ${reserva.aprovadoPor ? `Aprovado por: ${reserva.aprovadoPor}` : ''}
    ${reserva.rejeitadoPor ? `Rejeitado por: ${reserva.rejeitadoPor}` : ''}
    ${reserva.motivoRejeicao ? `Motivo: ${reserva.motivoRejeicao}` : ''}
  `

  alert(details)
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  console.log('🚀 Gerenciar Reservas inicializando...')
  initGerenciarReservas()
})
