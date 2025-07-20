// Comunicados Script
import { getUserData } from './modules/userRole.js'
import { auth, db } from './modules/firebase-config.js'

// DOM Elements
const formContainer = document.getElementById('form-container')
const comunicadoForm = document.getElementById('comunicado-form')
const listaComunicados = document.getElementById('lista-comunicados')
const btnEnviar = document.getElementById('btn-enviar')

// State
let currentUser = null

// Initialize
async function initComunicados() {
  try {
    console.log('🚀 Inicializando sistema de comunicados...')

    // Get user data
    const userData = await getUserData()

    if (!userData) {
      console.error('Usuário não autenticado')
      window.location.href = '/login.html'
      return
    }

    currentUser = userData
    console.log('✅ Usuário carregado:', userData.nome)

    // Show form for síndico only
    if (userData.papel === 'sindico') {
      formContainer.style.display = 'block'
    }

    // Load communications
    await loadComunicados()

    // Setup form
    setupForm()
  } catch (error) {
    console.error('Erro ao inicializar:', error)
    alert('Erro ao carregar dados. Tente novamente.')
  }
}

// Load communications
async function loadComunicados() {
  try {
    listaComunicados.innerHTML = `
      <div class="loading-message">
        <span class="spinner"></span>
        Carregando comunicados...
      </div>
    `

    // Get communications from Firestore
    const comunicadosRef = db.collection('comunicados')
    const snapshot = await comunicadosRef.orderBy('dataCriacao', 'desc').get()

    const comunicados = []

    snapshot.forEach(doc => {
      const comunicado = {
        id: doc.id,
        ...doc.data()
      }
      comunicados.push(comunicado)
    })

    console.log(`✅ ${comunicados.length} comunicados carregados`)

    renderComunicados(comunicados)
  } catch (error) {
    console.error('Erro ao carregar comunicados:', error)
    listaComunicados.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">⚠️</div>
        <p>Erro ao carregar comunicados. Tente novamente.</p>
      </div>
    `
  }
}

// Render communications
function renderComunicados(comunicados) {
  if (comunicados.length === 0) {
    listaComunicados.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">📢</div>
        <p>Nenhum comunicado encontrado.</p>
      </div>
    `
    return
  }

  listaComunicados.innerHTML = comunicados
    .map(
      comunicado => `
    <div class="comunicado-card" data-id="${comunicado.id}">
      <div class="comunicado-header">
        <div class="comunicado-info">
          <div class="comunicado-titulo">${comunicado.titulo}</div>
          <span class="comunicado-tipo tipo-${comunicado.tipo}">${
        comunicado.tipo
      }</span>
        </div>
      </div>
      
      <div class="comunicado-meta">
        <span>📅 ${formatarData(comunicado.dataCriacao)}</span>
        <span>👤 ${comunicado.autor || 'Síndico'}</span>
      </div>
      
      <div class="comunicado-mensagem">${comunicado.mensagem}</div>
      
      ${
        currentUser.papel === 'sindico'
          ? `
        <div class="comunicado-actions">
          <button class="btn-view" onclick="viewComunicado('${comunicado.id}')">
            👁️ Ver Detalhes
          </button>
          <button class="btn-delete" onclick="deleteComunicado('${comunicado.id}')">
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

// Setup form
function setupForm() {
  comunicadoForm.addEventListener('submit', handleSubmit)
}

// Handle form submission
async function handleSubmit(event) {
  event.preventDefault()

  try {
    // Get form data
    const formData = new FormData(comunicadoForm)
    const titulo = formData.get('titulo').trim()
    const mensagem = formData.get('mensagem').trim()
    const tipo = formData.get('tipo')

    // Validate
    if (!titulo || !mensagem || !tipo) {
      alert('Por favor, preencha todos os campos obrigatórios.')
      return
    }

    // Show loading
    btnEnviar.classList.add('loading')

    // Create communication
    const comunicadoData = {
      titulo,
      mensagem,
      tipo,
      autor: currentUser.nome,
      dataCriacao: new Date().toISOString(),
      status: 'ativo'
    }

    // Save to Firestore
    await db.collection('comunicados').add(comunicadoData)

    console.log('✅ Comunicado enviado com sucesso!')
    alert('✅ Comunicado enviado com sucesso!')

    // Reset form
    comunicadoForm.reset()

    // Reload communications
    await loadComunicados()
  } catch (error) {
    console.error('Erro ao enviar comunicado:', error)
    alert('❌ Erro ao enviar comunicado. Tente novamente.')
  } finally {
    btnEnviar.classList.remove('loading')
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

// View communication details
window.viewComunicado = function (comunicadoId) {
  // Find communication in the list
  const comunicadoCard = document.querySelector(`[data-id="${comunicadoId}"]`)
  if (!comunicadoCard) return

  const titulo = comunicadoCard.querySelector('.comunicado-titulo').textContent
  const mensagem = comunicadoCard.querySelector(
    '.comunicado-mensagem'
  ).textContent
  const tipo = comunicadoCard.querySelector('.comunicado-tipo').textContent
  const data = comunicadoCard.querySelector(
    '.comunicado-meta span:first-child'
  ).textContent
  const autor = comunicadoCard.querySelector(
    '.comunicado-meta span:last-child'
  ).textContent

  const details = `
    📢 Detalhes do Comunicado
    
    Título: ${titulo}
    Tipo: ${tipo}
    Autor: ${autor}
    Data: ${data}
    
    Mensagem:
    ${mensagem}
  `

  alert(details)
}

// Delete communication
window.deleteComunicado = async function (comunicadoId) {
  try {
    if (!confirm('Tem certeza que deseja excluir este comunicado?')) return

    await db.collection('comunicados').doc(comunicadoId).delete()

    console.log('✅ Comunicado excluído com sucesso!')
    alert('✅ Comunicado excluído com sucesso!')

    await loadComunicados()
  } catch (error) {
    console.error('Erro ao excluir comunicado:', error)
    alert('❌ Erro ao excluir comunicado. Tente novamente.')
  }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  console.log('🚀 Comunicados inicializando...')
  initComunicados()
})
