// Minhas Reservas Script
import { getUserData } from './modules/userRole.js'
import { auth, db } from './modules/firebase-config.js'
import { formatarData, getLocalDisplayName } from './modules/reservas.js'

// DOM Elements
const listaLembretesAtivos = document.getElementById('lista-minhas-reservas')
const filterStatus = document.getElementById('filter-status')
const filterLocal = document.getElementById('filter-local')
const totalReservas = document.getElementById('total-reservas')
const pendentes = document.getElementById('pendentes')
const aprovadas = document.getElementById('aprovadas')
const rejeitadas = document.getElementById('rejeitadas')

// State
let currentUser = null
let allReservations = []
let filteredReservations = []

// Initialize
async function initMinhasReservas() {
  try {
    console.log('🚀 Inicializando minhas reservas...')

    // Get user data
    const userData = await getUserData()

    if (!userData) {
      console.error('Usuário não autenticado')
      window.location.href = '/login.html'
      return
    }

    currentUser = userData
    console.log('✅ Usuário carregado:', userData.nome)

    // Load reservations
    await loadMinhasReservas()

    // Setup filters
    setupFilters()
  } catch (error) {
    console.error('Erro ao inicializar:', error)
    alert('Erro ao carregar dados. Tente novamente.')
  }
}

// Load user reservations
async function loadMinhasReservas() {
  try {
    listaLembretesAtivos.innerHTML = `
      <div class="loading-message">
        <span class="spinner"></span>
        Carregando suas reservas...
      </div>
    `

    // Get user reservations from Firestore
    const reservasRef = db.collection('reservas')
    const snapshot = await reservasRef
      .where('usuarioId', '==', currentUser.uid)
      .orderBy('dataCriacao', 'desc')
      .get()

    allReservations = []

    snapshot.forEach(doc => {
      const reserva = {
        id: doc.id,
        ...doc.data()
      }
      allReservations.push(reserva)
    })

    console.log(`✅ ${allReservations.length} reservas encontradas`)

    // Update statistics
    updateStatistics()

    // Apply filters
    applyFilters()
  } catch (error) {
    console.error('Erro ao carregar reservas:', error)
    listaLembretesAtivos.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">⚠️</div>
        <p>Erro ao carregar reservas. Tente novamente.</p>
      </div>
    `
  }
}

// Update statistics
function updateStatistics() {
  const stats = {
    total: allReservations.length,
    pendentes: allReservations.filter(r => r.status === 'pendente').length,
    aprovadas: allReservations.filter(r => r.status === 'aprovada').length,
    rejeitadas: allReservations.filter(r => r.status === 'rejeitada').length
  }

  totalReservas.textContent = stats.total
  pendentes.textContent = stats.pendentes
  aprovadas.textContent = stats.aprovadas
  rejeitadas.textContent = stats.rejeitadas
}

// Setup filters
function setupFilters() {
  filterStatus.addEventListener('change', applyFilters)
  filterLocal.addEventListener('change', applyFilters)
}

// Apply filters
function applyFilters() {
  const statusFilter = filterStatus.value
  const localFilter = filterLocal.value

  filteredReservations = allReservations.filter(reserva => {
    const statusMatch =
      statusFilter === 'todos' || reserva.status === statusFilter
    const localMatch = localFilter === 'todos' || reserva.local === localFilter

    return statusMatch && localMatch
  })

  renderReservations(filteredReservations)
}

// Render reservations
function renderReservations(reservations) {
  if (reservations.length === 0) {
    listaLembretesAtivos.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">📅</div>
        <p>Nenhuma reserva encontrada com os filtros selecionados.</p>
      </div>
    `
    return
  }

  listaLembretesAtivos.innerHTML = reservations
    .map(
      reserva => `
    <div class="reserva-card" data-id="${reserva.id}">
      <div class="reserva-header">
        <div class="reserva-info">
          <div class="reserva-titulo">
            ${getLocalIcon(reserva.local)} ${getLocalDisplayName(reserva.local)}
          </div>
          <span class="reserva-status status-${
            reserva.status
          }">${getStatusDisplayName(reserva.status)}</span>
        </div>
      </div>
      
      <div class="reserva-meta">
        <span>📅 ${formatarData(reserva.dataReserva)}</span>
        <span>⏰ ${reserva.horarioInicio} - ${reserva.horarioFim}</span>
        <span>👥 ${reserva.numeroPessoas} pessoas</span>
        ${
          reserva.motivoRejeicao
            ? `<span>❌ ${reserva.motivoRejeicao}</span>`
            : ''
        }
      </div>
      
      ${
        reserva.observacoes
          ? `
        <div class="reserva-descricao">
          <strong>Observações:</strong> ${reserva.observacoes}
        </div>
      `
          : ''
      }
      
      <div class="reserva-actions">
        ${
          reserva.status === 'pendente'
            ? `
          <button class="btn-cancelar" onclick="cancelarReserva('${reserva.id}')">
            ❌ Cancelar Reserva
          </button>
        `
            : ''
        }
      </div>
    </div>
  `
    )
    .join('')
}

// Get local icon
function getLocalIcon(local) {
  const icons = {
    'salao-festas': '🎉',
    churrasqueira: '🍖',
    quadra: '🏀',
    piscina: '🏊',
    academia: '💪',
    'salao-jogos': '🎮'
  }
  return icons[local] || '📍'
}

// Get status display name
function getStatusDisplayName(status) {
  const names = {
    pendente: 'Pendente',
    aprovada: 'Aprovada',
    rejeitada: 'Rejeitada'
  }
  return names[status] || status
}

// Cancel reservation
window.cancelarReserva = async function (reservaId) {
  try {
    if (!confirm('Tem certeza que deseja cancelar esta reserva?')) return

    await db.collection('reservas').doc(reservaId).update({
      status: 'cancelada',
      dataCancelamento: new Date().toISOString(),
      canceladoPor: currentUser.nome
    })

    console.log('✅ Reserva cancelada com sucesso!')
    alert('✅ Reserva cancelada com sucesso!')

    await loadMinhasReservas()
  } catch (error) {
    console.error('Erro ao cancelar reserva:', error)
    alert('❌ Erro ao cancelar reserva. Tente novamente.')
  }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  console.log('🚀 Minhas Reservas inicializando...')
  initMinhasReservas()
})
