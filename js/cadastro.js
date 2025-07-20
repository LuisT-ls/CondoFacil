// Importar módulos do Firebase
import { authService } from './modules/auth.js'
import { databaseService } from './modules/database.js'

// Classe para gerenciar o formulário de cadastro
class CadastroForm {
  constructor() {
    this.form = document.getElementById('cadastro-form')
    this.submitButton = document.getElementById('btn-cadastrar')
    this.isSubmitting = false

    this.init()
  }

  init() {
    if (this.form) {
      this.setupEventListeners()
      this.setupValidation()
    }
  }

  // Configurar event listeners
  setupEventListeners() {
    this.form.addEventListener('submit', e => this.handleSubmit(e))

    // Validação em tempo real
    const inputs = this.form.querySelectorAll('input, select')
    inputs.forEach(input => {
      input.addEventListener('blur', () => this.validateField(input))
      input.addEventListener('input', () => this.clearFieldError(input))
    })
  }

  // Configurar validação
  setupValidation() {
    // Validação customizada para campos específicos
    const senhaInput = document.getElementById('senha')
    const confirmarSenhaInput = document.getElementById('confirmar-senha')

    if (senhaInput && confirmarSenhaInput) {
      confirmarSenhaInput.addEventListener('input', () => {
        this.validatePasswordMatch()
      })
    }
  }

  // Manipular envio do formulário
  async handleSubmit(e) {
    e.preventDefault()

    if (this.isSubmitting) return

    // Validar todos os campos
    const isValid = this.validateAllFields()
    if (!isValid) {
      this.showNotification(
        'Por favor, corrija os erros no formulário.',
        'error'
      )
      return
    }

    this.setSubmittingState(true)

    try {
      const formData = this.getFormData()
      const result = await this.registerUser(formData)

      if (result.success) {
        this.showNotification('Cadastro realizado com sucesso!', 'success')
        this.form.reset()

        // Redirecionar após 2 segundos
        setTimeout(() => {
          window.location.href = 'index.html'
        }, 2000)
      } else {
        this.showNotification(result.error, 'error')
      }
    } catch (error) {
      console.error('Erro no cadastro:', error)
      this.showNotification('Erro inesperado. Tente novamente.', 'error')
    } finally {
      this.setSubmittingState(false)
    }
  }

  // Registrar usuário
  async registerUser(formData) {
    try {
      // Registrar no Firebase Auth
      const authResult = await authService.register(
        formData.email,
        formData.senha,
        formData.nome
      )

      if (!authResult.success) {
        return authResult
      }

      // Salvar dados adicionais no Firestore
      const userData = {
        nome: formData.nome,
        email: formData.email,
        papel: formData.papel,
        dataCadastro: new Date(),
        status: 'ativo'
      }

      const dbResult = await databaseService.create('usuarios', userData)

      if (dbResult.success) {
        console.log('✅ Usuário registrado com sucesso:', authResult.user.email)
        return { success: true, user: authResult.user }
      } else {
        // Se falhou no Firestore, deletar o usuário do Auth
        await authService.logout()
        return { success: false, error: 'Erro ao salvar dados do usuário.' }
      }
    } catch (error) {
      console.error('❌ Erro no registro:', error)
      return { success: false, error: error.message }
    }
  }

  // Obter dados do formulário
  getFormData() {
    const formData = new FormData(this.form)
    return {
      nome: formData.get('nome-completo'),
      email: formData.get('email'),
      senha: formData.get('senha'),
      confirmarSenha: formData.get('confirmar-senha'),
      papel: formData.get('papel-usuario')
    }
  }

  // Validar todos os campos
  validateAllFields() {
    const inputs = this.form.querySelectorAll('input, select')
    let isValid = true

    inputs.forEach(input => {
      if (!this.validateField(input)) {
        isValid = false
      }
    })

    return isValid
  }

  // Validar campo individual
  validateField(field) {
    const errorElement = document.getElementById(`${field.id}-error`)
    let isValid = true
    let errorMessage = ''

    // Validações específicas
    switch (field.id) {
      case 'nome-completo':
        if (!field.value.trim()) {
          errorMessage = 'Nome é obrigatório'
          isValid = false
        } else if (field.value.trim().length < 3) {
          errorMessage = 'Nome deve ter pelo menos 3 caracteres'
          isValid = false
        }
        break

      case 'email':
        if (!field.value.trim()) {
          errorMessage = 'E-mail é obrigatório'
          isValid = false
        } else if (!this.isValidEmail(field.value)) {
          errorMessage = 'E-mail inválido'
          isValid = false
        }
        break

      case 'senha':
        if (!field.value) {
          errorMessage = 'Senha é obrigatória'
          isValid = false
        } else if (field.value.length < 6) {
          errorMessage = 'Senha deve ter pelo menos 6 caracteres'
          isValid = false
        }
        break

      case 'confirmar-senha':
        const senha = document.getElementById('senha').value
        if (!field.value) {
          errorMessage = 'Confirme sua senha'
          isValid = false
        } else if (field.value !== senha) {
          errorMessage = 'Senhas não coincidem'
          isValid = false
        }
        break

      case 'papel-usuario':
        if (!field.value) {
          errorMessage = 'Selecione seu papel'
          isValid = false
        }
        break
    }

    // Atualizar UI
    this.updateFieldValidation(field, isValid, errorMessage)
    return isValid
  }

  // Validar correspondência de senhas
  validatePasswordMatch() {
    const senha = document.getElementById('senha')
    const confirmarSenha = document.getElementById('confirmar-senha')

    if (confirmarSenha.value && senha.value !== confirmarSenha.value) {
      this.updateFieldValidation(confirmarSenha, false, 'Senhas não coincidem')
    } else if (confirmarSenha.value) {
      this.updateFieldValidation(confirmarSenha, true, '')
    }
  }

  // Limpar erro do campo
  clearFieldError(field) {
    const errorElement = document.getElementById(`${field.id}-error`)
    if (errorElement) {
      errorElement.textContent = ''
      field.classList.remove('error')
    }
  }

  // Atualizar validação do campo
  updateFieldValidation(field, isValid, errorMessage) {
    const errorElement = document.getElementById(`${field.id}-error`)

    if (errorElement) {
      errorElement.textContent = errorMessage
    }

    if (isValid) {
      field.classList.remove('error')
      field.classList.add('valid')
    } else {
      field.classList.remove('valid')
      field.classList.add('error')
    }
  }

  // Validar formato de email
  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  // Definir estado de submissão
  setSubmittingState(submitting) {
    this.isSubmitting = submitting
    const btnText = this.submitButton.querySelector('.btn-text')
    const btnLoading = this.submitButton.querySelector('.btn-loading')

    if (submitting) {
      this.submitButton.disabled = true
      this.submitButton.classList.add('loading')
      btnText.style.display = 'none'
      btnLoading.style.display = 'flex'
    } else {
      this.submitButton.disabled = false
      this.submitButton.classList.remove('loading')
      btnText.style.display = 'block'
      btnLoading.style.display = 'none'
    }
  }

  // Mostrar notificação
  showNotification(message, type = 'info') {
    const notification = document.createElement('div')
    notification.className = `notification notification-${type}`
    notification.textContent = message

    document.body.appendChild(notification)

    setTimeout(() => {
      notification.remove()
    }, 5000)
  }
}

// Inicializar quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', () => {
  console.log('📝 Página de cadastro carregada')
  new CadastroForm()
})

// Exportar para uso em outros módulos
export { CadastroForm }
