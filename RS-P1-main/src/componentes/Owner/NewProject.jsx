import './NProject.css';
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import React, { useEffect, useState } from "react";
import { appendErrors, useForm } from "react-hook-form";
import { getFirestore, collection, addDoc, getDocs, doc, deleteDoc, getDoc, setDoc, query, where} from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import app, { db } from '../../firebaseConfig/firebase';
import { getAuth } from 'firebase/auth';
import { Link } from 'react-router-dom'

const auth = getAuth(app);

function NewProject() {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState(""); 
  const [raisedAmount, setRaisedAmount] = useState(0);
  const [daysRemaining, setDaysRemaining] = useState(0);

  const {register, formState: {errors}, handleSubmit, watch} = useForm();

  const db = getFirestore(app)

  const storage = getStorage(app);
  const firestore = getFirestore(app);

  const [userData, setUserData] = useState(null);
  const [docId, setDocId] = useState(null);  // Nuevo estado para almacenar la ID del documento
  const [loading, setLoading] = useState(true);

  const valoresIniciales= {
      nombre: '',
      descripcion: '',
      objetivo: 0,
      fechaLimite: '',
      categoria: '',
  }

  const [proyecto, setProyecto] = useState(valoresIniciales)

  const capturarInputs = (data) => {
      const {name, value} = data.target;
      setProyecto({...proyecto, [name]:value})
  }

  const onSubmit = async (data) => {
      try {
          const currentUser = auth.currentUser;
          const { fotoVideo, ...dataSinFotoVideo } = data;
          const email = currentUser.email;// recordar cambiar por: const email = currentUser.email;
          const q = query(collection(db, 'usuarios'), where('email', '==', email));
              const querySnapshot = await getDocs(q);
              if (!querySnapshot.empty) {
                  const userDoc = querySnapshot.docs[0];
                  setUserData(userDoc.data());
                  setDocId(userDoc.id);
                  const datosConExtras = {
                      ...dataSinFotoVideo, 
                      idCreador: userDoc.id,
                      montoRecaudado: 0
                  };
                  await addDoc(collection(db, "proyectos"), datosConExtras);
                  alert('Proyecto creado y añadido al sistema con éxito')
              } else {
                  console.log('No se encontró el documento del usuario');
              }
          console.log('Datos guardados sin el campo fotoVideo, pero con campos adicionales');
          setProyecto({...valoresIniciales})
      } catch (error) {
          console.log('Error al guardar los datos:', error);
      }
      console.log(data);
  };

  const navigate = useNavigate();
  const handleBackClick = () => {
    navigate('/inicio')
  };

  return (
    <div className="container">
      <h1>Crear nuevo proyecto</h1>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div>
          <label>Nombre del proyecto</label>
          <input 
              type="text" {...register('nombre', {
              required: true,
          })} onChange={capturarInputs} value={proyecto.nombre} />
          {errors.nombre?.type === 'required' && <p>Nombre del proyecto es requerido</p>}
        </div>

        <div>
          <label>Descripción</label>
          <textarea 
            type="text" {...register('descripcion', {
              required: true,
          })} onChange={capturarInputs} value={proyecto.descripcion} />
          {errors.descripcion?.type === 'required' && <p>Descripción del proyecto es requerido</p>}
        </div>

        <div>
          <label>Categoría</label>
          <input 
              type="text" {...register('categoria', {
              required: true,
          })} onChange={capturarInputs} value={proyecto.categoria} />
          {errors.categoria?.type === 'required' && <p>Categoría del proyecto es requerido</p>}
        </div>
        
        <div>
          <label>Monto por recaudar</label>
          <input placeholder= "Ingrese el objetivo de financiación"
              type="number" {...register('objetivo', {
                  required: true,
                  valueAsNumber: true,
                  validate: (value) => {
                      if (value <= 100){ return false}
                      return true
                  }
          })} onChange={capturarInputs} value={proyecto.objetivo} />
          {errors.objetivo?.type === 'required' && <p>Objetivo de financiación es requerido</p>}
          {errors.objetivo?.type === 'valueAsNumber' && <p>Lo ingresado debe ser una cifra numérica</p>}
          {errors.objetivo?.type === 'validate' && <p>La suma debe ser mayor a $100</p>}
        </div>

        <div>
        <label htmlFor="fechaLimite">Fecha límite de recaudación</label>
        <input type="date" {...register('fechaLimite', {
            required: true,
            validate: (value) => {
                const fechaIngresada = new Date(value);
                const fechaActual = new Date();
                return fechaIngresada > fechaActual;
            }
        }
        )} onChange={capturarInputs} value={proyecto.fechaLimite} />
        {errors.fechaLimite?.type === 'required' && <p>Fecha límite de recaudacdión es requerido</p>}
        {errors.fechaLimite?.type === 'validate' && <p>Fecha límite debe mayor a la fecha actual</p>}
        </div>
        <button className="Crear" type="submit">Crear Proyecto</button>
      </form>
      <div style={{ marginTop: '20px' }}>
        <button onClick={handleBackClick} className="back-button">Regresar</button>
      </div>
    </div>
  );
}

export default NewProject;
