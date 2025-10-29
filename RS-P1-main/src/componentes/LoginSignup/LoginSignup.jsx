import './LoginSignup.css';
import { useNavigate } from "react-router-dom";  
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, collection, query, where, getDocs } from 'firebase/firestore';
import app from '../../firebaseConfig/firebase';

import Home from '../MainS/Inicio';
import HomeAdmin from '../Admin/Admin';

const auth = getAuth(app); // Inicializar Auth
const db = getFirestore(app); // Inicializar Firestore

const LoginSignup = () => {
    const navigate = useNavigate();
    const [action, setAction] = useState("Ingresar");

    const [isLoggedInAdmin, setIsLoggedInAdmin] = useState(false); // Estado para admin
    const [isLoggedIn, setIsLoggedIn] = useState(false); // Estado para usuario
    const [error, setError] = useState(null); // Estado para manejar errores
    const [userId, setuserId] = useState(""); // Estado para almacenar los datos del usuario

    const handlerSubmit = async (e) => {
      console.log("Ingresar");
      e.preventDefault();
      const email = e.target.email.value;
      const contrasenna = e.target.contrasenna.value;

      try {
        setError(null);
        
        const q = query(collection(db, "usuarios"),where("email", "==", email)); // Consultar la colección de usuarios por el usuario con el correo ingresado
        const querySnapshot = await getDocs(q); // Obtener los documentos de la colección

        const userDoc = querySnapshot.docs[0]; // Obtener el documento del usuario en específico

        const userData = userDoc.data(); // Extraer los datos del usuario
        setuserId(userDoc.id); // Almacenar la ID del usuario en el estado
        console.log("Usuario:", userId);
        if(userData.activo == true){
          const userCredential = await signInWithEmailAndPassword(auth, email, contrasenna); // Iniciar sesión con el authentication de Firebase
          if (userData.admin) {
            setIsLoggedInAdmin(true); // Si es admin
          } else {
            setIsLoggedIn(true); // Si es usuario normal
          }
        }else{
          console.error("Error al iniciar sesión:");
          setError("Error al iniciar sesión. Este usuario se encuentra inactivo.");
        }
        
      } catch (err) {
        console.error("Error al iniciar sesión:", err);
        setError("Error al iniciar sesión. Verifica tus credenciales.");
      }
    };

    if (isLoggedInAdmin) {
      return <HomeAdmin />; // Redirige a HomeAdmin si es admin
    }

    if (isLoggedIn) {
      navigate(`/inicio`); // Redirige a Home si es un usuario normal
    }

    const handleCreateAccount = () => {
      navigate("/signup");
    };
    return (
      <div className="container">
        <div className="header">
          <div className="text">{action}</div>
          <div className="underline"></div>
        </div>
        {error && <p style={{ color: 'red' }}>{error}</p>}
        <form onSubmit={handlerSubmit}>
          <div className="inputs">
            <div className="input">
              <input type="email" className='form-control' placeholder="Correo electrónico" id='email' name='email' required />
            </div>
            <div className="input">
              <input type="password" className='form-control' placeholder="Contraseña" id='contrasenna' name='contrasenna' required/>
            </div>
          </div>

          <div className="forgot-password">
            ¿Olvidaste la contraseña? <span>Presione aquí</span>
          </div>
          <div className="submit-container">
            <div className="submit" onClick={handleCreateAccount}>
                Crear cuenta
            </div>{" "}
            {/* Redirige a la pantalla de creación */}
            <button className='submit' type='submit' >
              Iniciar Sesión
            </button>
          </div>    
        </form>
        
      </div>
    );
};

export default LoginSignup;
