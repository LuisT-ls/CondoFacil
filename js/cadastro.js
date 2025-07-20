// Importar a função registerUser do módulo register.js
import { registerUser } from './modules/register.js'

// Selecionar o formulário da página cadastro.html
const form = document.getElementById('cadastro-form')

// Adicionar event listener para submit
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
