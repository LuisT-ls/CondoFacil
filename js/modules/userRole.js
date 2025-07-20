// User Role Management Module
import { auth, db } from './firebase-config.js'
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth-compat.js'
import {
  doc,
  getDoc
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore-compat.js'

/**
 * Gets user data from Firestore based on authentication state
 * @returns {Promise<Object|null>} User data object or null if not authenticated
 */
export async function getUserData() {
  return new Promise((resolve, reject) => {
    onAuthStateChanged(auth, async user => {
      if (user) {
        try {
          // User is signed in, get data from Firestore
          const userDoc = await getDoc(doc(db, 'usuarios', user.uid))

          if (userDoc.exists()) {
            const userData = userDoc.data()

            // Return user data object
            resolve({
              nome: userData.nome || user.displayName || 'Usuário',
              email: userData.email || user.email,
              papel: userData.papel || 'morador',
              condominioId: userData.condominioId || null
            })
          } else {
            // User exists in Auth but not in Firestore
            console.warn(
              'Usuário autenticado mas dados não encontrados no Firestore'
            )
            resolve({
              nome: user.displayName || 'Usuário',
              email: user.email,
              papel: 'morador',
              condominioId: null
            })
          }
        } catch (error) {
          console.error('Erro ao buscar dados do usuário:', error)
          reject(error)
        }
      } else {
        // User is not signed in, redirect to login
        console.log('Usuário não autenticado, redirecionando para login...')
        window.location.href = '/login.html'
        resolve(null)
      }
    })
  })
}

/**
 * Gets current user data synchronously (if already authenticated)
 * @returns {Object|null} Current user data or null
 */
export function getCurrentUserData() {
  const user = auth.currentUser

  if (!user) {
    return null
  }

  // Return basic auth data
  return {
    nome: user.displayName || 'Usuário',
    email: user.email,
    papel: 'morador', // Default role
    condominioId: null
  }
}

/**
 * Checks if user is authenticated
 * @returns {Promise<boolean>} True if authenticated, false otherwise
 */
export function isAuthenticated() {
  return new Promise(resolve => {
    onAuthStateChanged(auth, user => {
      resolve(!!user)
    })
  })
}

/**
 * Gets user role from Firestore
 * @param {string} uid - User ID
 * @returns {Promise<string>} User role ('sindico' or 'morador')
 */
export async function getUserRole(uid) {
  try {
    const userDoc = await getDoc(doc(db, 'usuarios', uid))

    if (userDoc.exists()) {
      const userData = userDoc.data()
      return userData.papel || 'morador'
    }

    return 'morador' // Default role
  } catch (error) {
    console.error('Erro ao buscar papel do usuário:', error)
    return 'morador' // Default role on error
  }
}

/**
 * Checks if user has specific role
 * @param {string} role - Role to check ('sindico' or 'morador')
 * @returns {Promise<boolean>} True if user has the role
 */
export async function hasRole(role) {
  const userData = await getUserData()
  return userData && userData.papel === role
}

/**
 * Checks if user is a síndico
 * @returns {Promise<boolean>} True if user is síndico
 */
export async function isSindico() {
  return await hasRole('sindico')
}

/**
 * Checks if user is a morador
 * @returns {Promise<boolean>} True if user is morador
 */
export async function isMorador() {
  return await hasRole('morador')
}
