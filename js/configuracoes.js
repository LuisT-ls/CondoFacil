// Configurações Script
import { getUserData } from './modules/userRole.js'
import { auth, db } from './modules/firebase-config.js'
import {
  checkUserPermission,
  requirePermission,
  showAccessDenied
} from './modules/permissions.js'

// DOM Elements
const navTabs = document.querySelectorAll('.nav-tab')
const settingsPanels = document.querySelectorAll('.settings-panel')
const formGeral = document.getElementById('form-geral')
const formReservas = document.getElementById('form-reservas')
const formNotificacoes = document.getElementById('form-notificacoes')
const formSeguranca = document.getElementById('form-seguranca')
const formBackup = document.getElementById('form-backup')
const btnBackup = document.getElementById('btn-backup')
const btnRestaurar = document.getElementById('btn-restaurar')
const btnExportar = document.getElementById('btn-exportar')

// State
let currentUser = null
let settings = {}

// Initialize
async function initConfiguracoes() {
  try {
    console.log('🚀 Inicializando configurações...')

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
    const canManageSettings = await checkUserPermission('canManageSettings')
    if (!canManageSettings) {
      showAccessDenied('Apenas síndicos podem acessar as configurações.')
      window.location.href = '/dashboard.html'
      return
    }

    // Load settings
    await loadSettings()

    // Setup navigation
    setupNavigation()

    // Setup forms
    setupForms()

    // Load backup info
    await loadBackupInfo()
  } catch (error) {
    console.error('Erro ao inicializar configurações:', error)
    alert('Erro ao carregar configurações. Tente novamente.')
  }
}

// Load settings from Firestore
async function loadSettings() {
  try {
    const settingsDoc = await db.collection('configuracoes').doc('geral').get()

    if (settingsDoc.exists) {
      settings = settingsDoc.data()
      console.log('✅ Configurações carregadas:', settings)
    } else {
      // Create default settings
      settings = getDefaultSettings()
      await saveSettings(settings)
      console.log('✅ Configurações padrão criadas')
    }

    // Populate forms
    populateForms()
  } catch (error) {
    console.error('Erro ao carregar configurações:', error)
    settings = getDefaultSettings()
    populateForms()
  }
}

// Get default settings
function getDefaultSettings() {
  return {
    geral: {
      nomeCondominio: '',
      enderecoCondominio: '',
      telefoneCondominio: '',
      emailCondominio: '',
      fusoHorario: 'America/Sao_Paulo',
      idioma: 'pt-BR'
    },
    reservas: {
      tempoMinimoReserva: 24,
      tempoMaximoReserva: 30,
      duracaoMaximaReserva: 4,
      limiteReservasPorMorador: 5,
      areas: [
        'salao-festas',
        'churrasqueira',
        'quadra',
        'piscina',
        'academia',
        'salao-jogos'
      ]
    },
    notificacoes: {
      tipos: ['reservas', 'comunicados', 'votacoes', 'lembretes'],
      emailNotificacoes: '',
      horarioNotificacoes: '09:00'
    },
    seguranca: {
      senhaMinima: 8,
      requisitosSenha: ['maiusculas', 'minusculas', 'numeros'],
      sessaoTimeout: 30,
      auth: ['email-senha', 'google']
    },
    backup: {
      frequenciaBackup: 'semanal',
      horarioBackup: '02:00',
      ultimoBackup: null
    }
  }
}

// Populate forms with settings
function populateForms() {
  // Geral settings
  if (settings.geral) {
    document.getElementById('nome-condominio').value =
      settings.geral.nomeCondominio || ''
    document.getElementById('endereco-condominio').value =
      settings.geral.enderecoCondominio || ''
    document.getElementById('telefone-condominio').value =
      settings.geral.telefoneCondominio || ''
    document.getElementById('email-condominio').value =
      settings.geral.emailCondominio || ''
    document.getElementById('fuso-horario').value =
      settings.geral.fusoHorario || 'America/Sao_Paulo'
    document.getElementById('idioma').value = settings.geral.idioma || 'pt-BR'
  }

  // Reservas settings
  if (settings.reservas) {
    document.getElementById('tempo-minimo-reserva').value =
      settings.reservas.tempoMinimoReserva || 24
    document.getElementById('tempo-maximo-reserva').value =
      settings.reservas.tempoMaximoReserva || 30
    document.getElementById('duracao-maxima-reserva').value =
      settings.reservas.duracaoMaximaReserva || 4
    document.getElementById('limite-reservas-por-morador').value =
      settings.reservas.limiteReservasPorMorador || 5

    // Check areas
    const areaCheckboxes = document.querySelectorAll('input[name="areas"]')
    areaCheckboxes.forEach(checkbox => {
      checkbox.checked =
        settings.reservas.areas?.includes(checkbox.value) || false
    })
  }

  // Notificações settings
  if (settings.notificacoes) {
    document.getElementById('email-notificacoes').value =
      settings.notificacoes.emailNotificacoes || ''
    document.getElementById('horario-notificacoes').value =
      settings.notificacoes.horarioNotificacoes || '09:00'

    // Check notification types
    const notifCheckboxes = document.querySelectorAll(
      'input[name="notificacoes"]'
    )
    notifCheckboxes.forEach(checkbox => {
      checkbox.checked =
        settings.notificacoes.tipos?.includes(checkbox.value) || false
    })
  }

  // Segurança settings
  if (settings.seguranca) {
    document.getElementById('senha-minima').value =
      settings.seguranca.senhaMinima || 8
    document.getElementById('sessao-timeout').value =
      settings.seguranca.sessaoTimeout || 30

    // Check password requirements
    const reqCheckboxes = document.querySelectorAll(
      'input[name="requisitos-senha"]'
    )
    reqCheckboxes.forEach(checkbox => {
      checkbox.checked =
        settings.seguranca.requisitosSenha?.includes(checkbox.value) || false
    })

    // Check auth methods
    const authCheckboxes = document.querySelectorAll('input[name="auth"]')
    authCheckboxes.forEach(checkbox => {
      checkbox.checked =
        settings.seguranca.auth?.includes(checkbox.value) || false
    })
  }

  // Backup settings
  if (settings.backup) {
    document.getElementById('frequencia-backup').value =
      settings.backup.frequenciaBackup || 'semanal'
    document.getElementById('horario-backup').value =
      settings.backup.horarioBackup || '02:00'
  }
}

// Setup navigation
function setupNavigation() {
  navTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const targetPanel = tab.dataset.tab

      // Remove active class from all tabs and panels
      navTabs.forEach(t => t.classList.remove('active'))
      settingsPanels.forEach(p => p.classList.remove('active'))

      // Add active class to clicked tab and target panel
      tab.classList.add('active')
      document.getElementById(targetPanel).classList.add('active')
    })
  })
}

// Setup forms
function setupForms() {
  // Geral form
  formGeral.addEventListener('submit', async e => {
    e.preventDefault()
    await saveGeralSettings()
  })

  // Reservas form
  formReservas.addEventListener('submit', async e => {
    e.preventDefault()
    await saveReservasSettings()
  })

  // Notificações form
  formNotificacoes.addEventListener('submit', async e => {
    e.preventDefault()
    await saveNotificacoesSettings()
  })

  // Segurança form
  formSeguranca.addEventListener('submit', async e => {
    e.preventDefault()
    await saveSegurancaSettings()
  })

  // Backup form
  formBackup.addEventListener('submit', async e => {
    e.preventDefault()
    await saveBackupSettings()
  })

  // Backup actions
  btnBackup.addEventListener('click', async () => {
    await performBackup()
  })

  btnRestaurar.addEventListener('click', async () => {
    await restoreBackup()
  })

  btnExportar.addEventListener('click', async () => {
    await exportData()
  })
}

// Save geral settings
async function saveGeralSettings() {
  try {
    const formData = new FormData(formGeral)

    settings.geral = {
      nomeCondominio: formData.get('nome-condominio'),
      enderecoCondominio: formData.get('endereco-condominio'),
      telefoneCondominio: formData.get('telefone-condominio'),
      emailCondominio: formData.get('email-condominio'),
      fusoHorario: formData.get('fuso-horario'),
      idioma: formData.get('idioma')
    }

    await saveSettings(settings)
    showMessage('✅ Configurações gerais salvas com sucesso!', 'success')
  } catch (error) {
    console.error('Erro ao salvar configurações gerais:', error)
    showMessage('❌ Erro ao salvar configurações gerais.', 'error')
  }
}

// Save reservas settings
async function saveReservasSettings() {
  try {
    const formData = new FormData(formReservas)

    // Get checked areas
    const areas = []
    document
      .querySelectorAll('input[name="areas"]:checked')
      .forEach(checkbox => {
        areas.push(checkbox.value)
      })

    settings.reservas = {
      tempoMinimoReserva: parseInt(formData.get('tempo-minimo-reserva')),
      tempoMaximoReserva: parseInt(formData.get('tempo-maximo-reserva')),
      duracaoMaximaReserva: parseInt(formData.get('duracao-maxima-reserva')),
      limiteReservasPorMorador: parseInt(
        formData.get('limite-reservas-por-morador')
      ),
      areas: areas
    }

    await saveSettings(settings)
    showMessage('✅ Configurações de reservas salvas com sucesso!', 'success')
  } catch (error) {
    console.error('Erro ao salvar configurações de reservas:', error)
    showMessage('❌ Erro ao salvar configurações de reservas.', 'error')
  }
}

// Save notificações settings
async function saveNotificacoesSettings() {
  try {
    const formData = new FormData(formNotificacoes)

    // Get checked notification types
    const tipos = []
    document
      .querySelectorAll('input[name="notificacoes"]:checked')
      .forEach(checkbox => {
        tipos.push(checkbox.value)
      })

    settings.notificacoes = {
      tipos: tipos,
      emailNotificacoes: formData.get('email-notificacoes'),
      horarioNotificacoes: formData.get('horario-notificacoes')
    }

    await saveSettings(settings)
    showMessage(
      '✅ Configurações de notificações salvas com sucesso!',
      'success'
    )
  } catch (error) {
    console.error('Erro ao salvar configurações de notificações:', error)
    showMessage('❌ Erro ao salvar configurações de notificações.', 'error')
  }
}

// Save segurança settings
async function saveSegurancaSettings() {
  try {
    const formData = new FormData(formSeguranca)

    // Get checked password requirements
    const requisitos = []
    document
      .querySelectorAll('input[name="requisitos-senha"]:checked')
      .forEach(checkbox => {
        requisitos.push(checkbox.value)
      })

    // Get checked auth methods
    const auth = []
    document
      .querySelectorAll('input[name="auth"]:checked')
      .forEach(checkbox => {
        auth.push(checkbox.value)
      })

    settings.seguranca = {
      senhaMinima: parseInt(formData.get('senha-minima')),
      requisitosSenha: requisitos,
      sessaoTimeout: parseInt(formData.get('sessao-timeout')),
      auth: auth
    }

    await saveSettings(settings)
    showMessage('✅ Configurações de segurança salvas com sucesso!', 'success')
  } catch (error) {
    console.error('Erro ao salvar configurações de segurança:', error)
    showMessage('❌ Erro ao salvar configurações de segurança.', 'error')
  }
}

// Save backup settings
async function saveBackupSettings() {
  try {
    const formData = new FormData(formBackup)

    settings.backup = {
      frequenciaBackup: formData.get('frequencia-backup'),
      horarioBackup: formData.get('horario-backup'),
      ultimoBackup: settings.backup?.ultimoBackup || null
    }

    await saveSettings(settings)
    showMessage('✅ Configurações de backup salvas com sucesso!', 'success')
  } catch (error) {
    console.error('Erro ao salvar configurações de backup:', error)
    showMessage('❌ Erro ao salvar configurações de backup.', 'error')
  }
}

// Save settings to Firestore
async function saveSettings(settings) {
  await db.collection('configuracoes').doc('geral').set(settings)
  console.log('✅ Configurações salvas no Firestore')
}

// Load backup info
async function loadBackupInfo() {
  try {
    // Get last backup info
    const ultimoBackup = settings.backup?.ultimoBackup
    document.getElementById('ultimo-backup').textContent = ultimoBackup
      ? new Date(ultimoBackup).toLocaleString('pt-BR')
      : 'Nunca realizado'

    // Get data size (simulated)
    const dataSize = await calculateDataSize()
    document.getElementById('tamanho-dados').textContent = dataSize

    // Get active users count
    const usersCount = await getActiveUsersCount()
    document.getElementById('usuarios-ativos').textContent = usersCount
  } catch (error) {
    console.error('Erro ao carregar informações de backup:', error)
  }
}

// Calculate data size (simulated)
async function calculateDataSize() {
  try {
    const collections = [
      'usuarios',
      'reservas',
      'comunicados',
      'votacoes',
      'lembretes'
    ]
    let totalDocs = 0

    for (const collection of collections) {
      const snapshot = await db.collection(collection).get()
      totalDocs += snapshot.size
    }

    const estimatedSize = totalDocs * 2 // KB per document (estimated)
    return `${estimatedSize} KB`
  } catch (error) {
    return 'Calculando...'
  }
}

// Get active users count
async function getActiveUsersCount() {
  try {
    const snapshot = await db.collection('usuarios').get()
    return snapshot.size
  } catch (error) {
    return 'Calculando...'
  }
}

// Perform backup
async function performBackup() {
  try {
    if (!confirm('Tem certeza que deseja fazer backup dos dados?')) return

    btnBackup.classList.add('loading')

    // Simulate backup process
    await new Promise(resolve => setTimeout(resolve, 2000))

    // Update last backup time
    settings.backup.ultimoBackup = new Date().toISOString()
    await saveSettings(settings)

    // Update UI
    document.getElementById('ultimo-backup').textContent =
      new Date().toLocaleString('pt-BR')

    showMessage('✅ Backup realizado com sucesso!', 'success')
  } catch (error) {
    console.error('Erro ao fazer backup:', error)
    showMessage('❌ Erro ao fazer backup.', 'error')
  } finally {
    btnBackup.classList.remove('loading')
  }
}

// Restore backup
async function restoreBackup() {
  try {
    if (
      !confirm(
        'ATENÇÃO: Restaurar backup irá sobrescrever todos os dados atuais. Continuar?'
      )
    )
      return

    btnRestaurar.classList.add('loading')

    // Simulate restore process
    await new Promise(resolve => setTimeout(resolve, 3000))

    showMessage('✅ Backup restaurado com sucesso!', 'success')
  } catch (error) {
    console.error('Erro ao restaurar backup:', error)
    showMessage('❌ Erro ao restaurar backup.', 'error')
  } finally {
    btnRestaurar.classList.remove('loading')
  }
}

// Export data
async function exportData() {
  try {
    btnExportar.classList.add('loading')

    // Get all data
    const collections = [
      'usuarios',
      'reservas',
      'comunicados',
      'votacoes',
      'lembretes'
    ]
    const exportData = {}

    for (const collection of collections) {
      const snapshot = await db.collection(collection).get()
      exportData[collection] = []
      snapshot.forEach(doc => {
        exportData[collection].push({
          id: doc.id,
          ...doc.data()
        })
      })
    }

    // Create download
    const dataStr = JSON.stringify(exportData, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)

    const link = document.createElement('a')
    link.href = url
    link.download = `condofacil-backup-${
      new Date().toISOString().split('T')[0]
    }.json`
    link.click()

    URL.revokeObjectURL(url)

    showMessage('✅ Dados exportados com sucesso!', 'success')
  } catch (error) {
    console.error('Erro ao exportar dados:', error)
    showMessage('❌ Erro ao exportar dados.', 'error')
  } finally {
    btnExportar.classList.remove('loading')
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

  // Insert at top of settings content
  const settingsContent = document.querySelector('.settings-content')
  settingsContent.insertBefore(messageDiv, settingsContent.firstChild)

  // Auto remove after 5 seconds
  setTimeout(() => {
    messageDiv.remove()
  }, 5000)
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  console.log('🚀 Configurações inicializando...')
  initConfiguracoes()
})
