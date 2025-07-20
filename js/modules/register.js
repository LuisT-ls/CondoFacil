// Módulo de Registro de Usuários
import {
  createUserWithEmailAndPassword,
  updateProfile
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth-compat.js'
import {
  doc,
  setDoc,
  getDoc
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore-compat.js'
import { auth, db } from './firebase-config.js'

/**
 * Registra um novo usuário no Firebase Auth e salva dados no Firestore
 * @param {string} nome - Nome completo do usuário
 * @param {string} email - Email do usuário
 * @param {string} senha - Senha do usuário
 * @param {string} papel - Papel do usuário ('sindico' ou 'morador')
 * @returns {Promise<{success: boolean, user?: any, error?: string}>}
 */
export async function registerUser(nome, email, senha, papel) {
  try {
    console.log('🚀 Iniciando registro de usuário:', { nome, email, papel })

    // 1. Criar usuário no Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      senha
    )
    const user = userCredential.user

    console.log('✅ Usuário criado no Firebase Auth:', user.uid)

    // 2. Atualizar perfil do usuário com o nome
    await updateProfile(user, {
      displayName: nome
    })

    console.log('✅ Perfil do usuário atualizado com nome')

    // 3. Salvar dados adicionais no Firestore
    const userData = {
      nome: nome,
      email: email,
      papel: papel,
      condominioId: null,
      dataCadastro: new Date(),
      status: 'ativo',
      uid: user.uid
    }

    // Usar setDoc para criar o documento com o UID do usuário como ID
    await setDoc(doc(db, 'usuarios', user.uid), userData)

    console.log('✅ Dados do usuário salvos no Firestore')

    return {
      success: true,
      user: {
        uid: user.uid,
        email: user.email,
        displayName: nome,
        ...userData
      }
    }
  } catch (error) {
    console.error('❌ Erro no registro:', error)

    // Traduzir mensagens de erro para português
    const errorMessage = getErrorMessage(error.code)

    return {
      success: false,
      error: errorMessage
    }
  }
}

/**
 * Registra um usuário que fez login com Google
 * @param {Object} user - Objeto do usuário do Firebase Auth
 * @param {string} papel - Papel do usuário ('sindico' ou 'morador')
 * @returns {Promise<{success: boolean, user?: any, error?: string}>}
 */
export async function registerGoogleUser(user, papel) {
  try {
    console.log('🚀 Iniciando registro de usuário Google:', {
      nome: user.displayName,
      email: user.email,
      papel
    })

    // Verificar se o usuário já existe no Firestore
    const existingUser = await getUserData(user.uid)

    if (existingUser) {
      console.log('✅ Usuário Google já existe no Firestore')
      return {
        success: true,
        user: {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          ...existingUser
        }
      }
    }

    // Salvar dados do usuário Google no Firestore
    const userData = {
      nome: user.displayName || user.email,
      email: user.email,
      papel: papel,
      condominioId: null,
      dataCadastro: new Date(),
      status: 'ativo',
      uid: user.uid
    }

    await setDoc(doc(db, 'usuarios', user.uid), userData)

    console.log('✅ Dados do usuário Google salvos no Firestore')

    return {
      success: true,
      user: {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        ...userData
      }
    }
  } catch (error) {
    console.error('❌ Erro no registro do usuário Google:', error)

    const errorMessage = getErrorMessage(error.code)

    return {
      success: false,
      error: errorMessage
    }
  }
}

/**
 * Traduz códigos de erro do Firebase para português
 * @param {string} errorCode - Código de erro do Firebase
 * @returns {string} - Mensagem de erro traduzida
 */
function getErrorMessage(errorCode) {
  const errorMessages = {
    'auth/email-already-in-use':
      'Este email já está sendo usado por outra conta.',
    'auth/invalid-email': 'O formato do email é inválido.',
    'auth/operation-not-allowed':
      'O registro com email e senha não está habilitado.',
    'auth/weak-password': 'A senha deve ter pelo menos 6 caracteres.',
    'auth/user-disabled': 'Esta conta foi desabilitada.',
    'auth/user-not-found': 'Usuário não encontrado.',
    'auth/wrong-password': 'Senha incorreta.',
    'auth/too-many-requests': 'Muitas tentativas. Tente novamente mais tarde.',
    'auth/network-request-failed': 'Erro de conexão. Verifique sua internet.',
    'permission-denied': 'Permissão negada para acessar o banco de dados.',
    unavailable: 'Serviço temporariamente indisponível.',
    unauthenticated: 'Usuário não autenticado.'
  }

  return errorMessages[errorCode] || `Erro desconhecido: ${errorCode}`
}

/**
 * Verifica se um email já está em uso
 * @param {string} email - Email a ser verificado
 * @returns {Promise<boolean>} - true se o email está em uso
 */
export async function checkEmailExists(email) {
  try {
    // Tentar criar um usuário temporário para verificar se o email existe
    // Esta é uma abordagem alternativa, pois o Firebase não fornece uma API direta para verificar emails
    const tempUser = await createUserWithEmailAndPassword(
      auth,
      email,
      'tempPassword123!'
    )

    // Se chegou aqui, o email não estava em uso, então deletar o usuário temporário
    await tempUser.user.delete()

    return false
  } catch (error) {
    if (error.code === 'auth/email-already-in-use') {
      return true
    }
    // Para outros erros, assumir que o email não está em uso
    return false
  }
}

/**
 * Valida os dados do formulário de registro
 * @param {Object} formData - Dados do formulário
 * @returns {Object} - Resultado da validação
 */
export function validateRegistrationData(formData) {
  const errors = {}

  // Validar nome
  if (!formData.nome || formData.nome.trim().length < 3) {
    errors.nome = 'Nome deve ter pelo menos 3 caracteres'
  }

  // Validar email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!formData.email || !emailRegex.test(formData.email)) {
    errors.email = 'Email inválido'
  }

  // Validar senha
  if (!formData.senha || formData.senha.length < 6) {
    errors.senha = 'Senha deve ter pelo menos 6 caracteres'
  }

  // Validar papel
  if (!formData.papel || !['sindico', 'morador'].includes(formData.papel)) {
    errors.papel = 'Papel deve ser "síndico" ou "morador"'
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  }
}

/**
 * Obtém dados do usuário do Firestore
 * @param {string} uid - UID do usuário
 * @returns {Promise<Object|null>} - Dados do usuário ou null se não encontrado
 */
export async function getUserData(uid) {
  try {
    const userDoc = await getDoc(doc(db, 'usuarios', uid))

    if (userDoc.exists()) {
      return {
        id: userDoc.id,
        ...userDoc.data()
      }
    }

    return null
  } catch (error) {
    console.error('❌ Erro ao buscar dados do usuário:', error)
    return null
  }
}

// Exportar função principal como default
export default registerUser
