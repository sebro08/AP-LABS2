import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from '../firebase/config';
import { UserFirestore } from '../types/User';
import { useAuth } from '../context/AuthContext';
import '../styles/Login.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { setUserData } = useAuth();

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validaciones
    if (!email.trim() || !password.trim()) {
      setError('Por favor ingrese todos los campos');
      return;
    }

    if (!validateEmail(email)) {
      setError('Formato de email inválido');
      return;
    }

    setLoading(true);

    try {
      console.log('Buscando usuario en Firestore con email:', email);

      // PASO 1: Buscar usuario en Firestore
      const usuariosRef = collection(db, 'usuarios');
      const q = query(usuariosRef, where('email', '==', email));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        setError('Usuario no registrado en el sistema');
        setLoading(false);
        return;
      }

      const userDoc = querySnapshot.docs[0];
      const userData = userDoc.data() as UserFirestore;

      console.log('Usuario encontrado:', userData);

      // Verificar si está activo
      if (!userData.activo) {
        setError('Usuario inactivo. Contacte al administrador.');
        setLoading(false);
        return;
      }

      // PASO 2: Autenticar con Firebase Auth
      console.log('🔐 Autenticando con Firebase Auth...');
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;

      console.log('Autenticación exitosa!');

      // Construir nombre completo
      const nombreCompleto = [
        userData.primer_nombre,
        userData.segundo_nombre,
        userData.primer_apellido,
        userData.segundo_apellido
      ]
        .filter(Boolean)
        .join(' ')
        .trim() || 'Usuario';

      const rolId = userData.id_rol;

      // Determinar rol
      let rolNombre = 'Usuario';
      switch (rolId) {
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

      // Guardar datos del usuario en el contexto
      setUserData({
        uid: firebaseUser.uid, // Usar el UID de Firebase Auth, no el ID del documento
        email: firebaseUser.email || '',
        nombre: nombreCompleto,
        rol: rolNombre,
        rolId: rolId,
        cedula: userData.cedula
      });

      console.log('Login exitoso! Redirigiendo...');
      console.log('Rol ID:', rolId);
      console.log('Navegando a:', rolId === '3' ? '/admin' : rolId === '4' ? '/tecnico' : '/user/dashboard');

      // Pequeño delay para asegurar que el contexto se actualice
      setTimeout(() => {
        // Navegar según el rol
        if (rolId === '3') {
          navigate('/admin');
        } else if (rolId === '4') {
          navigate('/tecnico');
        } else {
          navigate('/user/dashboard');
        }
      }, 100);

    } catch (error: any) {
      console.error('Error en login:', error);
      
      if (error.code === 'auth/invalid-credential') {
        setError('Email o contraseña incorrectos');
      } else if (error.code === 'auth/user-not-found') {
        setError('No existe una cuenta con este email');
      } else if (error.code === 'auth/wrong-password') {
        setError('Contraseña incorrecta');
      } else if (error.code === 'auth/too-many-requests') {
        setError('Demasiados intentos. Intente más tarde');
      } else {
        setError(`Error: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h1>AP-LABS</h1>
          <p>Sistema de Gestión de Laboratorios</p>
        </div>

        <form onSubmit={handleLogin} className="login-form">
          <div className="form-group">
            <label htmlFor="email">Correo Electrónico</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="usuario@ejemplo.com"
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Contraseña</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              disabled={loading}
            />
          </div>

          {error && <div className="alert alert-error">{error}</div>}

          <button 
            type="submit" 
            className="login-button"
            disabled={loading}
          >
            {loading ? 'Validando...' : 'Iniciar Sesión'}
          </button>

          <div className="login-footer">
            <a href="#" className="link">¿Olvidaste tu contraseña?</a>
            <span className="separator">•</span>
            <button 
              type="button"
              className="link"
              onClick={() => navigate('/signup')}
            >
              Crear cuenta
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
