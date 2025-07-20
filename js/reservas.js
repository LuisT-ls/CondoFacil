// Reservas Page Script
import { getUserData } from './modules/userRole.js'
import {
  criarReserva,
  listarReservas,
  verificarConflito,
  formatarData,
  getLocalDisplayName
} from './modules/reservas.js'

// DOM Elements
const reservaForm = document.getElementById('reserva-form')
const dataInput = document.getElementById('data')
const horaInput = document.getElementById('hora')
const localSelect = document.getElementById('local')
const btnReservar = document.getElementById('btnReservar')
const listaReservas = document.getElementById('lista-reservas')
const btnVoltar = document.querySelector('a[href="dashboard.html"]')

// Global variables
let userData = null
let currentReservas = []

// Initialize page
async function initReservasPage() {
  try {
    console.log('🚀 Página de reservas inicializando...')

    // Get user data
    userData = await getUserData()

    if (userData) {
      console.log('✅ Usuário carregado:', userData.nome)

      // Set minimum date to today
      setMinDate()

      // Load user's reservations
      await loadUserReservations()

      // Setup form event listener
      setupFormListener()

      // Setup back button
      setupBackButton()
    }
  } catch (error) {
    console.error('❌ Erro ao inicializar página de reservas:', error)
    alert('Erro ao carregar dados. Tente novamente.')
  }
}

// Set minimum date to today
function setMinDate() {
  const today = new Date().toISOString().split('T')[0]
  if (dataInput) {
    dataInput.min = today
  }
}

// Load user's reservations
async function loadUserReservations() {
  try {
    if (!userData.condominioId) {
      console.warn('⚠️ Usuário não possui condomínio associado')
      showNoCondominiumMessage()
      return
    }

    console.log('📋 Carregando reservas do usuário...')
    currentReservas = await listarReservas(userData.condominioId)

    // Filter reservations for current user
    const userReservas = currentReservas.filter(
      reserva => reserva.usuarioId === userData.uid
    )

    renderReservationsList(userReservas)
  } catch (error) {
    console.error('❌ Erro ao carregar reservas:', error)
    showErrorMessage('Erro ao carregar reservas. Tente novamente.')
  }
}

// Setup form event listener
function setupFormListener() {
  if (reservaForm) {
    reservaForm.addEventListener('submit', handleReservationSubmit)
  }
}

// Setup back button
function setupBackButton() {
  if (btnVoltar) {
    btnVoltar.addEventListener('click', e => {
      e.preventDefault()
      window.location.href = '/dashboard.html'
    })
  }
}

// Handle reservation form submission
async function handleReservationSubmit(e) {
  e.preventDefault()

  try {
    // Get form data
    const data = dataInput.value
    const hora = horaInput.value
    const local = localSelect.value

    // Validate form
    if (!data || !hora || !local) {
      alert('Por favor, preencha todos os campos obrigatórios.')
      return
    }

    // Check if user has condominium
    if (!userData.condominioId) {
      alert(
        'Você não possui um condomínio associado. Entre em contato com o síndico.'
      )
      return
    }

    // Create complete date string
    const dataCompleta = `${data}T${hora}`

    // Show loading state
    setLoadingState(true)

    // Check for conflicts
    const temConflito = await verificarConflito(
      dataCompleta,
      local,
      userData.condominioId
    )

    if (temConflito) {
      alert(
        'Já existe uma reserva para este local e horário. Escolha outra data ou horário.'
      )
      setLoadingState(false)
      return
    }

    // Create reservation
    const reservaId = await criarReserva(
      dataCompleta,
      local,
      userData.uid,
      userData.condominioId
    )

    console.log('✅ Reserva criada com sucesso:', reservaId)

    // Reset form
    reservaForm.reset()

    // Reload reservations list
    await loadUserReservations()

    // Show success message
    alert('Reserva criada com sucesso!')
  } catch (error) {
    console.error('❌ Erro ao criar reserva:', error)
    alert('Erro ao criar reserva. Tente novamente.')
  } finally {
    setLoadingState(false)
  }
}

// Set loading state for submit button
function setLoadingState(loading) {
  if (btnReservar) {
    const btnText = btnReservar.querySelector('.btn-text')
    const btnLoading = btnReservar.querySelector('.btn-loading')

    if (loading) {
      btnText.style.display = 'none'
      btnLoading.style.display = 'flex'
      btnReservar.disabled = true
    } else {
      btnText.style.display = 'inline'
      btnLoading.style.display = 'none'
      btnReservar.disabled = false
    }
  }
}

// Render reservations list
function renderReservationsList(reservas) {
  if (!listaReservas) return

  // Clear existing content
  listaReservas.innerHTML = ''

  if (reservas.length === 0) {
    listaReservas.innerHTML = `
      <div class="empty-message">
        <p>Nenhuma reserva encontrada.</p>
        <p>Faça sua primeira reserva usando o formulário acima.</p>
      </div>
    `
    return
  }

  // Create reservations list
  reservas.forEach(reserva => {
    const reservaElement = createReservationElement(reserva)
    listaReservas.appendChild(reservaElement)
  })
}

// Create reservation element
function createReservationElement(reserva) {
  const reservaDiv = document.createElement('div')
  reservaDiv.className = 'reserva-item'

  const statusClass = getStatusClass(reserva.status)
  const statusText = getStatusText(reserva.status)
  const localDisplay = getLocalDisplayName(reserva.local)
  const dataFormatada = formatarData(reserva.dataCompleta)

  reservaDiv.innerHTML = `
    <div class="reserva-header">
      <h3 class="reserva-local">${localDisplay}</h3>
      <span class="reserva-status ${statusClass}">${statusText}</span>
    </div>
    <div class="reserva-details">
      <p class="reserva-data">
        <strong>Data:</strong> ${dataFormatada}
      </p>
      <p class="reserva-user">
        <strong>Reservado por:</strong> ${userData.nome}
      </p>
    </div>
  `

  return reservaDiv
}

// Get status CSS class
function getStatusClass(status) {
  const statusClasses = {
    pendente: 'status-pendente',
    aprovada: 'status-aprovada',
    rejeitada: 'status-rejeitada',
    cancelada: 'status-cancelada'
  }

  return statusClasses[status] || 'status-pendente'
}

// Get status display text
function getStatusText(status) {
  const statusTexts = {
    pendente: 'Pendente',
    aprovada: 'Aprovada',
    rejeitada: 'Rejeitada',
    cancelada: 'Cancelada'
  }

  return statusTexts[status] || 'Pendente'
}

// Show no condominium message
function showNoCondominiumMessage() {
  if (listaReservas) {
    listaReservas.innerHTML = `
      <div class="no-condominium-message">
        <p>Você não possui um condomínio associado.</p>
        <p>Entre em contato com o síndico para ser vinculado a um condomínio.</p>
      </div>
    `
  }
}

// Show error message
function showErrorMessage(message) {
  if (listaReservas) {
    listaReservas.innerHTML = `
      <div class="error-message">
        <p>${message}</p>
      </div>
    `
  }
}

// Initialize page when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  console.log('🚀 Reservas carregando...')
  initReservasPage()
})
