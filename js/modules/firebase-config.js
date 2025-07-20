// Firebase Configuração
// Importar Firebase usando script tags no HTML, aqui apenas configurar

const firebaseConfig = {
  apiKey: 'AIzaSyBKvc5DXCuHMjgc8VHR1L4GB9pMSldwOaM',
  authDomain: 'condofacil-bf0cd.firebaseapp.com',
  projectId: 'condofacil-bf0cd',
  storageBucket: 'condofacil-bf0cd.firebasestorage.app',
  messagingSenderId: '297276256989',
  appId: '1:297276256989:web:e7314a23d464a289f96134',
  measurementId: 'G-M8X9WSKVS4'
}

// Inicializar Firebase
const app = firebase.initializeApp(firebaseConfig)

// Inicializar serviços
const auth = firebase.auth()
const db = firebase.firestore()
const storage = firebase.storage()

// Exportar instâncias
export { app, auth, db, storage }
export default app
