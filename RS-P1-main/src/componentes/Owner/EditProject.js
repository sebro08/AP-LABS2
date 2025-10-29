import './EditarP.css';
import React, { useState, useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { getDoc, setDoc, doc, collection, query, where, getDocs } from "firebase/firestore";
import app, { db } from "../../firebaseConfig/firebase";
import { getAuth } from 'firebase/auth';
import emailjs from '@emailjs/browser'; // Importar EmailJS

const auth = getAuth(app);

function EditProject() {
  const { id } = useParams();
  
  const valoresIniciales = {
    nombre: '',
    descripcion: '',
    objetivo: 0,
    fechaLimite: '',
    categoria: '',
    id: '',
    idCreador: '',
  };

  const [proyecto, setProyecto] = useState(valoresIniciales);
  const [user, setUser] = useState({});
  const { register, handleSubmit } = useForm();
  const [subId, setSubId] = useState(id);
  const navigate = useNavigate();

  // Obtener proyecto actual
  const getOne = async (id) => {
    try {
      const docRef = doc(db, "proyectos", id);
      const docSnap = await getDoc(docRef);
      setProyecto(docSnap.data());
    } catch (error) {
      console.log(error);
    }
  };

  const capturarInputs = (data) => {
    const { name, value } = data.target;
    setProyecto({ ...proyecto, [name]: value });
  };

  useEffect(() => {
    if (subId !== "") {
      getOne(subId);
    }
  }, [subId]);

  // Extraer ID del usuario autenticado y su email
  const extraerIDUser = async () => {
    const currentUser = auth.currentUser;
    const email = currentUser.email;
    const q = query(collection(db, 'usuarios'), where('email', '==', email));
    const querySnapshot = await getDocs(q);
    const userDoc = querySnapshot.docs[0];
    setUser(userDoc.data());
  };

  useEffect(() => {
    extraerIDUser();
  }, []);

  // Función para enviar correo de confirmación
  const sendConfirmationEmail = (email, projectName) => {
    const templateParams = {
      user_email: email, // Correo del usuario que editó el proyecto
      project_name: projectName, // Nombre del proyecto
      message: 'Los cambios en tu proyecto se han guardado correctamente.'
    };

    emailjs.send('service_mz0f82k', 'template_ip4oqii', templateParams, 'jZwHruEclEtlZ91yG')
      .then(() => {
        console.log('Correo enviado con éxito');
      })
      .catch((error) => {
        console.log('Error al enviar el correo:', error);
      });
  };

  // Manejar el envío del formulario y actualización del proyecto
  const onSubmit = async () => {
    try {
      const proyectoActualizado = {
        ...proyecto,
        objetivo: parseFloat(proyecto.objetivo),
      };

      // Actualizar el proyecto en Firestore
      await setDoc(doc(db, "proyectos", id), proyectoActualizado);
      alert('Proyecto actualizado con los datos ingresados');

      // Enviar correo de confirmación
      sendConfirmationEmail(user.email, proyecto.nombre); // Envía el correo al usuario que editó el proyecto

      navigate(`/inicio`);
    } catch (error) {
      console.log("Error al actualizar el proyecto:", error);
    }
  };

  return (
    <div className="container">
      <h1>Editar proyecto</h1>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div>
          <label>Nombre del proyecto</label>
          <input 
            type="text"
            name="nombre"
            value={proyecto.nombre}
            className="form-control"
            onChange={capturarInputs}
          />
        </div>

        <div>
          <label>Descripción</label>
          <textarea 
            type="text"
            name="descripcion"
            value={proyecto.descripcion}
            className="form-control"
            onChange={capturarInputs}
          />
        </div>

        <div>
          <label>Categoría</label>
          <input 
            type="text"
            name="categoria"
            value={proyecto.categoria}
            className="form-control"
            onChange={capturarInputs}
          />
        </div>

        <div>
          <label>Objetivo de recaudación</label>
          <input 
            type="number"
            name="objetivo"
            value={proyecto.objetivo}
            className="form-control"
            onChange={capturarInputs} 
          />
        </div>

        <div>
          <label>Fecha límite</label>
          <input 
            type="date"
            name="fechaLimite"
            value={proyecto.fechaLimite}
            className="form-control"
            onChange={capturarInputs}
          />
        </div>

        <button className="Editar" type="submit">Actualizar Proyecto</button>
      </form>

      <div style={{ marginTop: '20px' }}>
        <Link to={`/v-project/${subId}/${user.id}/${proyecto.idCreador}`} className="back-link">Regresar</Link>
      </div>
    </div>
  );
}

export default EditProject;
