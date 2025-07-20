// Prestação de Contas Script
import { getUserData } from './modules/userRole.js'
import { auth, db } from './modules/firebase-config.js'
import { checkUserPermission, showAccessDenied } from './modules/permissions.js'

// DOM Elements
const periodoSelect = document.getElementById('periodo-contas')
const customPeriodDiv = document.getElementById('custom-period')
const customPeriodEndDiv = document.getElementById('custom-period-end')
const dataInicioInput = document.getElementById('data-inicio-contas')
const dataFimInput = document.getElementById('data-fim-contas')
const btnGerarPrestacao = document.getElementById('btn-gerar-prestacao')
const btnNovaConta = document.getElementById('btn-nova-conta')
const accountTabs = document.querySelectorAll('.account-tab')
const accountContents = document.querySelectorAll('.account-content')

// Modal elements
const modalNovaConta = document.getElementById('modal-nova-conta')
const modalEditarConta = document.getElementById('modal-editar-conta')
const formNovaConta = document.getElementById('form-nova-conta')
const formEditarConta = document.getElementById('form-editar-conta')
const closeModal = document.getElementById('close-modal')
const closeEditModal = document.getElementById('close-edit-modal')
const cancelarConta = document.getElementById('cancelar-conta')
const cancelarEditarConta = document.getElementById('cancelar-editar-conta')

// Charts
let chartReceitasDespesas = null
let chartDespesasCategoria = null

// State
let currentUser = null
let contas = []
let receitas = []
let despesas = []
let categorias = {
  receitas: ['Taxa de Condomínio', 'Multas', 'Aluguel de Áreas', 'Outros'],
  despesas: [
    'Água',
    'Energia Elétrica',
    'Limpeza',
    'Segurança',
    'Manutenção',
    'Administração',
    'Outros'
  ]
}

// Initialize
async function initPrestacaoContas() {
  try {
    console.log('🚀 Inicializando prestação de contas...')

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
    const canManageAccounts = await checkUserPermission('canManageAccounts')
    if (!canManageAccounts) {
      showAccessDenied('Apenas síndicos podem acessar a prestação de contas.')
      window.location.href = '/dashboard.html'
      return
    }

    // Setup event listeners
    setupEventListeners()

    // Load initial data
    await loadContas()
  } catch (error) {
    console.error('Erro ao inicializar prestação de contas:', error)
    alert('Erro ao carregar prestação de contas. Tente novamente.')
  }
}

// Setup event listeners
function setupEventListeners() {
  // Period filter
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

  // Generate report button
  btnGerarPrestacao.addEventListener('click', async () => {
    await loadContas()
  })

  // Add account button
  btnNovaConta.addEventListener('click', () => {
    openModal(modalNovaConta)
    setupCategoriaOptions()
  })

  // Account tabs
  accountTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const targetAccount = tab.dataset.account

      // Remove active class from all tabs and contents
      accountTabs.forEach(t => t.classList.remove('active'))
      accountContents.forEach(c => c.classList.remove('active'))

      // Add active class to clicked tab and target content
      tab.classList.add('active')
      document.getElementById(targetAccount).classList.add('active')
    })
  })

  // Modal close buttons
  closeModal.addEventListener('click', () => closeAllModals())
  closeEditModal.addEventListener('click', () => closeAllModals())
  cancelarConta.addEventListener('click', () => closeAllModals())
  cancelarEditarConta.addEventListener('click', () => closeAllModals())

  // Form submissions
  formNovaConta.addEventListener('submit', handleAddConta)
  formEditarConta.addEventListener('submit', handleEditConta)

  // Tipo change handler
  document
    .getElementById('tipo-conta')
    .addEventListener('change', handleTipoChange)
  document
    .getElementById('edit-tipo-conta')
    .addEventListener('change', handleEditTipoChange)

  // Export buttons
  document
    .getElementById('export-receitas')
    .addEventListener('click', () => exportData('receitas'))
  document
    .getElementById('export-despesas')
    .addEventListener('click', () => exportData('despesas'))
  document
    .getElementById('export-resumo')
    .addEventListener('click', () => exportData('resumo'))
  document
    .getElementById('export-relatorios')
    .addEventListener('click', () => exportData('relatorios'))

  // Close modal on outside click
  window.addEventListener('click', e => {
    if (e.target.classList.contains('modal')) {
      closeAllModals()
    }
  })
}

// Load contas from Firestore
async function loadContas() {
  try {
    console.log('📊 Carregando contas...')

    const period = getSelectedPeriod()
    let query = db.collection('contas')

    if (period.start && period.end) {
      query = query
        .where('data', '>=', period.start)
        .where('data', '<=', period.end)
    }

    const snapshot = await query.get()
    contas = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))

    // Separate receitas and despesas
    receitas = contas.filter(conta => conta.tipo === 'receita')
    despesas = contas.filter(conta => conta.tipo === 'despesa')

    console.log(`✅ ${contas.length} contas carregadas`)

    // Update UI
    updateFinancialSummary()
    updateCharts()
    updateTables()
    updateSummaryContent()
  } catch (error) {
    console.error('Erro ao carregar contas:', error)
    showMessage('Erro ao carregar contas.', 'error')
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

  const end = new Date()
  const start = new Date()

  switch (value) {
    case 'mes-atual':
      start.setDate(1)
      break
    case 'mes-anterior':
      start.setMonth(start.getMonth() - 1)
      start.setDate(1)
      end.setDate(0)
      break
    case 'trimestre':
      start.setMonth(start.getMonth() - 3)
      break
    case 'semestre':
      start.setMonth(start.getMonth() - 6)
      break
    case 'ano':
      start.setFullYear(start.getFullYear() - 1)
      break
  }

  return { start, end }
}

// Update financial summary
function updateFinancialSummary() {
  const totalReceitas = receitas.reduce(
    (sum, conta) => sum + parseFloat(conta.valor),
    0
  )
  const totalDespesas = despesas.reduce(
    (sum, conta) => sum + parseFloat(conta.valor),
    0
  )
  const saldo = totalReceitas - totalDespesas

  document.getElementById('total-receitas').textContent =
    formatCurrency(totalReceitas)
  document.getElementById('total-despesas').textContent =
    formatCurrency(totalDespesas)
  document.getElementById('saldo-atual').textContent = formatCurrency(saldo)
  document.getElementById('total-unidades').textContent = '50' // Mock data
}

// Update charts
function updateCharts() {
  updateReceitasDespesasChart()
  updateDespesasCategoriaChart()
}

// Update receitas vs despesas chart
function updateReceitasDespesasChart() {
  const ctx = document.getElementById('chart-receitas-despesas')

  if (chartReceitasDespesas) {
    chartReceitasDespesas.destroy()
  }

  const totalReceitas = receitas.reduce(
    (sum, conta) => sum + parseFloat(conta.valor),
    0
  )
  const totalDespesas = despesas.reduce(
    (sum, conta) => sum + parseFloat(conta.valor),
    0
  )

  chartReceitasDespesas = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['Receitas', 'Despesas'],
      datasets: [
        {
          label: 'Valor (R$)',
          data: [totalReceitas, totalDespesas],
          backgroundColor: ['#28a745', '#dc3545'],
          borderColor: ['#28a745', '#dc3545'],
          borderWidth: 1
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: function (value) {
              return 'R$ ' + value.toLocaleString('pt-BR')
            }
          }
        }
      }
    }
  })
}

// Update despesas por categoria chart
function updateDespesasCategoriaChart() {
  const ctx = document.getElementById('chart-despesas-categoria')

  if (chartDespesasCategoria) {
    chartDespesasCategoria.destroy()
  }

  // Group despesas by categoria
  const categoriasCount = {}
  despesas.forEach(despesa => {
    const categoria = despesa.categoria || 'Outros'
    categoriasCount[categoria] =
      (categoriasCount[categoria] || 0) + parseFloat(despesa.valor)
  })

  const labels = Object.keys(categoriasCount)
  const data = Object.values(categoriasCount)

  chartDespesasCategoria = new Chart(ctx, {
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
            '#FF9F40',
            '#FF6384'
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

// Update tables
function updateTables() {
  updateReceitasTable()
  updateDespesasTable()
}

// Update receitas table
function updateReceitasTable() {
  const tbody = document.getElementById('receitas-table-body')

  if (receitas.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" class="empty-state">
          <h3>Nenhuma receita encontrada</h3>
          <p>Não há receitas no período selecionado.</p>
        </td>
      </tr>
    `
    return
  }

  tbody.innerHTML = receitas
    .map(
      receita => `
    <tr>
      <td>${formatDate(receita.data)}</td>
      <td>${receita.descricao || 'N/A'}</td>
      <td>${receita.categoria || 'N/A'}</td>
      <td class="value-positive">${formatCurrency(receita.valor)}</td>
      <td><span class="status-badge ${receita.status || 'pago'}">${
        receita.status || 'pago'
      }</span></td>
      <td>
        <div class="action-buttons">
          <button class="btn btn--info" onclick="editConta('${receita.id}')">
            ✏️ Editar
          </button>
          <button class="btn btn--danger" onclick="deleteConta('${
            receita.id
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

// Update despesas table
function updateDespesasTable() {
  const tbody = document.getElementById('despesas-table-body')

  if (despesas.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" class="empty-state">
          <h3>Nenhuma despesa encontrada</h3>
          <p>Não há despesas no período selecionado.</p>
        </td>
      </tr>
    `
    return
  }

  tbody.innerHTML = despesas
    .map(
      despesa => `
    <tr>
      <td>${formatDate(despesa.data)}</td>
      <td>${despesa.descricao || 'N/A'}</td>
      <td>${despesa.categoria || 'N/A'}</td>
      <td>${despesa.fornecedor || 'N/A'}</td>
      <td class="value-negative">${formatCurrency(despesa.valor)}</td>
      <td><span class="status-badge ${despesa.status || 'pendente'}">${
        despesa.status || 'pendente'
      }</span></td>
      <td>
        <div class="action-buttons">
          <button class="btn btn--info" onclick="editConta('${despesa.id}')">
            ✏️ Editar
          </button>
          <button class="btn btn--danger" onclick="deleteConta('${
            despesa.id
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

// Update summary content
function updateSummaryContent() {
  updateReceitasCategoriaSummary()
  updateDespesasCategoriaSummary()
  updateFluxoCaixaSummary()
}

// Update receitas categoria summary
function updateReceitasCategoriaSummary() {
  const container = document.getElementById('receitas-categoria-summary')

  // Group receitas by categoria
  const categoriasCount = {}
  receitas.forEach(receita => {
    const categoria = receita.categoria || 'Outros'
    categoriasCount[categoria] =
      (categoriasCount[categoria] || 0) + parseFloat(receita.valor)
  })

  const html = Object.entries(categoriasCount)
    .map(
      ([categoria, valor]) => `
    <li>
      <span class="category">${categoria}</span>
      <span class="value value-positive">${formatCurrency(valor)}</span>
    </li>
  `
    )
    .join('')

  container.innerHTML = `<ul class="summary-list">${html}</ul>`
}

// Update despesas categoria summary
function updateDespesasCategoriaSummary() {
  const container = document.getElementById('despesas-categoria-summary')

  // Group despesas by categoria
  const categoriasCount = {}
  despesas.forEach(despesa => {
    const categoria = despesa.categoria || 'Outros'
    categoriasCount[categoria] =
      (categoriasCount[categoria] || 0) + parseFloat(despesa.valor)
  })

  const html = Object.entries(categoriasCount)
    .map(
      ([categoria, valor]) => `
    <li>
      <span class="category">${categoria}</span>
      <span class="value value-negative">${formatCurrency(valor)}</span>
    </li>
  `
    )
    .join('')

  container.innerHTML = `<ul class="summary-list">${html}</ul>`
}

// Update fluxo caixa summary
function updateFluxoCaixaSummary() {
  const container = document.getElementById('fluxo-caixa-summary')

  const totalReceitas = receitas.reduce(
    (sum, conta) => sum + parseFloat(conta.valor),
    0
  )
  const totalDespesas = despesas.reduce(
    (sum, conta) => sum + parseFloat(conta.valor),
    0
  )
  const saldo = totalReceitas - totalDespesas

  const html = `
    <ul class="summary-list">
      <li>
        <span class="category">Receitas Totais</span>
        <span class="value value-positive">${formatCurrency(
          totalReceitas
        )}</span>
      </li>
      <li>
        <span class="category">Despesas Totais</span>
        <span class="value value-negative">${formatCurrency(
          totalDespesas
        )}</span>
      </li>
      <li>
        <span class="category">Saldo</span>
        <span class="value ${
          saldo >= 0 ? 'value-positive' : 'value-negative'
        }">${formatCurrency(saldo)}</span>
      </li>
    </ul>
  `

  container.innerHTML = html
}

// Handle tipo change
function handleTipoChange() {
  const tipo = document.getElementById('tipo-conta').value
  const categoriaSelect = document.getElementById('categoria-conta')
  const fornecedorGroup = document.getElementById('fornecedor-group')

  // Clear and populate categoria options
  categoriaSelect.innerHTML = '<option value="">Selecione a categoria</option>'

  if (tipo === 'receita') {
    categorias.receitas.forEach(categoria => {
      categoriaSelect.innerHTML += `<option value="${categoria}">${categoria}</option>`
    })
    fornecedorGroup.style.display = 'none'
  } else if (tipo === 'despesa') {
    categorias.despesas.forEach(categoria => {
      categoriaSelect.innerHTML += `<option value="${categoria}">${categoria}</option>`
    })
    fornecedorGroup.style.display = 'block'
  }
}

// Handle edit tipo change
function handleEditTipoChange() {
  const tipo = document.getElementById('edit-tipo-conta').value
  const categoriaSelect = document.getElementById('edit-categoria-conta')
  const fornecedorGroup = document.getElementById('edit-fornecedor-group')

  // Clear and populate categoria options
  categoriaSelect.innerHTML = '<option value="">Selecione a categoria</option>'

  if (tipo === 'receita') {
    categorias.receitas.forEach(categoria => {
      categoriaSelect.innerHTML += `<option value="${categoria}">${categoria}</option>`
    })
    fornecedorGroup.style.display = 'none'
  } else if (tipo === 'despesa') {
    categorias.despesas.forEach(categoria => {
      categoriaSelect.innerHTML += `<option value="${categoria}">${categoria}</option>`
    })
    fornecedorGroup.style.display = 'block'
  }
}

// Setup categoria options
function setupCategoriaOptions() {
  handleTipoChange()
}

// Handle add conta
async function handleAddConta(e) {
  e.preventDefault()

  try {
    const formData = new FormData(formNovaConta)
    const contaData = {
      tipo: formData.get('tipo'),
      descricao: formData.get('descricao'),
      categoria: formData.get('categoria'),
      valor: parseFloat(formData.get('valor')),
      data: new Date(formData.get('data')),
      fornecedor: formData.get('fornecedor') || '',
      observacoes: formData.get('observacoes') || '',
      status: formData.get('tipo') === 'receita' ? 'pago' : 'pendente',
      dataCriacao: new Date(),
      criadoPor: currentUser.uid
    }

    // Save to Firestore
    await db.collection('contas').add(contaData)

    showMessage('✅ Conta adicionada com sucesso!', 'success')
    closeAllModals()
    await loadContas()
  } catch (error) {
    console.error('Erro ao adicionar conta:', error)
    showMessage(`❌ Erro ao adicionar conta: ${error.message}`, 'error')
  }
}

// Handle edit conta
async function handleEditConta(e) {
  e.preventDefault()

  try {
    const formData = new FormData(formEditarConta)
    const contaId = formData.get('contaId')
    const contaData = {
      tipo: formData.get('tipo'),
      descricao: formData.get('descricao'),
      categoria: formData.get('categoria'),
      valor: parseFloat(formData.get('valor')),
      data: new Date(formData.get('data')),
      fornecedor: formData.get('fornecedor') || '',
      observacoes: formData.get('observacoes') || '',
      dataEdicao: new Date(),
      editadoPor: currentUser.uid
    }

    // Update in Firestore
    await db.collection('contas').doc(contaId).update(contaData)

    showMessage('✅ Conta atualizada com sucesso!', 'success')
    closeAllModals()
    await loadContas()
  } catch (error) {
    console.error('Erro ao editar conta:', error)
    showMessage(`❌ Erro ao editar conta: ${error.message}`, 'error')
  }
}

// Edit conta
async function editConta(contaId) {
  try {
    const contaDoc = await db.collection('contas').doc(contaId).get()

    if (!contaDoc.exists) {
      showMessage('Conta não encontrada.', 'error')
      return
    }

    const contaData = contaDoc.data()

    // Populate form
    document.getElementById('edit-conta-id').value = contaId
    document.getElementById('edit-tipo-conta').value = contaData.tipo
    document.getElementById('edit-descricao-conta').value =
      contaData.descricao || ''
    document.getElementById('edit-categoria-conta').value =
      contaData.categoria || ''
    document.getElementById('edit-valor-conta').value = contaData.valor || ''
    document.getElementById('edit-data-conta').value = formatDateForInput(
      contaData.data
    )
    document.getElementById('edit-fornecedor-conta').value =
      contaData.fornecedor || ''
    document.getElementById('edit-observacoes-conta').value =
      contaData.observacoes || ''

    // Setup categoria options
    handleEditTipoChange()

    openModal(modalEditarConta)
  } catch (error) {
    console.error('Erro ao carregar dados da conta:', error)
    showMessage('Erro ao carregar dados da conta.', 'error')
  }
}

// Delete conta
async function deleteConta(contaId) {
  if (!confirm('Tem certeza que deseja excluir esta conta?')) return

  try {
    await db.collection('contas').doc(contaId).delete()

    showMessage('✅ Conta excluída com sucesso!', 'success')
    await loadContas()
  } catch (error) {
    console.error('Erro ao excluir conta:', error)
    showMessage('Erro ao excluir conta.', 'error')
  }
}

// Generate report
function gerarRelatorio(tipo) {
  try {
    const period = getSelectedPeriod()
    const data = {
      tipo,
      periodo: period,
      receitas,
      despesas,
      totalReceitas: receitas.reduce(
        (sum, conta) => sum + parseFloat(conta.valor),
        0
      ),
      totalDespesas: despesas.reduce(
        (sum, conta) => sum + parseFloat(conta.valor),
        0
      ),
      dataGeracao: new Date()
    }

    // Create download
    const dataStr = JSON.stringify(data, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)

    const link = document.createElement('a')
    link.href = url
    link.download = `relatorio-${tipo}-${
      new Date().toISOString().split('T')[0]
    }.json`
    link.click()

    URL.revokeObjectURL(url)

    showMessage(`✅ Relatório ${tipo} gerado com sucesso!`, 'success')
  } catch (error) {
    console.error('Erro ao gerar relatório:', error)
    showMessage('Erro ao gerar relatório.', 'error')
  }
}

// Export data
function exportData(tipo) {
  try {
    let data = []
    let filename = ''

    switch (tipo) {
      case 'receitas':
        data = receitas
        filename = 'receitas'
        break
      case 'despesas':
        data = despesas
        filename = 'despesas'
        break
      case 'resumo':
        data = {
          receitas: receitas,
          despesas: despesas,
          totalReceitas: receitas.reduce(
            (sum, conta) => sum + parseFloat(conta.valor),
            0
          ),
          totalDespesas: despesas.reduce(
            (sum, conta) => sum + parseFloat(conta.valor),
            0
          )
        }
        filename = 'resumo'
        break
      case 'relatorios':
        data = {
          balancoMensal: { receitas, despesas },
          tendencias: { receitas, despesas },
          projecao: { receitas, despesas },
          demonstrativo: { receitas, despesas }
        }
        filename = 'relatorios'
        break
    }

    // Convert to CSV or JSON
    const dataStr = JSON.stringify(data, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)

    const link = document.createElement('a')
    link.href = url
    link.download = `prestacao-contas-${filename}-${
      new Date().toISOString().split('T')[0]
    }.json`
    link.click()

    URL.revokeObjectURL(url)

    showMessage(`✅ Dados ${tipo} exportados com sucesso!`, 'success')
  } catch (error) {
    console.error('Erro ao exportar dados:', error)
    showMessage('Erro ao exportar dados.', 'error')
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
  formNovaConta.reset()
  formEditarConta.reset()
}

// Format currency
function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value)
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

// Format date for input
function formatDateForInput(date) {
  if (!date) return ''

  try {
    const dateObj = date.toDate ? date.toDate() : new Date(date)
    return dateObj.toISOString().split('T')[0]
  } catch (error) {
    return ''
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
  const container = document.querySelector('.prestacao-container')
  container.insertBefore(messageDiv, container.firstChild)

  // Auto remove after 5 seconds
  setTimeout(() => {
    messageDiv.remove()
  }, 5000)
}

// Make functions global for onclick handlers
window.editConta = editConta
window.deleteConta = deleteConta
window.gerarRelatorio = gerarRelatorio

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  console.log('🚀 Prestação de contas inicializando...')
  initPrestacaoContas()
})
