// Votações Script
import { getUserData } from './modules/userRole.js'
import { auth, db } from './modules/firebase-config.js'

// DOM Elements
const formContainer = document.getElementById('form-container')
const votacaoForm = document.getElementById('votacao-form')
const listaVotacoesAtivas = document.getElementById('lista-votacoes-ativas')
const listaVotacoesEncerradas = document.getElementById(
  'lista-votacoes-encerradas'
)
const btnCriar = document.getElementById('btn-criar')
const tipoSelect = document.getElementById('tipo')
const opcoesContainer = document.getElementById('opcoes-container')
const opcoesList = document.getElementById('opcoes-list')

// State
let currentUser = null
let activeVotacoes = []
let pastVotacoes = []

// Initialize
async function initVotacoes() {
  try {
    console.log('🚀 Inicializando sistema de votações...')

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

    // Load votings
    await loadVotacoes()

    // Setup form
    setupForm()
  } catch (error) {
    console.error('Erro ao inicializar:', error)
    alert('Erro ao carregar dados. Tente novamente.')
  }
}

// Load votings
async function loadVotacoes() {
  try {
    // Load active votings
    listaVotacoesAtivas.innerHTML = `
      <div class="loading-message">
        <span class="spinner"></span>
        Carregando votações ativas...
      </div>
    `

    // Load past votings
    listaVotacoesEncerradas.innerHTML = `
      <div class="loading-message">
        <span class="spinner"></span>
        Carregando resultados...
      </div>
    `

    // Get votings from Firestore
    const votacoesRef = db.collection('votacoes')
    const snapshot = await votacoesRef.orderBy('dataCriacao', 'desc').get()

    activeVotacoes = []
    pastVotacoes = []

    const now = new Date()

    snapshot.forEach(doc => {
      const votacao = {
        id: doc.id,
        ...doc.data()
      }

      const dataFim = new Date(votacao.dataFim)

      if (dataFim > now) {
        activeVotacoes.push(votacao)
      } else {
        pastVotacoes.push(votacao)
      }
    })

    console.log(
      `✅ ${activeVotacoes.length} votações ativas, ${pastVotacoes.length} encerradas`
    )

    renderVotacoesAtivas(activeVotacoes)
    renderVotacoesEncerradas(pastVotacoes)
  } catch (error) {
    console.error('Erro ao carregar votações:', error)
    listaVotacoesAtivas.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">⚠️</div>
        <p>Erro ao carregar votações. Tente novamente.</p>
      </div>
    `
    listaVotacoesEncerradas.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">⚠️</div>
        <p>Erro ao carregar resultados. Tente novamente.</p>
      </div>
    `
  }
}

// Render active votings
function renderVotacoesAtivas(votacoes) {
  if (votacoes.length === 0) {
    listaVotacoesAtivas.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">🗳️</div>
        <p>Nenhuma votação ativa no momento.</p>
      </div>
    `
    return
  }

  listaVotacoesAtivas.innerHTML = votacoes
    .map(
      votacao => `
    <div class="votacao-card" data-id="${votacao.id}">
      <div class="votacao-header">
        <div class="votacao-info">
          <div class="votacao-titulo">${votacao.titulo}</div>
          <span class="votacao-status status-ativa">Ativa</span>
        </div>
      </div>
      
      <div class="votacao-meta">
        <span>📅 Encerra: ${formatarData(votacao.dataFim)}</span>
        <span>👤 ${votacao.autor || 'Síndico'}</span>
        <span>📊 ${
          votacao.tipo === 'sim-nao' ? 'Sim/Não' : 'Múltipla Escolha'
        }</span>
      </div>
      
      <div class="votacao-descricao">${votacao.descricao}</div>
      
      ${
        !hasVoted(votacao.id)
          ? `
        <div class="opcoes-votacao">
          <form class="voto-form" data-votacao-id="${votacao.id}">
            ${renderOpcoesVoto(votacao)}
            <div class="votacao-actions">
              <button type="submit" class="btn-votar">
                ✅ Votar
              </button>
            </div>
          </form>
        </div>
      `
          : `
        <div class="votacao-actions">
          <button class="btn-resultados" onclick="viewResultados('${votacao.id}')">
            📊 Ver Resultados
          </button>
        </div>
      `
      }
    </div>
  `
    )
    .join('')

  // Setup vote forms
  setupVoteForms()
}

// Render past votings
function renderVotacoesEncerradas(votacoes) {
  if (votacoes.length === 0) {
    listaVotacoesEncerradas.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">📊</div>
        <p>Nenhuma votação encerrada encontrada.</p>
      </div>
    `
    return
  }

  listaVotacoesEncerradas.innerHTML = votacoes
    .map(
      votacao => `
    <div class="votacao-card" data-id="${votacao.id}">
      <div class="votacao-header">
        <div class="votacao-info">
          <div class="votacao-titulo">${votacao.titulo}</div>
          <span class="votacao-status status-encerrada">Encerrada</span>
        </div>
      </div>
      
      <div class="votacao-meta">
        <span>📅 Encerrou: ${formatarData(votacao.dataFim)}</span>
        <span>👤 ${votacao.autor || 'Síndico'}</span>
        <span>📊 ${
          votacao.tipo === 'sim-nao' ? 'Sim/Não' : 'Múltipla Escolha'
        }</span>
      </div>
      
      <div class="votacao-descricao">${votacao.descricao}</div>
      
      <div class="resultados">
        ${renderResultados(votacao)}
      </div>
    </div>
  `
    )
    .join('')
}

// Render voting options
function renderOpcoesVoto(votacao) {
  if (votacao.tipo === 'sim-nao') {
    return `
      <div class="opcao-voto">
        <input type="radio" name="voto" value="sim" id="sim-${votacao.id}" required>
        <label for="sim-${votacao.id}" class="opcao-texto">✅ Sim</label>
      </div>
      <div class="opcao-voto">
        <input type="radio" name="voto" value="nao" id="nao-${votacao.id}" required>
        <label for="nao-${votacao.id}" class="opcao-texto">❌ Não</label>
      </div>
    `
  } else {
    return votacao.opcoes
      .map(
        (opcao, index) => `
      <div class="opcao-voto">
        <input type="radio" name="voto" value="${opcao}" id="opcao-${votacao.id}-${index}" required>
        <label for="opcao-${votacao.id}-${index}" class="opcao-texto">${opcao}</label>
      </div>
    `
      )
      .join('')
  }
}

// Render results
function renderResultados(votacao) {
  if (!votacao.resultados) {
    return '<p>Nenhum resultado disponível.</p>'
  }

  const totalVotos = Object.values(votacao.resultados).reduce(
    (sum, count) => sum + count,
    0
  )

  if (totalVotos === 0) {
    return '<p>Nenhum voto registrado.</p>'
  }

  return Object.entries(votacao.resultados)
    .map(([opcao, votos]) => {
      const percentual = ((votos / totalVotos) * 100).toFixed(1)
      return `
      <div class="resultado-item">
        <span class="opcao-texto">${opcao}</span>
        <div class="barra-progresso">
          <div class="barra-fill" style="width: ${percentual}%"></div>
        </div>
        <span class="percentual">${percentual}%</span>
      </div>
    `
    })
    .join('')
}

// Setup form
function setupForm() {
  votacaoForm.addEventListener('submit', handleSubmit)
  tipoSelect.addEventListener('change', handleTipoChange)
}

// Handle tipo change
function handleTipoChange() {
  if (tipoSelect.value === 'multipla-escolha') {
    opcoesContainer.style.display = 'block'
  } else {
    opcoesContainer.style.display = 'none'
  }
}

// Add option
window.addOpcao = function () {
  const opcaoItem = document.createElement('div')
  opcaoItem.className = 'opcao-item'
  opcaoItem.innerHTML = `
    <input type="text" class="form-input opcao-input" placeholder="Nova opção" required>
    <button type="button" class="btn-remove-opcao" onclick="removeOpcao(this)">❌</button>
  `
  opcoesList.appendChild(opcaoItem)
}

// Remove option
window.removeOpcao = function (button) {
  button.parentElement.remove()
}

// Setup vote forms
function setupVoteForms() {
  const voteForms = document.querySelectorAll('.voto-form')
  voteForms.forEach(form => {
    form.addEventListener('submit', handleVote)
  })
}

// Handle vote submission
async function handleVote(event) {
  event.preventDefault()

  try {
    const form = event.target
    const votacaoId = form.dataset.votacaoId
    const voto = form.querySelector('input[name="voto"]:checked').value

    // Save vote to Firestore
    await db.collection('votos').add({
      votacaoId,
      usuarioId: currentUser.uid,
      usuarioNome: currentUser.nome,
      voto,
      dataVoto: new Date().toISOString()
    })

    console.log('✅ Voto registrado com sucesso!')
    alert('✅ Voto registrado com sucesso!')

    // Reload votings
    await loadVotacoes()
  } catch (error) {
    console.error('Erro ao registrar voto:', error)
    alert('❌ Erro ao registrar voto. Tente novamente.')
  }
}

// Check if user has voted
function hasVoted(votacaoId) {
  // This would need to be implemented with actual vote checking
  // For now, return false to allow voting
  return false
}

// Handle form submission
async function handleSubmit(event) {
  event.preventDefault()

  try {
    // Get form data
    const formData = new FormData(votacaoForm)
    const titulo = formData.get('titulo').trim()
    const descricao = formData.get('descricao').trim()
    const dataFim = formData.get('data-fim')
    const tipo = formData.get('tipo')

    // Validate
    if (!titulo || !descricao || !dataFim || !tipo) {
      alert('Por favor, preencha todos os campos obrigatórios.')
      return
    }

    // Get options for multiple choice
    let opcoes = []
    if (tipo === 'multipla-escolha') {
      const opcaoInputs = document.querySelectorAll('.opcao-input')
      opcoes = Array.from(opcaoInputs)
        .map(input => input.value.trim())
        .filter(value => value)

      if (opcoes.length < 2) {
        alert('Adicione pelo menos 2 opções para votação múltipla escolha.')
        return
      }
    }

    // Show loading
    btnCriar.classList.add('loading')

    // Create voting
    const votacaoData = {
      titulo,
      descricao,
      dataFim: new Date(dataFim).toISOString(),
      tipo,
      opcoes: tipo === 'multipla-escolha' ? opcoes : ['sim', 'nao'],
      autor: currentUser.nome,
      dataCriacao: new Date().toISOString(),
      status: 'ativa',
      resultados: {}
    }

    // Save to Firestore
    await db.collection('votacoes').add(votacaoData)

    console.log('✅ Votação criada com sucesso!')
    alert('✅ Votação criada com sucesso!')

    // Reset form
    votacaoForm.reset()
    opcoesContainer.style.display = 'none'
    opcoesList.innerHTML = `
      <div class="opcao-item">
        <input type="text" class="form-input opcao-input" placeholder="Opção 1" required>
        <button type="button" class="btn-remove-opcao" onclick="removeOpcao(this)">❌</button>
      </div>
    `

    // Reload votings
    await loadVotacoes()
  } catch (error) {
    console.error('Erro ao criar votação:', error)
    alert('❌ Erro ao criar votação. Tente novamente.')
  } finally {
    btnCriar.classList.remove('loading')
  }
}

// View results
window.viewResultados = function (votacaoId) {
  const votacao = [...activeVotacoes, ...pastVotacoes].find(
    v => v.id === votacaoId
  )
  if (!votacao) return

  const results = renderResultados(votacao)
  const details = `
    📊 Resultados da Votação
    
    ${votacao.titulo}
    
    ${results}
  `

  alert(details)
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
  console.log('🚀 Votações inicializando...')
  initVotacoes()
})
