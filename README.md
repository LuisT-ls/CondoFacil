# CondoFácil - Sistema de Gestão de Condomínios

Uma aplicação moderna para gestão de condomínios desenvolvida com **Firebase**, oferecendo funcionalidades completas para administração de condomínios.

## 🚀 Funcionalidades

- **Gestão de Moradores**: Cadastro e controle de moradores
- **Comunicações**: Sistema de avisos e notificações
- **Reservas**: Agendamento de áreas comuns
- **Financeiro**: Controle de taxas e despesas
- **Autenticação**: Sistema seguro de login
- **Tempo Real**: Dados sincronizados em tempo real

## 🛠️ Tecnologias Utilizadas

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Backend**: Firebase
- **Autenticação**: Firebase Auth
- **Banco de Dados**: Firestore
- **Storage**: Firebase Storage
- **Analytics**: Firebase Analytics

## 📦 Instalação

### Pré-requisitos

- Node.js (versão 14 ou superior)
- NPM ou Yarn

### Passos para Instalação

1. **Clone o repositório**

   ```bash
   git clone [URL_DO_REPOSITORIO]
   cd CondoFacil
   ```

2. **Instale as dependências**

   ```bash
   npm install
   ```

3. **Configure o Firebase**

   - O Firebase já está configurado com as credenciais fornecidas
   - As configurações estão em `js/modules/firebase-config.js`

4. **Inicie a aplicação**
   ```bash
   npm start
   ```

## 🎯 Como Usar

### Desenvolvimento Local

```bash
# Iniciar servidor de desenvolvimento
npm run dev

# Ou usar Python (se disponível)
npm start
```

### Estrutura do Projeto

```
CondoFacil/
├── assets/
│   ├── css/
│   │   └── main.css
│   └── img/
├── js/
│   ├── main.js
│   └── modules/
│       └── firebase-config.js
├── pages/
├── index.html
├── package.json
└── README.md
```

## 🔧 Configuração do Firebase

A aplicação já está configurada com o Firebase. As configurações incluem:

- **API Key**: `AIzaSyBKvc5DXCuHMjgc8VHR1L4GB9pMSldwOaM`
- **Project ID**: `condofacil-bf0cd`
- **Auth Domain**: `condofacil-bf0cd.firebaseapp.com`

### Serviços Firebase Configurados

- ✅ **Firebase App**: Aplicação principal
- ✅ **Firebase Analytics**: Análise de uso
- ✅ **Firebase Auth**: Autenticação de usuários
- ✅ **Firestore**: Banco de dados em tempo real
- ✅ **Firebase Storage**: Armazenamento de arquivos

## 📱 Funcionalidades Implementadas

### 1. Sistema de Autenticação

- Login/Logout de usuários
- Registro de novos usuários
- Recuperação de senha

### 2. Gestão de Moradores

- Cadastro de moradores
- Perfis de usuários
- Controle de acesso

### 3. Comunicações

- Sistema de avisos
- Notificações push
- Chat interno

### 4. Reservas

- Agendamento de áreas comuns
- Calendário de reservas
- Confirmações automáticas

## 🎨 Interface

A aplicação possui uma interface moderna e responsiva com:

- Design limpo e profissional
- Cores consistentes com a marca
- Animações suaves
- Layout responsivo para mobile
- Indicadores de status em tempo real

## 🔒 Segurança

- Autenticação segura com Firebase Auth
- Regras de segurança no Firestore
- Validação de dados no frontend
- HTTPS obrigatório em produção

## 📊 Analytics

O Firebase Analytics está configurado para:

- Rastrear uso da aplicação
- Monitorar performance
- Analisar comportamento dos usuários
- Gerar relatórios automáticos

## 🚀 Deploy

### Firebase Hosting

```bash
# Instalar Firebase CLI
npm install -g firebase-tools

# Login no Firebase
firebase login

# Inicializar projeto
firebase init hosting

# Deploy
firebase deploy
```

### Outras Opções

- **Netlify**: Conecte seu repositório GitHub
- **Vercel**: Deploy automático
- **GitHub Pages**: Para projetos estáticos

## 🤝 Contribuição

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📝 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

## 📞 Suporte

Para suporte, envie um email para [seu-email@exemplo.com] ou abra uma issue no GitHub.

## 🔧 Módulos Principais

### Autenticação e Registro

- **`js/modules/auth.js`** - Sistema de autenticação completo
- **`js/modules/register.js`** - Registro de usuários com Firebase Auth + Firestore
- **`js/modules/database.js`** - Operações CRUD no Firestore
- **`js/modules/firebase-config.js`** - Configuração do Firebase

### Funcionalidades

- **`js/cadastro.js`** - Gerenciamento do formulário de cadastro
- **`js/login.js`** - Gerenciamento do formulário de login
- **`js/main.js`** - Aplicação principal

## 📝 API do Módulo de Registro

### `registerUser(nome, email, senha, papel)`

Registra um novo usuário no Firebase Auth e salva dados no Firestore.

**Parâmetros:**

- `nome` (string) - Nome completo do usuário
- `email` (string) - Email do usuário
- `senha` (string) - Senha do usuário (mínimo 6 caracteres)
- `papel` (string) - Papel do usuário ('sindico' ou 'morador')

**Retorna:**

```javascript
{
  success: boolean,
  user?: {
    uid: string,
    email: string,
    displayName: string,
    nome: string,
    papel: string,
    condominioId: null,
    dataCadastro: Date,
    status: string
  },
  error?: string
}
```

**Exemplo de uso:**

```javascript
import { registerUser } from './js/modules/register.js'

const resultado = await registerUser(
  'João Silva',
  'joao@exemplo.com',
  'senha123456',
  'sindico'
)

if (resultado.success) {
  console.log('Usuário registrado:', resultado.user)
} else {
  console.error('Erro:', resultado.error)
}
```

### Estrutura no Firestore

```javascript
{
  nome: "João Silva",
  email: "joao@exemplo.com",
  papel: "sindico",
  condominioId: null,
  dataCadastro: Timestamp,
  status: "ativo",
  uid: "firebase-auth-uid"
}
```

## 🎯 Roadmap

- [ ] Sistema de pagamentos
- [ ] App mobile (React Native)
- [ ] Integração com WhatsApp
- [ ] Relatórios avançados
- [ ] Módulo de manutenção

---

**CondoFácil** - Simplificando a gestão de condomínios com tecnologia moderna! 🏢✨
