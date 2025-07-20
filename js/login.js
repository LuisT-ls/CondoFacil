// Importar módulos do Firebase
import { authService } from './modules/auth.js'

// Classe para gerenciar o formulário de login
class LoginForm {
  constructor() {
    this.form = document.getElementById('login-form')
    this.submitButton = document.getElementById('btn-entrar')
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
    const inputs = this.form.querySelectorAll('input')
    inputs.forEach(input => {
      input.addEventListener('blur', () => this.validateField(input))
      input.addEventListener('input', () => this.clearFieldError(input))
    })
  }

  // Configurar validação
  setupValidation() {
    // Validação customizada para campos específicos
    const emailInput = document.getElementById('email-login')
    const senhaInput = document.getElementById('senha-login')

    if (emailInput && senhaInput) {
      // Validação de email em tempo real
      emailInput.addEventListener('input', () => {
        if (emailInput.value && !this.isValidEmail(emailInput.value)) {
          this.updateFieldValidation(emailInput, false, 'E-mail inválido')
        } else if (emailInput.value) {
          this.updateFieldValidation(emailInput, true, '')
        }
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
      const result = await this.loginUser(formData)

      if (result.success) {
        this.showNotification('Login realizado com sucesso!', 'success')

        // Redirecionar para dashboard após 1 segundo
        setTimeout(() => {
          window.location.href = 'dashboard.html'
        }, 1000)
      } else {
        // Mostrar alert com a mensagem de erro
        alert(`Erro no login: ${result.error}`)
        this.showNotification(result.error, 'error')
      }
    } catch (error) {
      console.error('Erro no login:', error)
      this.showNotification('Erro inesperado. Tente novamente.', 'error')
    } finally {
      this.setSubmittingState(false)
    }
  }

  // Fazer login do usuário
  async loginUser(formData) {
    try {
      const result = await authService.login(formData.email, formData.senha)

      if (result.success) {
        console.log('✅ Login realizado com sucesso:', result.user.email)
        return { success: true, user: result.user }
      } else {
        return { success: false, error: result.error }
      }
    } catch (error) {
      console.error('❌ Erro no login:', error)
      return { success: false, error: error.message }
    }
  }

  // Obter dados do formulário
  getFormData() {
    const formData = new FormData(this.form)
    return {
      email: formData.get('email'),
      senha: formData.get('senha')
    }
  }

  // Validar todos os campos
  validateAllFields() {
    const inputs = this.form.querySelectorAll('input')
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
      case 'email-login':
        if (!field.value.trim()) {
          errorMessage = 'E-mail é obrigatório'
          isValid = false
        } else if (!this.isValidEmail(field.value)) {
          errorMessage = 'E-mail inválido'
          isValid = false
        }
        break

      case 'senha-login':
        if (!field.value) {
          errorMessage = 'Senha é obrigatória'
          isValid = false
        }
        break
    }

    // Atualizar UI
    this.updateFieldValidation(field, isValid, errorMessage)
    return isValid
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
  console.log('🔐 Página de login carregada')
  new LoginForm()
})

// Exportar para uso em outros módulos
export { LoginForm }
