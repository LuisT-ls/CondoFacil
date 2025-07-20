# CondoFácil - Sistema de Gestão de Condomínios

Sistema completo de gestão de condomínios desenvolvido com Firebase, oferecendo funcionalidades modernas para síndicos e moradores.

## 🚀 Funcionalidades

### 👥 Gestão de Usuários

- Cadastro e login com Firebase Auth
- Controle de acesso baseado em papéis (Síndico/Morador)
- Sistema de permissões granulares

### 📅 Reservas

- Agendamento de áreas comuns
- Aprovação/rejeição de reservas (Síndico)
- Visualização de minhas reservas (Morador)
- Detecção de conflitos

### 🗳️ Votações

- Criação de votações (Síndico)
- Votação em tempo real
- Resultados com gráficos
- Tipos: Sim/Não e Múltipla Escolha

### 📢 Comunicações

- Envio de comunicados (Síndico)
- Visualização de comunicados
- Sistema de notificações

### ⏰ Lembretes

- Criação de lembretes (Síndico)
- Visualização de lembretes
- Prioridades e tipos

## 🛠️ Tecnologias

- **Frontend**: HTML5, CSS3, JavaScript ES6+
- **Backend**: Firebase (Auth, Firestore, Storage)
- **Deploy**: Vercel
- **Autenticação**: Firebase Auth (Email/Password + Google)

## 📦 Instalação

### Pré-requisitos

- Node.js 16+
- Conta Firebase

### Passos

1. **Clone o repositório**

```bash
git clone https://github.com/seu-usuario/condofacil.git
cd condofacil
```

2. **Instale as dependências**

```bash
npm install
```

3. **Configure o Firebase**

   - Crie um projeto no Firebase Console
   - Ative Authentication e Firestore
   - Configure as regras de segurança
   - Adicione o domínio autorizado

4. **Execute localmente**

```bash
npm run dev
```

5. **Acesse**

```
http://localhost:8080
```

## 🚀 Deploy

### Vercel (Recomendado)

1. **Conecte com Vercel**

```bash
npm i -g vercel
vercel login
```

2. **Deploy**

```bash
vercel --prod
```

### Firebase Hosting

1. **Instale Firebase CLI**

```bash
npm i -g firebase-tools
```

2. **Configure**

```bash
firebase login
firebase init hosting
```

3. **Deploy**

```bash
firebase deploy
```

## 🔧 Configuração Firebase

### 1. Authentication

- Email/Password habilitado
- Google Sign-In habilitado
- Domínios autorizados configurados

### 2. Firestore

```javascript
// Regras de segurança básicas
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### 3. Storage

```javascript
// Regras de segurança básicas
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## 📁 Estrutura do Projeto

```
condofacil/
├── assets/
│   ├── css/
│   │   ├── main.css
│   │   └── modules/
│   └── img/
├── js/
│   ├── modules/
│   │   ├── firebase-config.js
│   │   ├── auth.js
│   │   ├── permissions.js
│   │   └── ...
│   ├── dashboard.js
│   ├── votacoes.js
│   └── ...
├── pages/
├── index.html
├── login.html
├── cadastro.html
├── dashboard.html
└── ...
```

## 🔐 Controle de Acesso

### Síndico

- ✅ Gerenciar reservas
- ✅ Criar votações
- ✅ Enviar comunicados
- ✅ Criar lembretes
- ✅ Visualizar relatórios

### Morador

- ✅ Fazer reservas
- ✅ Votar em votações
- ✅ Visualizar comunicados
- ✅ Ver lembretes
- ✅ Gerenciar reservas próprias

## 🐛 Troubleshooting

### Problemas Comuns

1. **Erro de CORS**

   - Configure domínios autorizados no Firebase
   - Verifique as regras de segurança

2. **Erro de Autenticação**

   - Verifique se o Firebase Auth está habilitado
   - Confirme as credenciais do projeto

3. **Erro de Firestore**
   - Verifique as regras de segurança
   - Confirme se o Firestore está habilitado

## 📄 Licença

MIT License - veja o arquivo [LICENSE](LICENSE) para detalhes.

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📞 Suporte

- **Email**: suporte@condofacil.com
- **Issues**: [GitHub Issues](https://github.com/seu-usuario/condofacil/issues)

---

Desenvolvido com ❤️ usando Firebase e Vercel
