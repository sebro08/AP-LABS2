import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom'; 
import './PList.css';
import {collection, getDocs, getDoc, deleteDoc, doc} from 'firebase/firestore'
import { db } from '../../firebaseConfig/firebase'
import {
    Timestamp,
    collectionGroup,
    limit,
    orderBy,
    query,
    where,
  } from "firebase/firestore";

const ProjectList = () => {
    const [proyectos, setProyectos] = useState([]);
    const proyCollection = collection(db, "proyectos");
    const getProyectos = async () => {
        const datos = await getDocs(proyCollection)
        setProyectos(
            datos.docs.map( (doc) => ( {...doc.data(), id: doc.id}))
        )
        console.log(proyectos)
    }

    useEffect(() => {
        getProyectos()
    }, [])


    return (
        <div className="container">
            <h1 className="left-aligned-title">Lista de proyectos:</h1>
            
            <div className="project-list">
                <table className="project-table">
                    <thead>
                        <tr>
                            <th>Nombre del Proyecto</th>
                            <th>Categoria</th>
                            <th>Descripcion</th>
                            <th>Monto recaudado</th>
                            <th>Monto objetivo</th>
                            <th>Fecha Limite</th>
                        </tr>
                    </thead>
                    <tbody>
                        {proyectos.map((proyecto) => (
                            <tr key={proyecto.id}>
                                <td>{proyecto.nombre}</td>
                                <td>{proyecto.categoria}</td>
                                <td>{proyecto.descripcion}</td>
                                <td>{proyecto.montoRecaudado}</td>
                                <td>{proyecto.objetivo}</td>
                                <td>{proyecto.fechaLimite}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Botón de regresar */}
            <div className="submit-container">
                <Link to="/admin">
                    <div className="submit">Regresar</div>
                </Link>
            </div>
        </div>
    );
};

export default ProjectList;
