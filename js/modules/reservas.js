// Reservas Management Module
import { db } from './firebase-config.js'
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  doc,
  getDoc
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore-compat.js'

/**
 * Creates a new reservation in Firestore
 * @param {string} dataCompleta - Full date and time (e.g., "2025-07-20T19:00")
 * @param {string} local - Location name
 * @param {string} usuarioId - User ID
 * @param {string} condominioId - Condominium ID
 * @returns {Promise<string>} Document ID of the created reservation
 */
export async function criarReserva(
  dataCompleta,
  local,
  usuarioId,
  condominioId
) {
  try {
    // Check if condominium exists
    const condominioRef = doc(db, 'condominios', condominioId)
    const condominioDoc = await getDoc(condominioRef)

    if (!condominioDoc.exists()) {
      throw new Error('Condomínio não encontrado')
    }

    // Create reservation document
    const reservaData = {
      dataCompleta: dataCompleta,
      local: local,
      usuarioId: usuarioId,
      status: 'pendente',
      dataCriacao: new Date().toISOString(),
      dataAtualizacao: new Date().toISOString()
    }

    const reservasRef = collection(db, 'condominios', condominioId, 'reservas')
    const docRef = await addDoc(reservasRef, reservaData)

    console.log('✅ Reserva criada com sucesso:', docRef.id)
    return docRef.id
  } catch (error) {
    console.error('❌ Erro ao criar reserva:', error)
    throw error
  }
}

/**
 * Lists all reservations for a condominium
 * @param {string} condominioId - Condominium ID
 * @returns {Promise<Array>} Array of reservation objects
 */
export async function listarReservas(condominioId) {
  try {
    // Check if condominium exists
    const condominioRef = doc(db, 'condominios', condominioId)
    const condominioDoc = await getDoc(condominioRef)

    if (!condominioDoc.exists()) {
      throw new Error('Condomínio não encontrado')
    }

    // Get reservations collection
    const reservasRef = collection(db, 'condominios', condominioId, 'reservas')

    // Create query to order by date
    const q = query(reservasRef, orderBy('dataCompleta', 'asc'))

    const querySnapshot = await getDocs(q)
    const reservas = []

    querySnapshot.forEach(doc => {
      reservas.push({
        id: doc.id,
        ...doc.data()
      })
    })

    console.log(`✅ ${reservas.length} reservas encontradas`)
    return reservas
  } catch (error) {
    console.error('❌ Erro ao listar reservas:', error)
    throw error
  }
}

/**
 * Lists reservations for a specific user
 * @param {string} condominioId - Condominium ID
 * @param {string} usuarioId - User ID
 * @returns {Promise<Array>} Array of user's reservation objects
 */
export async function listarReservasUsuario(condominioId, usuarioId) {
  try {
    // Check if condominium exists
    const condominioRef = doc(db, 'condominios', condominioId)
    const condominioDoc = await getDoc(condominioRef)

    if (!condominioDoc.exists()) {
      throw new Error('Condomínio não encontrado')
    }

    // Get reservations collection
    const reservasRef = collection(db, 'condominios', condominioId, 'reservas')

    // Create query to filter by user and order by date
    const q = query(
      reservasRef,
      where('usuarioId', '==', usuarioId),
      orderBy('dataCompleta', 'asc')
    )

    const querySnapshot = await getDocs(q)
    const reservas = []

    querySnapshot.forEach(doc => {
      reservas.push({
        id: doc.id,
        ...doc.data()
      })
    })

    console.log(`✅ ${reservas.length} reservas do usuário encontradas`)
    return reservas
  } catch (error) {
    console.error('❌ Erro ao listar reservas do usuário:', error)
    throw error
  }
}

/**
 * Checks for conflicts in reservations for the same location and date/time
 * @param {string} dataCompleta - Full date and time (e.g., "2025-07-20T19:00")
 * @param {string} local - Location name
 * @param {string} condominioId - Condominium ID
 * @param {string} excludeReservaId - Reservation ID to exclude from check (for updates)
 * @returns {Promise<boolean>} True if there's a conflict
 */
export async function verificarConflito(
  dataCompleta,
  local,
  condominioId,
  excludeReservaId = null
) {
  try {
    // Check if condominium exists
    const condominioRef = doc(db, 'condominios', condominioId)
    const condominioDoc = await getDoc(condominioRef)

    if (!condominioDoc.exists()) {
      throw new Error('Condomínio não encontrado')
    }

    // Get reservations collection
    const reservasRef = collection(db, 'condominios', condominioId, 'reservas')

    // Create query to check for conflicts
    const q = query(
      reservasRef,
      where('local', '==', local),
      where('dataCompleta', '==', dataCompleta),
      where('status', 'in', ['pendente', 'aprovada'])
    )

    const querySnapshot = await getDocs(q)
    let conflito = false

    querySnapshot.forEach(doc => {
      // Skip the reservation being updated (if provided)
      if (excludeReservaId && doc.id === excludeReservaId) {
        return
      }

      // Check if there's a conflict
      if (
        doc.data().status === 'pendente' ||
        doc.data().status === 'aprovada'
      ) {
        conflito = true
      }
    })

    if (conflito) {
      console.log('⚠️ Conflito de reserva detectado')
    } else {
      console.log('✅ Nenhum conflito encontrado')
    }

    return conflito
  } catch (error) {
    console.error('❌ Erro ao verificar conflito:', error)
    throw error
  }
}

/**
 * Gets a specific reservation by ID
 * @param {string} condominioId - Condominium ID
 * @param {string} reservaId - Reservation ID
 * @returns {Promise<Object|null>} Reservation object or null if not found
 */
export async function obterReserva(condominioId, reservaId) {
  try {
    const reservaRef = doc(
      db,
      'condominios',
      condominioId,
      'reservas',
      reservaId
    )
    const reservaDoc = await getDoc(reservaRef)

    if (reservaDoc.exists()) {
      return {
        id: reservaDoc.id,
        ...reservaDoc.data()
      }
    } else {
      return null
    }
  } catch (error) {
    console.error('❌ Erro ao obter reserva:', error)
    throw error
  }
}

/**
 * Formats date for display
 * @param {string} dataCompleta - Full date and time string
 * @returns {string} Formatted date string
 */
export function formatarData(dataCompleta) {
  try {
    const data = new Date(dataCompleta)
    return data.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch (error) {
    console.error('Erro ao formatar data:', error)
    return dataCompleta
  }
}

/**
 * Gets location display name
 * @param {string} localValue - Location value from select
 * @returns {string} Display name for location
 */
export function getLocalDisplayName(localValue) {
  const locais = {
    'salao-festas': 'Salão de Festas',
    churrasqueira: 'Churrasqueira',
    quadra: 'Quadra',
    piscina: 'Piscina',
    academia: 'Academia',
    'salao-jogos': 'Salão de Jogos'
  }

  return locais[localValue] || localValue
}
