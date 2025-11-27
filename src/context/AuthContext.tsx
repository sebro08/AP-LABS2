import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User as FirebaseUser, onAuthStateChanged, signOut } from 'firebase/auth';
import { auth, db } from '../firebase/config';
import { UserFirestore } from '../types/User';

interface AuthUser {
  uid: string;
  email: string;
  nombre: string;
  rol: string;
  rolId: string;
  cedula?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  logout: () => Promise<void>;
  setUserData: (userData: AuthUser) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      console.log('Auth state changed:', firebaseUser?.email);
      
      if (firebaseUser) {
        try {
          // Buscar datos del usuario en Firestore por email
          const { collection, query, where, getDocs } = await import('firebase/firestore');
          const usuariosRef = collection(db, 'usuarios');
          const q = query(usuariosRef, where('email', '==', firebaseUser.email));
          const querySnapshot = await getDocs(q);
          
          if (!querySnapshot.empty) {
            const userDoc = querySnapshot.docs[0];
            const userData = userDoc.data() as UserFirestore;
            
            console.log('Usuario encontrado en AuthContext:', userData);
            
            const nombreCompleto = [
              userData.primer_nombre,
              userData.segundo_nombre,
              userData.primer_apellido,
              userData.segundo_apellido
            ]
              .filter(Boolean)
              .join(' ')
              .trim() || 'Usuario';

            let rolNombre = 'Usuario';
            switch (userData.id_rol) {
              case '1':
                rolNombre = 'Estudiante';
                break;
              case '2':
                rolNombre = 'Docente';
                break;
              case '3':
                rolNombre = 'Administrador';
                break;
              case '4':
                rolNombre = 'Técnico';
                break;
            }

            const authUser = {
              uid: firebaseUser.uid,
              email: firebaseUser.email || '',
              nombre: nombreCompleto,
              rol: rolNombre,
              rolId: userData.id_rol,
              cedula: userData.cedula
            };
            
            console.log('💾 Guardando usuario en contexto:', authUser);
            setUser(authUser);
          } else {
            console.warn('Usuario no encontrado en Firestore');
          }
        } catch (error) {
          console.error('Error obteniendo datos del usuario:', error);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const logout = async () => {
    try {
      await signOut(auth);
      setUser(null);
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
      throw error;
    }
  };

  const setUserData = (userData: AuthUser) => {
    setUser(userData);
  };

  return (
    <AuthContext.Provider value={{ user, loading, logout, setUserData }}>
      {children}
    </AuthContext.Provider>
  );
};
