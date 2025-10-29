import './Donation.css';
import React, {useState, useEffect} from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
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

import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

import Swal from 'sweetalert2'
import { da } from 'date-fns/locale';

const ADonations = () => {
  const [donaciones, setDonaciones] = useState([])

    const [proyectos, setProyectos] = useState({});

    const getDonaciones = async () => {
        try {
            const donacionesCollection = collection(db, "donaciones");
            const querySnapshot = await getDocs(donacionesCollection);
            const donaciones = querySnapshot.docs.map((doc) => ({
                ...doc.data(),
                id: doc.id
            }));
            setDonaciones(donaciones);
            // Obtener todos los nombres de los proyectos
            const proyectosMap = {};
            for (const donacion of donaciones) {
                const nombre = await getNombreProyecto(donacion.idProyecto);
                proyectosMap[donacion.idProyecto] = nombre;
            }
            setProyectos(proyectosMap);
        } catch (error) {
            console.error("Error al obtener las donaciones: ", error);
        }
    };

    const getNombreProyecto = async (idProyecto) => {
        try {
            const proyectoDoc = doc(db, 'proyectos', idProyecto);
            const docSnap = await getDoc(proyectoDoc);
            if (docSnap.exists()) {
                return docSnap.data().nombre;
            } else {
                return 'Proyecto no encontrado';
            }
        } catch (error) {
            console.error('Error al obtener el proyecto: ', error);
        }
    };

    useEffect(() => {
        getDonaciones()
    }, [])

  return (
    <div className="container">
      <h1 style={{ textAlign: 'left' }}>Registro de Donaciones:</h1>

      <table className="donation-table">
        <thead>
          <tr>
          <th>Nombre de donador</th>
          <th>Correo de donador</th>
          <th>Telefono de donador</th>
          <th>Nombre del proyecto</th>
          <th>Monto donador</th>
          </tr>
        </thead>
        <tbody>
          {donaciones.map((donation) => (
            <tr key={donation.id}>
              <td>{donation.nombreDonador}</td>
              <td>{donation.correoDonador}</td>
              <td>{donation.telefonoDonador}</td>
              <td>{proyectos[donation.idProyecto]}</td>
              <td>{donation.montoDonado}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="back-button-container" style={{ marginTop: '20px' }}>
        <Link to="/admin">
          <button className="btn">Regresar</button>
        </Link>
      </div>
    </div>
  );
};

export default ADonations;
