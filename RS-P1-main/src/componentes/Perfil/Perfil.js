import './Perfil.css';
import React, { useEffect, useState } from 'react';
import { getAuth } from 'firebase/auth';
import { getFirestore, collection, query, where, getDocs } from 'firebase/firestore';
import { Link } from 'react-router-dom'
import app from '../../firebaseConfig/firebase';

const auth = getAuth(app); // Inicializar Auth
const db = getFirestore(app); // Inicializar Firestore

function Profile({ user }) {
  const [userData, setUserData] = useState(null); // Estado para almacenar los datos del usuario
  const [docId, setDocId] = useState(null); // Estado para almacenar la ID del documento

  useEffect(() => {
    const fetchUserData = async () => {
      const currentUser = auth.currentUser; // Obtener el usuario actual con el authentication de Firebase

      if (currentUser) {
        const email = currentUser.email; // Extraer el correo del usuario

        try {
          const q = query(collection(db, 'usuarios'), where('email', '==', email)); // Consultar la colección de usuarios por el usuario actual según el correo
          const querySnapshot = await getDocs(q); // Obtener los documentos de la colección

          if (!querySnapshot.empty) { 
            const userDoc = querySnapshot.docs[0]; // Obtener el documento del usuario en específico
            setUserData(userDoc.data()); // Almacenar los datos del usuario en el estado
            setDocId(userDoc.id); 
          } else {
            console.log('No se encontró el documento del usuario');
          }
        } catch (error) {
          console.error('Error obteniendo documento de Firestore:', error);
        }
      }

    };

    fetchUserData();
  }, []);

  return (
    <div className="profile-container">
    {userData ? (
      <div className="profile-info">
        <h1>{userData.nombre}</h1>
        {/* Se colocan los atributos del usuario */}
        <p><strong>Correo:</strong> {userData.email}</p> 
        <p><strong>Teléfono:</strong> {userData.telefono}</p>
        <p><strong>Área de trabajo:</strong> {userData.areaDeTrabajo}</p>
        <p><strong>Dinero disponible:</strong> ${userData.dinero}</p>
      </div>
    ) : (
        <p>No se encontraron datos del usuario.</p>
      )}
      <div className="profile-buttons">
        <Link to="/inicio" className="back-button">Regresar</Link>
        <Link to={`/mydonations/${docId}`} className="donations-button">Mis donaciones</Link>
        <Link to="/editar-perfil" className="edit-button">Editar Perfil</Link> {/* Nuevo botón */}
      </div>
    </div>
  );
}

export default Profile;
