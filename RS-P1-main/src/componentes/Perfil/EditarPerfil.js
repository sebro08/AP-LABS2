import './EditProfile.css';
import React, { useState, useEffect } from 'react';
import { getFirestore, collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';
import { Link } from 'react-router-dom';
import { getAuth } from 'firebase/auth';
import Home from '../MainS/Inicio';
import app from '../../firebaseConfig/firebase';

const db = getFirestore(app); // Inicializar Firestore
const auth = getAuth(app); // Inicializar Auth
 
function EditarPerfil({ user }) {
  const [editReady, setEditReady] = useState(false); // Estado para redirigir al home
  const [userData, setUserData] = useState(null); // Estado para almacenar los datos del usuario
  const [emailError, setEmailError] = useState(''); // Estado para manejar errores de email

  const [formData, setFormData] = useState({ // Estado para almacenar los valores del formulario
    nombre: '',
    cedula : '',
    email: '',
    contrasenna: '',
    telefono: '',
    areaDeTrabajo: '',
    dinero: ''
  });

  const validateEmail = (email) => { // Función para validar que el dominio del correo sea el correcto
    const validDomains = ['@estudiantec.cr', '@itcr.cr'];
    return validDomains.some(domain => email.endsWith(domain));
  }

  useEffect(() => { 
    const fetchUserData = async () => {
      try {
        const currentUser = auth.currentUser; // Obtener el usuario actual con el authentication de Firebase
        if (currentUser) {
          const email = currentUser.email; // Extraer el correo del usuario

          const q = query(collection(db, "usuarios"), where("email", "==", email)); // Consultar la colección de usuarios por el usuario actual según el correo
          const querySnapshot = await getDocs(q);
          if (!querySnapshot.empty) {
            const userDoc = querySnapshot.docs[0];
            setUserData(userDoc.data()); // Almacena los datos del usuario en el estado
          }
        }
      } catch (error) {
        console.error('Error obteniendo los datos del usuario:', error);
      }
    };

    fetchUserData(); // Llama a la función cuando el componente se monta
  }, []);

  useEffect(() => { // Este effect es para rellenar el form cuando los datos del usuario ya están disponibles
    if (userData) {
      setFormData(userData);
    }
  }, [userData]);

  const handleChange = (e) => { // Función para manejar los cambios en los inputs
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = async (e) => { 
    e.preventDefault();
    try {
      const currentUser = auth.currentUser; // Obtener el usuario actual con el authentication de Firebase
      if (currentUser) {
        const email = currentUser.email; 
        if (!validateEmail(email)) { // Validar el dominio del correo
            setEmailError('Los únicos dominios permitidos son @estudiantec y @itcr');
            return;
        }

        const q = query(collection(db, "usuarios"), where("email", "==", email)); // Consultar la colección de usuarios por el usuario actual según el correo
        const querySnapshot = await getDocs(q); // Obtener los documentos de la colección
        const userDoc = querySnapshot.docs[0]; // Obtener el documento del usuario en específico

        const userRef = doc(db, "usuarios", userDoc.id); // Referencia al documento del usuario a cambiar
        await updateDoc(userRef, formData); // Actualiza los datos en Firestore
        setEditReady(true); // Cambia el estado para redirigir al home
      }
    } catch (error) {
      console.error('Error actualizando el documento:', error);
    }
  };

  if (editReady) {
    return <Home />; // Redirige al home si se editó el perfil exitosamente
  }

  return (
    <div className="edit-profile-container">
      <h1>Editar Perfil</h1>
      <div className="edit-profile-info">
        <form onSubmit={handleSubmit}>
          <label>
            Nombre:
            <input type="text" name="nombre" value={formData.nombre} onChange={handleChange} required/>
          </label>
          <label>
            Cedula:
            <input type="text" name="cedula" value={formData.cedula} readOnly/>
          </label>
          <label>
            Email:
            <input type="email" name="email" value={formData.email} onChange={handleChange} required/>
            {emailError && <div className="invalid-feedback">{emailError}</div>}
          </label>
          <label>
            Contraseña:
            <input type="password" name="contrasenna" value={formData.contrasenna} onChange={handleChange} readOnly/>
          </label>
          <label>
            Teléfono:
            <input type="number" name="telefono" value={formData.telefono} onChange={handleChange} required/>
          </label>
          <label>
            Área de trabajo:
            <input type="text" name="areaDeTrabajo" value={formData.areaDeTrabajo} onChange={handleChange} required/>
          </label>
          <label>
            Dinero:
            <input type="number" name="dinero" value={formData.dinero} onChange={handleChange} required/>
          </label>
          <br />

          <div className="edit-profile-buttons">
            <button className="save-button">Guardar cambios</button>
            <Link to="/perfil" className="back-button">Regresar</Link>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditarPerfil;
