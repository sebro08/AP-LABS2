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
const MyDonations = () => {
  const {docId} = useParams()
  
  const [donations, setDonaciones] = useState([]);

  const [proyectos, setProyectos] = useState({});

  const [donador, setDonador] = useState({});

  const getDonacionesPorDonador = async (idDonador) => {
      try {
          const donacionesCollection = collection(db, "donaciones");
          const q = query(donacionesCollection, where("idDonador", "==", idDonador));
          const querySnapshot = await getDocs(q);
          const donaciones = querySnapshot.docs.map((doc) => ({
              ...doc.data(),
              id: doc.id
          }));
          const docRef = doc(db, "usuarios", idDonador)
          const docSnap = await getDoc(docRef)
          setDonador(docSnap.data())
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
      getDonacionesPorDonador(docId)
  }, [docId])

  return (
    <div className="container">
      <h1 style={{ textAlign: 'left' }}>Mis Donaciones:</h1>

      <table className="donation-table">
        <thead>
          <tr>
            <th>Nombre del Proyecto</th>
            <th>Monto Donado</th>
          </tr>
        </thead>
        <tbody>
          {donations.map((donation) => (
            <tr key={donation.id}>
              <td>{proyectos[donation.idProyecto]}</td>
              <td>{donation.montoDonado}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="back-button-container" style={{ marginTop: '20px' }}>
        <Link to="/perfil">
          <button className="btn">
            Regresar
          </button>
        </Link>
      </div>
    </div>
  );
};

export default MyDonations;
