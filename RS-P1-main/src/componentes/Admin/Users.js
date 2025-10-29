import './Users.css';
import { Link } from 'react-router-dom';
import React, { useState, useEffect } from 'react';
import {getFirestore, collection, getDocs, updateDoc, doc } from 'firebase/firestore';
import app from '../../firebaseConfig/firebase';

const db = getFirestore(app); // Inicializar Firestore

const UserList = () => {
  const [users, setUsers] = useState([]); // Estado para almacenar los usuarios

  const fetchUsers = async () => {
    const userCollection = collection(db, 'usuarios'); // Extraer la colección de usuarios 
    const userSnapshot = await getDocs(userCollection); // Obtener los documentos de la colección
    const userList = userSnapshot.docs.map(doc => ({ // Mapear los documentos a un array de objetos
      id: doc.id,
      ...doc.data(),
    }));
    setUsers(userList); // Actualizar el estado con la lista de usuarios
  };

  useEffect(() => {
    fetchUsers(); // Cargar los usuarios cuando se monta el componente
  }, []);

  // Cambiar el estado del atributo "activo" en Firebase
  const toggleEstado = async (id, currentState) => {
    const userRef = doc(db, 'usuarios', id); // Referencia al documento del usuario a cambiar
    await updateDoc(userRef, {
      activo: !currentState,
    });
    fetchUsers(); 
  };

  return (
    <div className="container">
      <h1 style={{ textAlign: 'left' }}>Usuarios:</h1>

      <table className="user-table">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Correo</th>
            <th>Cédula</th>
            <th>Estado</th>
            <th>Acción</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => ( // Mapear los n usuarios a una tabla
            <tr key={user.id}>
              <td>{user.nombre}</td>
              <td>{user.correo}</td>
              <td>{user.cedula}</td>
              <td>{user.activo ? 'Activo' : 'Desactivo'}</td>
              <td>
                <button className="btn" onClick={() => toggleEstado(user.id, user.activo)}> 
                  Cambiar estado
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="back-button-container" style={{ marginTop: '20px' }}>
        <Link to="/admin">
          <button className="btn">Regresar al menú</button>
        </Link>
      </div>
    </div>
  );
};

export default UserList;
