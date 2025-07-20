// Importar funções dos módulos
import { registerUser, registerGoogleUser } from './modules/register.js'
import { authService } from './modules/auth.js'

// Selecionar elementos do DOM
const form = document.getElementById('cadastro-form')
const btnGoogle = document.getElementById('btn-google')

// Adicionar event listener para submit do formulário
form.addEventListener('submit', async event => {
  // Impedir o comportamento padrão
  event.preventDefault()

  // Obter os valores dos campos
  const nome = document.getElementById('nome-completo').value
  const email = document.getElementById('email').value
  const senha = document.getElementById('senha').value
  const papel = document.getElementById('papel-usuario').value

  try {
    // Chamar registerUser com os valores obtidos
    const resultado = await registerUser(nome, email, senha, papel)

    if (resultado.success) {
      alert('Cadastro realizado com sucesso!')
      // Redirecionar para dashboard
      window.location.href = 'dashboard.html'
    } else {
      alert(`Erro no cadastro: ${resultado.error}`)
    }
  } catch (error) {
    console.error('Erro:', error)
    alert('Erro inesperado. Tente novamente.')
  }
})

// Adicionar event listener para botão do Google
btnGoogle.addEventListener('click', async () => {
  try {
    // Fazer login com Google
    const resultado = await authService.loginWithGoogle()

    if (resultado.success) {
      // Mostrar modal para selecionar papel
      const papel = await showPapelSelectionModal()

      if (papel) {
        // Registrar usuário Google no Firestore
        const registroResultado = await registerGoogleUser(
          resultado.user,
          papel
        )

        if (registroResultado.success) {
          alert('Cadastro com Google realizado com sucesso!')
          window.location.href = 'dashboard.html'
        } else {
          alert(`Erro no registro: ${registroResultado.error}`)
        }
      }
    } else {
      alert(`Erro no login com Google: ${resultado.error}`)
    }
  } catch (error) {
    console.error('Erro no login com Google:', error)
    alert('Erro inesperado. Tente novamente.')
  }
})

// Função para mostrar modal de seleção de papel
function showPapelSelectionModal() {
  return new Promise(resolve => {
    // Criar modal
    const modal = document.createElement('div')
    modal.className = 'modal-overlay'
    modal.innerHTML = `
      <div class="modal-content">
        <h3>Selecione seu papel</h3>
        <p>Escolha como você se relaciona com o condomínio:</p>
        <div class="papel-options">
          <button class="papel-btn" data-papel="sindico">
            <span class="papel-icon">👨‍💼</span>
            <span class="papel-text">
              <strong>Síndico</strong>
              <small>Administra o condomínio</small>
            </span>
          </button>
          <button class="papel-btn" data-papel="morador">
            <span class="papel-icon">🏠</span>
            <span class="papel-text">
              <strong>Morador</strong>
              <small>Reside no condomínio</small>
            </span>
          </button>
        </div>
      </div>
    `

    // Adicionar ao DOM
    document.body.appendChild(modal)

    // Adicionar event listeners aos botões
    const botoes = modal.querySelectorAll('.papel-btn')
    botoes.forEach(botao => {
      botao.addEventListener('click', () => {
        const papel = botao.dataset.papel
        document.body.removeChild(modal)
        resolve(papel)
      })
    })

    // Fechar modal ao clicar fora
    modal.addEventListener('click', e => {
      if (e.target === modal) {
        document.body.removeChild(modal)
        resolve(null)
      }
    })
  })
}
