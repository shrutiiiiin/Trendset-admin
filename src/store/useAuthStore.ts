import { create } from 'zustand'
import { 
  doc,
  getDoc
} from 'firebase/firestore'
import { db } from '../config/firebase'
import { AuthStore, User } from '../types/auth'

const STORAGE_KEY = 'auth_data'
const EXPIRATION_DAYS = 7

interface StoredAuthData {
  user: User;
  expiresAt: number;
}

const storeAuthData = (user: User) => {
  const expiresAt = Date.now() + (EXPIRATION_DAYS * 24 * 60 * 60 * 1000)
  
  const authData: StoredAuthData = {
    user,
    expiresAt
  }
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(authData))
}

const getStoredAuthData = (): StoredAuthData | null => {
  const storedData = localStorage.getItem(STORAGE_KEY)
  if (!storedData) return null
  
  try {
    const authData: StoredAuthData = JSON.parse(storedData)
    
    if (authData.expiresAt < Date.now()) {
      localStorage.removeItem(STORAGE_KEY)
      return null
    }
    
    return authData
  } catch (error) {
    console.error('Error parsing stored auth data:', error)
    localStorage.removeItem(STORAGE_KEY)
    return null
  }
}

const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  loading: false,
  error: null,

  initializeFromStorage: async () => {
    set({ loading: true })
    try {
      const storedData = getStoredAuthData()
      if (storedData?.user) {
        set({ user: storedData.user })
        return true
      }
    } catch (error) {
      console.error('Failed to initialize from storage:', error)
    } finally {
      set({ loading: false })
    }
    return false
  },

  login: async (email: string, password: string): Promise<boolean> => {
    set({ loading: true, error: null })
    try {
      const adminCredentialDoc = doc(db, 'admin', 'admin_credential')
      const adminCredentialSnapshot = await getDoc(adminCredentialDoc)

      if (!adminCredentialSnapshot.exists()) {
        throw new Error('Invalid credentials')
      }

      const credentials = adminCredentialSnapshot.data()

      if (credentials.email === email && credentials.password === password) {
        const user = {
          email: credentials.email,
          adminId: credentials.adminId
        }
        
        storeAuthData(user)
        set({ user, loading: false })
        return true
      } else {
        throw new Error('Invalid credentials')
      }

    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'An error occurred', 
        loading: false 
      })
      return false
    }
  },

  logout: () => {
    localStorage.removeItem(STORAGE_KEY)
    set({ user: null, error: null })
  },

  clearError: () => {
    set({ error: null })
  }
}))

export default useAuthStore