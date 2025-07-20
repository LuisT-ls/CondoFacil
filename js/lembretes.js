// Lembretes Script
import { getUserData } from './modules/userRole.js'
import { auth, db } from './modules/firebase-config.js'
import {
  checkUserPermission,
  requirePermission,
  showAccessDenied
} from './modules/permissions.js'

// DOM Elements
const formContainer = document.getElementById('form-container')
const lembreteForm = document.getElementById('lembrete-form')
const listaLembretesAtivos = document.getElementById('lista-lembretes-ativos')
const listaLembretesPassados = document.getElementById(
  'lista-lembretes-passados'
)
const btnCriar = document.getElementById('btn-criar')

// State
let currentUser = null
let activeLembretes = []
let pastLembretes = []

// Initialize
async function initLembretes() {
  try {
    console.log('🚀 Inicializando sistema de lembretes...')

    // Get user data
    const userData = await getUserData()

    if (!userData) {
      console.error('Usuário não autenticado')
      window.location.href = '/login.html'
      return
    }

    currentUser = userData
    console.log('✅ Usuário carregado:', userData.nome)

    // Show form for síndico only with permission check
    const canCreateReminders = await checkUserPermission('canCreateReminders')
    if (canCreateReminders) {
      formContainer.style.display = 'block'
    }

    // Load reminders
    await loadLembretes()

    // Setup form
    setupForm()
  } catch (error) {
    console.error('Erro ao inicializar:', error)
    alert('Erro ao carregar dados. Tente novamente.')
  }
}

// Load reminders
async function loadLembretes() {
  try {
    // Load active reminders
    listaLembretesAtivos.innerHTML = `
      <div class="loading-message">
        <span class="spinner"></span>
        Carregando lembretes ativos...
      </div>
    `

    // Load past reminders
    listaLembretesPassados.innerHTML = `
      <div class="loading-message">
        <span class="spinner"></span>
        Carregando histórico...
      </div>
    `

    // Get reminders from Firestore
    const lembretesRef = db.collection('lembretes')
    const snapshot = await lembretesRef.orderBy('dataLembrete', 'desc').get()

    activeLembretes = []
    pastLembretes = []

    const now = new Date()

    snapshot.forEach(doc => {
      const lembrete = {
        id: doc.id,
        ...doc.data()
      }

      const dataLembrete = new Date(lembrete.dataLembrete)

      if (dataLembrete > now) {
        activeLembretes.push(lembrete)
      } else {
        pastLembretes.push(lembrete)
      }
    })

    console.log(
      `✅ ${activeLembretes.length} lembretes ativos, ${pastLembretes.length} passados`
    )

    await renderLembretesAtivos(activeLembretes)
    await renderLembretesPassados(pastLembretes)
  } catch (error) {
    console.error('Erro ao carregar lembretes:', error)
    listaLembretesAtivos.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">⚠️</div>
        <p>Erro ao carregar lembretes. Tente novamente.</p>
      </div>
    `
    listaLembretesPassados.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">⚠️</div>
        <p>Erro ao carregar histórico. Tente novamente.</p>
      </div>
    `
  }
}

// Render active reminders
async function renderLembretesAtivos(lembretes) {
  if (lembretes.length === 0) {
    listaLembretesAtivos.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">⏰</div>
        <p>Nenhum lembrete ativo no momento.</p>
      </div>
    `
    return
  }

  const canDelete = await checkUserPermission('canDeleteReminders')

  listaLembretesAtivos.innerHTML = lembretes
    .map(
      lembrete => `
    <div class="lembrete-card" data-id="${lembrete.id}">
      <div class="lembrete-header">
        <div class="lembrete-info">
          <div class="lembrete-titulo">
            ${getTipoIcon(lembrete.tipo)} ${lembrete.titulo}
            <span class="priority-badge priority-${lembrete.prioridade}">${
        lembrete.prioridade
      }</span>
          </div>
          <span class="lembrete-status status-ativo">Ativo</span>
        </div>
      </div>
      
      <div class="lembrete-meta">
        <span>📅 ${formatarData(lembrete.dataLembrete)}</span>
        <span>👤 ${lembrete.autor || 'Síndico'}</span>
        <span>🏷️ ${getTipoDisplayName(lembrete.tipo)}</span>
      </div>
      
      <div class="lembrete-descricao">${lembrete.descricao}</div>
      
      ${
        canDelete
          ? `
        <div class="lembrete-actions">
          <button class="btn-delete" onclick="deleteLembrete('${lembrete.id}')">
            🗑️ Excluir
          </button>
        </div>
      `
          : ''
      }
    </div>
  `
    )
    .join('')
}

// Render past reminders
async function renderLembretesPassados(lembretes) {
  if (lembretes.length === 0) {
    listaLembretesPassados.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">📅</div>
        <p>Nenhum lembrete passado encontrado.</p>
      </div>
    `
    return
  }

  const canDelete = await checkUserPermission('canDeleteReminders')

  listaLembretesPassados.innerHTML = lembretes
    .map(
      lembrete => `
    <div class="lembrete-card" data-id="${lembrete.id}">
      <div class="lembrete-header">
        <div class="lembrete-info">
          <div class="lembrete-titulo">
            ${getTipoIcon(lembrete.tipo)} ${lembrete.titulo}
            <span class="priority-badge priority-${lembrete.prioridade}">${
        lembrete.prioridade
      }</span>
          </div>
          <span class="lembrete-status status-passado">Passado</span>
        </div>
      </div>
      
      <div class="lembrete-meta">
        <span>📅 ${formatarData(lembrete.dataLembrete)}</span>
        <span>👤 ${lembrete.autor || 'Síndico'}</span>
        <span>🏷️ ${getTipoDisplayName(lembrete.tipo)}</span>
      </div>
      
      <div class="lembrete-descricao">${lembrete.descricao}</div>
      
      ${
        canDelete
          ? `
        <div class="lembrete-actions">
          <button class="btn-delete" onclick="deleteLembrete('${lembrete.id}')">
            🗑️ Excluir
          </button>
        </div>
      `
          : ''
      }
    </div>
  `
    )
    .join('')
}

// Get type icon
function getTipoIcon(tipo) {
  const icons = {
    manutencao: '🔧',
    seguranca: '🔒',
    evento: '🎉',
    pagamento: '💰',
    geral: '📢'
  }
  return icons[tipo] || '📢'
}

// Get type display name
function getTipoDisplayName(tipo) {
  const names = {
    manutencao: 'Manutenção',
    seguranca: 'Segurança',
    evento: 'Evento',
    pagamento: 'Pagamento',
    geral: 'Geral'
  }
  return names[tipo] || 'Geral'
}

// Setup form
function setupForm() {
  lembreteForm.addEventListener('submit', handleSubmit)
}

// Handle form submission
async function handleSubmit(event) {
  event.preventDefault()

  // Check permission before allowing form submission
  const canCreate = await requirePermission(
    'canCreateReminders',
    () => true,
    'Apenas síndicos podem criar lembretes.'
  )

  if (!canCreate) return

  try {
    // Get form data
    const formData = new FormData(lembreteForm)
    const titulo = formData.get('titulo').trim()
    const descricao = formData.get('descricao').trim()
    const dataLembrete = formData.get('data-lembrete')
    const tipo = formData.get('tipo')
    const prioridade = formData.get('prioridade')

    // Validate
    if (!titulo || !descricao || !dataLembrete || !tipo || !prioridade) {
      alert('Por favor, preencha todos os campos obrigatórios.')
      return
    }

    // Show loading
    btnCriar.classList.add('loading')

    // Create reminder
    const lembreteData = {
      titulo,
      descricao,
      dataLembrete: new Date(dataLembrete).toISOString(),
      tipo,
      prioridade,
      autor: currentUser.nome,
      dataCriacao: new Date().toISOString(),
      status: 'ativo'
    }

    // Save to Firestore
    await db.collection('lembretes').add(lembreteData)

    console.log('✅ Lembrete criado com sucesso!')
    alert('✅ Lembrete criado com sucesso!')

    // Reset form
    lembreteForm.reset()

    // Reload reminders
    await loadLembretes()
  } catch (error) {
    console.error('Erro ao criar lembrete:', error)
    alert('❌ Erro ao criar lembrete. Tente novamente.')
  } finally {
    btnCriar.classList.remove('loading')
  }
}

// Delete reminder
window.deleteLembrete = async function (lembreteId) {
  // Check permission
  const canDelete = await requirePermission(
    'canDeleteReminders',
    () => true,
    'Você não tem permissão para excluir lembretes.'
  )

  if (!canDelete) return

  try {
    if (!confirm('Tem certeza que deseja excluir este lembrete?')) return

    await db.collection('lembretes').doc(lembreteId).delete()

    console.log('✅ Lembrete excluído com sucesso!')
    alert('✅ Lembrete excluído com sucesso!')

    await loadLembretes()
  } catch (error) {
    console.error('Erro ao excluir lembrete:', error)
    alert('❌ Erro ao excluir lembrete. Tente novamente.')
  }
}

// Format date
function formatarData(dataString) {
  try {
    const data = new Date(dataString)
    return data.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch (error) {
    return dataString
  }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  console.log('🚀 Lembretes inicializando...')
  initLembretes()
})
