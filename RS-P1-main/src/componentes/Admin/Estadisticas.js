import './Estadistica.css';
import { Link } from 'react-router-dom';
import React, { useEffect, useState } from 'react';
import { collection, getDocs, getFirestore, where, query } from 'firebase/firestore';
import app from '../../firebaseConfig/firebase';

const db = getFirestore(app);

const Estadisticas = () => {
    const [proyectosCount, setProyectosCount] = useState(0);
    const [usuariosCount, setUsuariosCount] = useState(0);
    const [donacionesCount, setDonacionesCount] = useState(0);

    useEffect(() => {
        const fetchData = async () => {
            // Obtiene la cantidad de documentos en la colección "usuarios"
            const q = query(collection(db, 'usuarios'),where("activo", "==", true));
            const usuariosSnapshot = await getDocs(q);
            setUsuariosCount(usuariosSnapshot.size);

            // Obtiene la cantidad de documentos en la colección "proyectos"
            const proyectosSnapshot = await getDocs(collection(db, 'proyectos'));
            setProyectosCount(proyectosSnapshot.size);

            // Obtiene todas las donaciones y suma el monto total
            const donacionesSnapshot = await getDocs(collection(db, 'donaciones'));
            setDonacionesCount(donacionesSnapshot.size);
        };

        fetchData();
    }, []);
    return (
        <div className="statistics-container">
            <h1>Estadísticas</h1>
            <div className="statistics-info">
                <p><strong>Cantidad total de proyectos en la base:</strong> {proyectosCount}</p>
                <p><strong>Cantidad total de donaciones:</strong> {donacionesCount}</p>
                <p><strong>Cantidad total de usuarios activos:</strong> {usuariosCount}</p>
            </div>
            <div className="back-button-container">
                <Link to="/admin">
                    <button>Regresar</button>
                </Link>
            </div>
        </div>
    );
};

export default Estadisticas;
