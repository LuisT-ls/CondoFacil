// Exemplo de uso do módulo de registro
import {
  registerUser,
  validateRegistrationData,
  getUserData
} from './register.js'

// Exemplo de como usar a função registerUser
async function exemploRegistro() {
  try {
    console.log('📝 Exemplo de registro de usuário')

    // Dados do usuário
    const nome = 'João Silva'
    const email = 'joao.silva@exemplo.com'
    const senha = 'senha123456'
    const papel = 'sindico'

    // Registrar usuário
    const resultado = await registerUser(nome, email, senha, papel)

    if (resultado.success) {
      console.log('✅ Usuário registrado com sucesso!')
      console.log('👤 Dados do usuário:', resultado.user)

      // Buscar dados do usuário no Firestore
      const userData = await getUserData(resultado.user.uid)
      console.log('📊 Dados do Firestore:', userData)
    } else {
      console.error('❌ Erro no registro:', resultado.error)
    }
  } catch (error) {
    console.error('❌ Erro no exemplo:', error)
  }
}

// Exemplo de validação de dados
function exemploValidacao() {
  console.log('🔍 Exemplo de validação de dados')

  const dadosValidos = {
    nome: 'Maria Santos',
    email: 'maria@exemplo.com',
    senha: 'senha123456',
    papel: 'morador'
  }

  const dadosInvalidos = {
    nome: 'Jo',
    email: 'email-invalido',
    senha: '123',
    papel: 'admin'
  }

  // Validar dados válidos
  const validacao1 = validateRegistrationData(dadosValidos)
  console.log('✅ Dados válidos:', validacao1)

  // Validar dados inválidos
  const validacao2 = validateRegistrationData(dadosInvalidos)
  console.log('❌ Dados inválidos:', validacao2)
}

// Executar exemplos
if (typeof window !== 'undefined') {
  // Se estiver no navegador, adicionar ao window para teste
  window.exemploRegistro = exemploRegistro
  window.exemploValidacao = exemploValidacao

  console.log('🚀 Módulo de registro carregado!')
  console.log('💡 Use window.exemploRegistro() para testar o registro')
  console.log('💡 Use window.exemploValidacao() para testar a validação')
}

export { exemploRegistro, exemploValidacao }
