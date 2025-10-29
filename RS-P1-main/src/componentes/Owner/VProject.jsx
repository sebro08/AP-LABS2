import './VProject.css';
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useEffect} from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getDoc, doc } from "firebase/firestore";
import { db } from '../../firebaseConfig/firebase'

function VProject({ project }) {
  const [nombre, setNombre] = useState("");
  const [description, setDescription] = useState("");
  const [categoria, setCategoria] = useState("");
  const [fecha, setFecha] = useState("");
  const [objetivo, setObjetivo] = useState(0);
  const [Recaudado, setRecaudado] = useState(0);
  const [UserD, setUserD] = useState(true); // Estado para determinar si el usuario es el creador o no

  const { id } = useParams();
  const { id_User } = useParams(); // ID del usuario desde los parámetros de la URL
  console.log(id_User)
  const { proy_O } = useParams(); // ID del proyecto desde los parámetros de la URL

  const navigate = useNavigate();
  // Función para obtener datos del proyecto
  const getProyectoById = async (id) => {
    const proyecto = await getDoc(doc(db, "proyectos", id));
    if (proyecto.exists()) {
      console.log(proyecto.data()); //Verificacion de que todos los datos coincidany se muestren correctamente
      setNombre(proyecto.data().nombre);
      setDescription(proyecto.data().descripcion);
      setCategoria(proyecto.data().categoria);
      setFecha(proyecto.data().fechaLimite);
      setObjetivo(proyecto.data().objetivo);
      setRecaudado(proyecto.data().montoRecaudado);
      if(id_User === proy_O){
        setUserD(false);
      }
    
      
    } else {
      console.log("El proyecto no existe");
    }
  };

  // Función para obtener datos del usuario actual


  const volver = async () => {
    navigate("/inicio");
  };

  useEffect(() => {
    // Llama a la función para obtener el proyecto
    getProyectoById(id);
  }, [id]);
  return (
    <div className="container">
      <h1>Detalles del proyecto</h1>

      <div className="form-group">
        <label><strong>Nombre del Proyecto:</strong></label>
        <input
          type="text"
          id="nombre"
          value={nombre}
          className="form-control"
          readOnly
        />
      </div>

      <div className="form-group">
        <label><strong>Descripción:</strong></label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="input-field"
        />
      </div>

      <div className="form-group">
        <label><strong>Categoría:</strong></label>
        <input
          type="text"
          value={categoria}
          className="input-field"
          readOnly
        />
      </div>

      <div className="form-group">
        <label><strong>Monto recaudado:</strong></label>
        <input
          type="number"
          value={Recaudado}
          className="input-field"
          readOnly
        />
      </div>

      <div className="form-group">
        <label><strong>Fecha Limite:</strong></label>
        <input
          type="text"
          value={fecha}
          className="input-field"
          readOnly
        />
      </div>

      <div className="form-group">
        <label><strong>Dinero Objetivo:</strong></label>
        <input
          type="number"
          value={objetivo}
          className="input-field"
          readOnly
        />
      </div>

      <div className="buttons-container">
        {UserD ? (
          <Link to={`/donar/${id}/${id_User}/${proy_O}`} className="submit">
            Donar
          </Link>
        ) : (
          <Link to={`/edit-project/${id}`} className="submit">Editar</Link>
        )}
        <Link to= {`/inicio`} className="button">Regresar</Link>
      </div>
    </div>
  );
}

export default VProject;
