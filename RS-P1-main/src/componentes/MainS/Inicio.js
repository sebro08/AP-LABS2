import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css'; // Importa el CSS de DatePicker
import './Principal.css'; // Asegúrate de tener el CSS correspondiente
import {collection, getDocs, getDoc, deleteDoc, doc} from 'firebase/firestore'
import { getAuth } from 'firebase/auth';
import { db } from '../../firebaseConfig/firebase'
import { useNavigate, useParams } from "react-router-dom";
import {
    Timestamp,
    collectionGroup,
    limit,
    orderBy,
    query,
    where,
  } from "firebase/firestore";

import 'react-datepicker/dist/react-datepicker.css';
import app from '../../firebaseConfig/firebase';


const auth = getAuth(app);

const ProjectList = () => {
    const [proyectos, setProyectos] = useState([])
    const [ nombreB, setNombreB ] = useState('')
    const [startDate, setStartDate] = useState(null);
    const [ id_User, setId_User ] = useState('')
    const [userData, setUserData] = useState(null);
    const currentUser = auth.currentUser; // Obtener el usuario actual con el authentication de Firebase

    
    
    

    //referencia a Firestore
    const proyCollection = collection(db, "proyectos")

    //Funcion para todos los docs
    const getProyectos = async () => {
        if (currentUser) {
            const email = currentUser.email; // Extraer el correo del usuario
    
            try {
              const q = query(collection(db, 'usuarios'), where('email', '==', email)); // Consultar la colección de usuarios por el usuario actual según el correo
              const querySnapshot =  await getDocs(q); // Obtener los documentos de la colección
              console.log("Hola")
    
              if (!querySnapshot.empty) { 
                const userDoc = querySnapshot.docs[0]; // Obtener el documento del usuario en específico
                setUserData(userDoc.data()); // Almacenar los datos del usuario en el estado
                setId_User(userDoc.id); 
              } else {
                console.log('No se encontró el documento del usuario');
              }
            } catch (error) {
              console.error('Error obteniendo documento de Firestore:', error);
            }
        }
        console.log(id_User)
        const datos = await getDocs(proyCollection)
        setProyectos(
            datos.docs.map( (doc) => ( {...doc.data(), id: doc.id}))
        )
        console.log(proyectos)
    }

    //Funcion para buscar por nombre y categoria
    const getUsersByF = async (e) => {
        e.preventDefault()
        const proyCollection = collection(db, "proyectos");
        const nameQuery = query(
            proyCollection,
            where("nombre", ">=", nombreB),
            where("nombre", "<=", nombreB + '\uf8ff')
        );
        
    
        const categoryQuery = query(
            proyCollection,
            where("categoria", ">=", nombreB),
            where("categoria", "<=", nombreB + '\uf8ff')
        );
    
        // Obtener resultados de ambas consultas
        const nameSnapshot = await getDocs(nameQuery);
        console.log(nameSnapshot)
        const categorySnapshot = await getDocs(categoryQuery);
    
        // Combinar los resultados
        const results = [];
    
        nameSnapshot.forEach((doc) => {
            results.push({ id: doc.id, ...doc.data() });
        });
    
        categorySnapshot.forEach((doc) => {
            // Verificar que el documento no esté ya en los resultados (para evitar duplicados)
            if (!results.find((result) => result.id === doc.id)) {
                results.push({ id: doc.id, ...doc.data() });
            }
        });

        setProyectos(results)
    }

    const getUsersByDate = async () => {
        if (!startDate) return;
        const proyCollection = collection(db, "proyectos");

        const q = query(proyCollection, where("fechaLimite", "<=", startDate));
    
        // Obtener resultados de ambas consultas
        const dateSnapshot = await getDocs(q);
    
        // Combinar los resultados


        setProyectos(
            dateSnapshot.docs.map( (doc) => ( {...doc.data(), id: doc.id}))
        )
    }


    const handleSubmit = (e) => {
        ;
        // Aquí iría la lógica para enviar los datos, como guardar en Firestore
        console.log({
          nombreB
        });
      };


    useEffect(() => {
        getUsersByDate();
      }, [startDate]);

    //usar useEffect
    useEffect(() => {
        getProyectos()
    }, [])

    return (
        <div className="container">
            <div className="header">
                <h1 className="site-title">MSIKCrowfund</h1>
                <div className="button-group">
                    <Link to={`/perfil`} className="button">Perfil</Link>
                    <Link to="/new-project" className="button">Crear Proyecto</Link>
                </div>
            </div>

            <div className="search-section">
                <input
                    type="text"
                    value={nombreB}
                    onChange={ (e) => setNombreB(e.target.value)} 
                    placeholder="Buscar..."
                    className="search-bar"
                />
                <button className="search-button" onClick={getUsersByF}>Buscar</button>
            </div>

            {/* Sección del DatePicker */}
            <div className="date-picker-section">
                <label>Fecha límite</label>
                <DatePicker 
                    selected={startDate} 
                    onChange={(date) => {
                        const formattedDate = date.toISOString().split('T')[0];
                        setStartDate(formattedDate); // Convierte a "yyyy-MM-dd"
                        console.log(formattedDate); // Esto te dará el formato "2024-09-26"
                    }}
                    dateFormat="yyyy-MM-dd"
                    className="date-picker"
                    placeholderText="Selecciona una fecha"
                />
            </div>

            <hr className="separator-line" />

            <hr className="separator-line" />

            <table className="project-table">
                <thead>
                    <tr>
                        <th>Nombre del Proyecto</th>
                        <th>Categoría</th>
                        <th>Fecha limite de recaudacion</th>
                        <th>Monto Recaudado</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
                { proyectos.map ((proyecto) => {
                    //const fechaLimite = proyecto.fechaLimite?.toDate();
                  
                    // Formatear la fecha para mostrarla de forma legible
                    //const fechaFormateada = fechaLimite?.toLocaleDateString();
                    return(
                        <tr key={proyecto.id}>
                            <td>{proyecto.nombre}</td>
                            <td>{proyecto.categoria}</td>
                            <td>{proyecto.fechaLimite}</td>
                            <td>{proyecto.montoRecaudado}</td>
                            <td>
                                <Link to={`/v-project/${proyecto.id}/${id_User}/${proyecto.idCreador}`} className='submit'>Ver</Link>
                            </td>
                        </tr>
                    )
                })}
                </tbody>
            </table>
            <div>
                <Link to={`/login`} className="button">Cerrar Sesión</Link>
            </div>
            
        </div>
    );
};

export default ProjectList;
