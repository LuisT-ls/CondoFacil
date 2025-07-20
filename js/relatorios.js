// Relatórios Script
import { getUserData } from './modules/userRole.js'
import { auth, db } from './modules/firebase-config.js'
import { checkUserPermission, showAccessDenied } from './modules/permissions.js'

// DOM Elements
const periodoSelect = document.getElementById('periodo')
const customPeriodDiv = document.getElementById('custom-period')
const customPeriodEndDiv = document.getElementById('custom-period-end')
const dataInicioInput = document.getElementById('data-inicio')
const dataFimInput = document.getElementById('data-fim')
const btnGerarRelatorio = document.getElementById('btn-gerar-relatorio')
const reportTabs = document.querySelectorAll('.report-tab')
const reportContents = document.querySelectorAll('.report-content')

// Charts
let chartReservasAreas = null
let chartAtividadeDia = null

// State
let currentUser = null
let reportData = {}

// Initialize
async function initRelatorios() {
  try {
    console.log('🚀 Inicializando relatórios...')

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
    const canViewReports = await checkUserPermission('canViewReports')
    if (!canViewReports) {
      showAccessDenied('Você não tem permissão para acessar os relatórios.')
      window.location.href = '/dashboard.html'
      return
    }

    // Setup filters
    setupFilters()

    // Setup report tabs
    setupReportTabs()

    // Setup export buttons
    setupExportButtons()

    // Load initial data
    await loadReportData()
  } catch (error) {
    console.error('Erro ao inicializar relatórios:', error)
    alert('Erro ao carregar relatórios. Tente novamente.')
  }
}

// Setup filters
function setupFilters() {
  periodoSelect.addEventListener('change', () => {
    const value = periodoSelect.value

    if (value === 'custom') {
      customPeriodDiv.style.display = 'block'
      customPeriodEndDiv.style.display = 'block'
    } else {
      customPeriodDiv.style.display = 'none'
      customPeriodEndDiv.style.display = 'none'
    }
  })

  btnGerarRelatorio.addEventListener('click', async () => {
    await loadReportData()
  })
}

// Setup report tabs
function setupReportTabs() {
  reportTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const targetReport = tab.dataset.report

      // Remove active class from all tabs and contents
      reportTabs.forEach(t => t.classList.remove('active'))
      reportContents.forEach(c => c.classList.remove('active'))

      // Add active class to clicked tab and target content
      tab.classList.add('active')
      document.getElementById(targetReport).classList.add('active')
    })
  })
}

// Setup export buttons
function setupExportButtons() {
  document.getElementById('export-reservas').addEventListener('click', () => {
    exportReport('reservas')
  })

  document.getElementById('export-usuarios').addEventListener('click', () => {
    exportReport('usuarios')
  })

  document.getElementById('export-votacoes').addEventListener('click', () => {
    exportReport('votacoes')
  })

  document
    .getElementById('export-comunicados')
    .addEventListener('click', () => {
      exportReport('comunicados')
    })
}

// Load report data
async function loadReportData() {
  try {
    btnGerarRelatorio.classList.add('loading')

    const period = getSelectedPeriod()
    console.log('📊 Carregando dados para período:', period)

    // Load all data
    const [usuarios, reservas, votacoes, comunicados] = await Promise.all([
      loadUsuarios(),
      loadReservas(period),
      loadVotacoes(period),
      loadComunicados(period)
    ])

    reportData = {
      usuarios,
      reservas,
      votacoes,
      comunicados
    }

    // Update dashboard cards
    updateDashboardCards()

    // Update charts
    updateCharts()

    // Update tables
    updateTables()

    console.log('✅ Dados carregados com sucesso')
  } catch (error) {
    console.error('Erro ao carregar dados:', error)
    alert('Erro ao carregar dados dos relatórios.')
  } finally {
    btnGerarRelatorio.classList.remove('loading')
  }
}

// Get selected period
function getSelectedPeriod() {
  const value = periodoSelect.value

  if (value === 'custom') {
    return {
      start: new Date(dataInicioInput.value),
      end: new Date(dataFimInput.value)
    }
  }

  const days = parseInt(value)
  const end = new Date()
  const start = new Date()
  start.setDate(start.getDate() - days)

  return { start, end }
}

// Load usuarios data
async function loadUsuarios() {
  try {
    const snapshot = await db.collection('usuarios').get()
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
  } catch (error) {
    console.error('Erro ao carregar usuários:', error)
    return []
  }
}

// Load reservas data
async function loadReservas(period) {
  try {
    let query = db.collection('reservas')

    if (period.start && period.end) {
      query = query
        .where('dataReserva', '>=', period.start)
        .where('dataReserva', '<=', period.end)
    }

    const snapshot = await query.get()
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
  } catch (error) {
    console.error('Erro ao carregar reservas:', error)
    return []
  }
}

// Load votacoes data
async function loadVotacoes(period) {
  try {
    let query = db.collection('votacoes')

    if (period.start && period.end) {
      query = query
        .where('dataCriacao', '>=', period.start)
        .where('dataCriacao', '<=', period.end)
    }

    const snapshot = await query.get()
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
  } catch (error) {
    console.error('Erro ao carregar votações:', error)
    return []
  }
}

// Load comunicados data
async function loadComunicados(period) {
  try {
    let query = db.collection('comunicados')

    if (period.start && period.end) {
      query = query
        .where('dataEnvio', '>=', period.start)
        .where('dataEnvio', '<=', period.end)
    }

    const snapshot = await query.get()
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
  } catch (error) {
    console.error('Erro ao carregar comunicados:', error)
    return []
  }
}

// Update dashboard cards
function updateDashboardCards() {
  document.getElementById('total-usuarios').textContent =
    reportData.usuarios.length
  document.getElementById('total-reservas').textContent =
    reportData.reservas.length
  document.getElementById('total-votacoes').textContent =
    reportData.votacoes.length
  document.getElementById('total-comunicados').textContent =
    reportData.comunicados.length
}

// Update charts
function updateCharts() {
  updateReservasAreasChart()
  updateAtividadeDiaChart()
}

// Update reservas por área chart
function updateReservasAreasChart() {
  const ctx = document.getElementById('chart-reservas-areas')

  if (chartReservasAreas) {
    chartReservasAreas.destroy()
  }

  // Group reservas by area
  const areasCount = {}
  reportData.reservas.forEach(reserva => {
    const area = reserva.area || 'Outra'
    areasCount[area] = (areasCount[area] || 0) + 1
  })

  const labels = Object.keys(areasCount)
  const data = Object.values(areasCount)

  chartReservasAreas = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: labels,
      datasets: [
        {
          data: data,
          backgroundColor: [
            '#FF6384',
            '#36A2EB',
            '#FFCE56',
            '#4BC0C0',
            '#9966FF',
            '#FF9F40'
          ]
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom'
        }
      }
    }
  })
}

// Update atividade por dia chart
function updateAtividadeDiaChart() {
  const ctx = document.getElementById('chart-atividade-dia')

  if (chartAtividadeDia) {
    chartAtividadeDia.destroy()
  }

  // Group activities by day
  const activitiesByDay = {}

  // Add reservas
  reportData.reservas.forEach(reserva => {
    const date = new Date(
      reserva.dataReserva?.toDate() || reserva.dataReserva
    ).toLocaleDateString()
    if (!activitiesByDay[date])
      activitiesByDay[date] = { reservas: 0, votacoes: 0, comunicados: 0 }
    activitiesByDay[date].reservas++
  })

  // Add votacoes
  reportData.votacoes.forEach(votacao => {
    const date = new Date(
      votacao.dataCriacao?.toDate() || votacao.dataCriacao
    ).toLocaleDateString()
    if (!activitiesByDay[date])
      activitiesByDay[date] = { reservas: 0, votacoes: 0, comunicados: 0 }
    activitiesByDay[date].votacoes++
  })

  // Add comunicados
  reportData.comunicados.forEach(comunicado => {
    const date = new Date(
      comunicado.dataEnvio?.toDate() || comunicado.dataEnvio
    ).toLocaleDateString()
    if (!activitiesByDay[date])
      activitiesByDay[date] = { reservas: 0, votacoes: 0, comunicados: 0 }
    activitiesByDay[date].comunicados++
  })

  const dates = Object.keys(activitiesByDay).sort()
  const reservasData = dates.map(date => activitiesByDay[date].reservas)
  const votacoesData = dates.map(date => activitiesByDay[date].votacoes)
  const comunicadosData = dates.map(date => activitiesByDay[date].comunicados)

  chartAtividadeDia = new Chart(ctx, {
    type: 'line',
    data: {
      labels: dates,
      datasets: [
        {
          label: 'Reservas',
          data: reservasData,
          borderColor: '#FF6384',
          backgroundColor: 'rgba(255, 99, 132, 0.1)',
          tension: 0.4
        },
        {
          label: 'Votações',
          data: votacoesData,
          borderColor: '#36A2EB',
          backgroundColor: 'rgba(54, 162, 235, 0.1)',
          tension: 0.4
        },
        {
          label: 'Comunicados',
          data: comunicadosData,
          borderColor: '#FFCE56',
          backgroundColor: 'rgba(255, 206, 86, 0.1)',
          tension: 0.4
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top'
        }
      },
      scales: {
        y: {
          beginAtZero: true
        }
      }
    }
  })
}

// Update tables
function updateTables() {
  updateReservasTable()
  updateUsuariosTable()
  updateVotacoesTable()
  updateComunicadosTable()
}

// Update reservas table
function updateReservasTable() {
  const tbody = document.getElementById('reservas-table-body')

  if (reportData.reservas.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5" class="empty-state">
          <h3>Nenhuma reserva encontrada</h3>
          <p>Não há reservas no período selecionado.</p>
        </td>
      </tr>
    `
    return
  }

  tbody.innerHTML = reportData.reservas
    .map(
      reserva => `
    <tr>
      <td>${formatDate(reserva.dataReserva)}</td>
      <td>${reserva.area || 'N/A'}</td>
      <td>${reserva.nomeMorador || 'N/A'}</td>
      <td>${reserva.horarioInicio || 'N/A'} - ${
        reserva.horarioFim || 'N/A'
      }</td>
      <td><span class="status-badge ${reserva.status || 'pendente'}">${
        reserva.status || 'pendente'
      }</span></td>
    </tr>
  `
    )
    .join('')
}

// Update usuarios table
function updateUsuariosTable() {
  const tbody = document.getElementById('usuarios-table-body')

  if (reportData.usuarios.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5" class="empty-state">
          <h3>Nenhum usuário encontrado</h3>
          <p>Não há usuários cadastrados no sistema.</p>
        </td>
      </tr>
    `
    return
  }

  tbody.innerHTML = reportData.usuarios
    .map(
      usuario => `
    <tr>
      <td>${usuario.nome || 'N/A'}</td>
      <td>${usuario.email || 'N/A'}</td>
      <td>${usuario.papel || 'morador'}</td>
      <td>${formatDate(usuario.dataCadastro)}</td>
      <td><span class="status-badge ${usuario.status || 'ativo'}">${
        usuario.status || 'ativo'
      }</span></td>
    </tr>
  `
    )
    .join('')
}

// Update votacoes table
function updateVotacoesTable() {
  const tbody = document.getElementById('votacoes-table-body')

  if (reportData.votacoes.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" class="empty-state">
          <h3>Nenhuma votação encontrada</h3>
          <p>Não há votações no período selecionado.</p>
        </td>
      </tr>
    `
    return
  }

  tbody.innerHTML = reportData.votacoes
    .map(
      votacao => `
    <tr>
      <td>${votacao.titulo || 'N/A'}</td>
      <td>${votacao.tipo || 'N/A'}</td>
      <td>${formatDate(votacao.dataCriacao)}</td>
      <td>${formatDate(votacao.dataFim)}</td>
      <td>${votacao.participantes || 0}</td>
      <td><span class="status-badge ${votacao.status || 'ativa'}">${
        votacao.status || 'ativa'
      }</span></td>
    </tr>
  `
    )
    .join('')
}

// Update comunicados table
function updateComunicadosTable() {
  const tbody = document.getElementById('comunicados-table-body')

  if (reportData.comunicados.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5" class="empty-state">
          <h3>Nenhum comunicado encontrado</h3>
          <p>Não há comunicados no período selecionado.</p>
        </td>
      </tr>
    `
    return
  }

  tbody.innerHTML = reportData.comunicados
    .map(
      comunicado => `
    <tr>
      <td>${comunicado.titulo || 'N/A'}</td>
      <td>${comunicado.autor || 'N/A'}</td>
      <td>${formatDate(comunicado.dataEnvio)}</td>
      <td>${comunicado.prioridade || 'normal'}</td>
      <td>${comunicado.lidos || 0}</td>
    </tr>
  `
    )
    .join('')
}

// Export report
function exportReport(type) {
  try {
    const data = reportData[type] || []

    if (data.length === 0) {
      alert('Não há dados para exportar.')
      return
    }

    // Convert to CSV
    const headers = getHeadersForType(type)
    const csvContent = convertToCSV(data, headers)

    // Create download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)

    link.setAttribute('href', url)
    link.setAttribute(
      'download',
      `relatorio-${type}-${new Date().toISOString().split('T')[0]}.csv`
    )
    link.style.visibility = 'hidden'

    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    console.log(`✅ Relatório ${type} exportado com sucesso`)
  } catch (error) {
    console.error('Erro ao exportar relatório:', error)
    alert('Erro ao exportar relatório.')
  }
}

// Get headers for CSV export
function getHeadersForType(type) {
  const headers = {
    reservas: [
      'Data',
      'Área',
      'Morador',
      'Horário Início',
      'Horário Fim',
      'Status'
    ],
    usuarios: ['Nome', 'Email', 'Papel', 'Data Cadastro', 'Status'],
    votacoes: [
      'Título',
      'Tipo',
      'Data Criação',
      'Data Fim',
      'Participantes',
      'Status'
    ],
    comunicados: ['Título', 'Autor', 'Data Envio', 'Prioridade', 'Lidos']
  }

  return headers[type] || []
}

// Convert data to CSV
function convertToCSV(data, headers) {
  const csvRows = []

  // Add headers
  csvRows.push(headers.join(','))

  // Add data rows
  data.forEach(item => {
    const values = headers.map(header => {
      const value = getValueForHeader(item, header)
      return `"${value}"`
    })
    csvRows.push(values.join(','))
  })

  return csvRows.join('\n')
}

// Get value for CSV header
function getValueForHeader(item, header) {
  const mappings = {
    Data: formatDate(item.dataReserva),
    Área: item.area || '',
    Morador: item.nomeMorador || '',
    'Horário Início': item.horarioInicio || '',
    'Horário Fim': item.horarioFim || '',
    Status: item.status || '',
    Nome: item.nome || '',
    Email: item.email || '',
    Papel: item.papel || '',
    'Data Cadastro': formatDate(item.dataCadastro),
    Título: item.titulo || '',
    Tipo: item.tipo || '',
    'Data Criação': formatDate(item.dataCriacao),
    'Data Fim': formatDate(item.dataFim),
    Participantes: item.participantes || 0,
    Autor: item.autor || '',
    'Data Envio': formatDate(item.dataEnvio),
    Prioridade: item.prioridade || '',
    Lidos: item.lidos || 0
  }

  return mappings[header] || ''
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

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  console.log('🚀 Relatórios inicializando...')
  initRelatorios()
})
