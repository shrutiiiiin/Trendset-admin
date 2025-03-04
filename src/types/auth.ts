export interface User {
    email: string;
    adminId: string;
  }
  
  export interface AuthStore {
    user: User | null;
    loading: boolean;
    error: string | null;
    login: (email: string, password: string) => Promise<boolean>;
    logout: () => void;
    clearError: () => void;
    initializeFromStorage: () => Promise<boolean>; 
  }