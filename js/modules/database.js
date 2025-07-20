// Módulo de Banco de Dados (Firestore)
import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore-compat.js'
import { db } from './firebase-config.js'

class DatabaseService {
  constructor() {
    this.collections = {
      moradores: 'moradores',
      comunicacoes: 'comunicacoes',
      reservas: 'reservas',
      areas: 'areas',
      notificacoes: 'notificacoes'
    }
  }

  // ===== OPERAÇÕES CRUD BÁSICAS =====

  // Criar documento
  async create(collectionName, data) {
    try {
      const docRef = await addDoc(collection(db, collectionName), {
        ...data,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      console.log(`✅ Documento criado em ${collectionName}:`, docRef.id)
      return { success: true, id: docRef.id }
    } catch (error) {
      console.error(`❌ Erro ao criar documento em ${collectionName}:`, error)
      return { success: false, error: error.message }
    }
  }

  // Buscar documento por ID
  async getById(collectionName, id) {
    try {
      const docRef = doc(db, collectionName, id)
      const docSnap = await getDoc(docRef)

      if (docSnap.exists()) {
        return { success: true, data: { id: docSnap.id, ...docSnap.data() } }
      } else {
        return { success: false, error: 'Documento não encontrado' }
      }
    } catch (error) {
      console.error(`❌ Erro ao buscar documento em ${collectionName}:`, error)
      return { success: false, error: error.message }
    }
  }

  // Buscar todos os documentos
  async getAll(collectionName, options = {}) {
    try {
      let q = collection(db, collectionName)

      // Aplicar filtros
      if (options.where) {
        q = query(
          q,
          where(
            options.where.field,
            options.where.operator,
            options.where.value
          )
        )
      }

      // Aplicar ordenação
      if (options.orderBy) {
        q = query(
          q,
          orderBy(options.orderBy.field, options.orderBy.direction || 'asc')
        )
      }

      // Aplicar limite
      if (options.limit) {
        q = query(q, limit(options.limit))
      }

      const querySnapshot = await getDocs(q)
      const documents = []

      querySnapshot.forEach(doc => {
        documents.push({ id: doc.id, ...doc.data() })
      })

      return { success: true, data: documents }
    } catch (error) {
      console.error(`❌ Erro ao buscar documentos em ${collectionName}:`, error)
      return { success: false, error: error.message }
    }
  }

  // Atualizar documento
  async update(collectionName, id, data) {
    try {
      const docRef = doc(db, collectionName, id)
      await updateDoc(docRef, {
        ...data,
        updatedAt: new Date()
      })
      console.log(`✅ Documento atualizado em ${collectionName}:`, id)
      return { success: true }
    } catch (error) {
      console.error(
        `❌ Erro ao atualizar documento em ${collectionName}:`,
        error
      )
      return { success: false, error: error.message }
    }
  }

  // Deletar documento
  async delete(collectionName, id) {
    try {
      const docRef = doc(db, collectionName, id)
      await deleteDoc(docRef)
      console.log(`✅ Documento deletado em ${collectionName}:`, id)
      return { success: true }
    } catch (error) {
      console.error(`❌ Erro ao deletar documento em ${collectionName}:`, error)
      return { success: false, error: error.message }
    }
  }

  // ===== OPERAÇÕES ESPECÍFICAS DO CONDOMÍNIO =====

  // Adicionar morador
  async addMorador(moradorData) {
    return await this.create(this.collections.moradores, {
      ...moradorData,
      status: 'ativo',
      tipo: 'morador'
    })
  }

  // Buscar moradores
  async getMoradores() {
    return await this.getAll(this.collections.moradores, {
      orderBy: { field: 'nome', direction: 'asc' }
    })
  }

  // Adicionar comunicação
  async addComunicacao(comunicacaoData) {
    return await this.create(this.collections.comunicacoes, {
      ...comunicacaoData,
      status: 'ativo',
      visualizada: false
    })
  }

  // Buscar comunicações
  async getComunicacoes() {
    return await this.getAll(this.collections.comunicacoes, {
      orderBy: { field: 'createdAt', direction: 'desc' }
    })
  }

  // Adicionar reserva
  async addReserva(reservaData) {
    return await this.create(this.collections.reservas, {
      ...reservaData,
      status: 'pendente',
      confirmada: false
    })
  }

  // Buscar reservas
  async getReservas() {
    return await this.getAll(this.collections.reservas, {
      orderBy: { field: 'data', direction: 'asc' }
    })
  }

  // ===== LISTENERS EM TEMPO REAL =====

  // Listener para mudanças em tempo real
  subscribeToCollection(collectionName, callback, options = {}) {
    let q = collection(db, collectionName)

    if (options.where) {
      q = query(
        q,
        where(options.where.field, options.where.operator, options.where.value)
      )
    }

    if (options.orderBy) {
      q = query(
        q,
        orderBy(options.orderBy.field, options.orderBy.direction || 'asc')
      )
    }

    return onSnapshot(q, snapshot => {
      const documents = []
      snapshot.forEach(doc => {
        documents.push({ id: doc.id, ...doc.data() })
      })
      callback(documents)
    })
  }

  // Listener para comunicações em tempo real
  subscribeToComunicacoes(callback) {
    return this.subscribeToCollection(this.collections.comunicacoes, callback, {
      orderBy: { field: 'createdAt', direction: 'desc' }
    })
  }

  // Listener para reservas em tempo real
  subscribeToReservas(callback) {
    return this.subscribeToCollection(this.collections.reservas, callback, {
      orderBy: { field: 'data', direction: 'asc' }
    })
  }

  // ===== UTILITÁRIOS =====

  // Verificar se documento existe
  async documentExists(collectionName, id) {
    const result = await this.getById(collectionName, id)
    return result.success
  }

  // Contar documentos
  async countDocuments(collectionName, options = {}) {
    const result = await this.getAll(collectionName, options)
    return result.success ? result.data.length : 0
  }

  // Buscar por campo específico
  async findByField(collectionName, field, value) {
    return await this.getAll(collectionName, {
      where: { field, operator: '==', value }
    })
  }
}

// Criar instância global
const databaseService = new DatabaseService()

// Exportar para uso em outros módulos
export { databaseService }
export default databaseService
