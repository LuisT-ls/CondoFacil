// Firebase Configuração
import { initializeApp } from 'firebase/app'
import { getAnalytics } from 'firebase/analytics'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'

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
const app = initializeApp(firebaseConfig)

// Inicializar serviços
const analytics = getAnalytics(app)
const auth = getAuth(app)
const db = getFirestore(app)
const storage = getStorage(app)

// Exportar instâncias
export { app, analytics, auth, db, storage }
export default app
