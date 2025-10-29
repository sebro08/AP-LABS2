import React, { useState } from 'react';
import './Donar.css';
import { Link } from 'react-router-dom';
import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getDoc, doc } from "firebase/firestore";
import { db } from '../../firebaseConfig/firebase'
import { collection, addDoc, updateDoc } from 'firebase/firestore';
import emailjs from '@emailjs/browser'; // Importar EmailJS

const Donar = () => {
    const [nombre, setNombre] = useState('');
    const [nombrePro, setNombrePro] = useState('');
    const [telefono, setTelefono] = useState('');
    const [email, setEmail] = useState('');
    const [monto, setMonto] = useState(0);
    const [dineroUser, setDineroUser] = useState(0);
    const [recaudadoActual, setRecaudadoActual] = useState(0);
    const [donationAmount, setDonationAmount] = useState('');
    const [wantReceipt, setWantReceipt] = useState(false);
    const [emailCreator, setEmailCreator] = useState(''); // Correo del creador del proyecto

    const handleDonationChange = (e) => {
        setDonationAmount(e.target.value);
    };

    const handleReceiptChange = (e) => {
        setWantReceipt(e.target.checked);
    };

    const { id } = useParams();
    const { id_User } = useParams(); // ID del usuario desde los parámetros de la URL
    const { proy_O } = useParams(); // ID del proyecto desde los parámetros de la URL

    const donacionesCollection = collection(db, "donaciones");
    const navigate = useNavigate();

    const getInfoUserbyId = async (id_User) => {
        const usuario = await getDoc(doc(db, "usuarios", id_User));
        if (usuario.exists()) {
            setNombre(usuario.data().nombre);
            setTelefono(usuario.data().telefono);
            setEmail(usuario.data().email);
            setDineroUser(usuario.data().dinero);

        // Obtener el proyecto
        const proyecto = await getDoc(doc(db, "proyectos", id));
        if (proyecto.exists()) {
            setRecaudadoActual(proyecto.data().montoRecaudado);
            setNombrePro(proyecto.data().nombre);
            
            const idCreador = proyecto.data().idCreador; // Obtener el id del creador
            if (idCreador) {
                // Obtener los datos del creador usando idCreador
                const creador = await getDoc(doc(db, "usuarios", idCreador));
                if (creador.exists()) {
                    setEmailCreator(creador.data().email); // Correo del creador del proyecto
                // Verificar correo en consola
                console.log("Correo del creador del proyecto:", creador.data().email);
                } else {
                    console.log("El creador no existe");
                }
            }
        } else {
            console.log("El proyecto no existe");
        }
    } else {
        console.log("El usuario no existe");
    }
};

    useEffect(() => {
        // Llama a la función para obtener el proyecto
        getInfoUserbyId(id_User);
    }, [id_User]);

    const sendConfirmationEmail = (toEmail, subject, message) => {
        const templateParams = {
            user_email: toEmail,
            subject: subject,
            message: message,
        };

        emailjs.send('service_mz0f82k', 'template_ip4oqii', templateParams, 'jZwHruEclEtlZ91yG')
            .then(() => {
                console.log('Correo enviado exitosamente a', toEmail);
            })
            .catch((error) => {
                console.log('Error al enviar el correo:', error);
            });
    };

    const store = async (e) => {
        e.preventDefault();
        const montoNumerico = parseFloat(monto);
        if (montoNumerico <= dineroUser) {
            const nDinero = dineroUser - montoNumerico;
            const usuario = doc(db, "usuarios", id_User);
            const proyecto = doc(db, "proyectos", id);
            const nRecaudado = recaudadoActual + montoNumerico;
            
            await updateDoc(usuario, { dinero: nDinero });
            await updateDoc(proyecto, { montoRecaudado: nRecaudado });

            await addDoc(donacionesCollection, {
                correoDonador: email,
                idDonador: id_User,
                idProyecto: id,
                montoDonado: monto,
                nombreDonador: nombre,
                telefonoDonador: telefono
            });

            // Enviar correos de confirmación
            sendConfirmationEmail(emailCreator, 'Nueva donación recibida', `Has recibido una donación de ${nombre} por un monto de ${monto}.`);

            if (wantReceipt) {
                sendConfirmationEmail(email, 'Confirmación de donación', `Gracias por tu donación de ${monto} al proyecto ${nombrePro}.`);
            }

            alert('Donación realizada con éxito');
            navigate(`/inicio`);
        } else {
            alert('No tiene suficiente dinero');
        }
    };

    return (
        <div className="donation-container">
            {/* Información del proyecto */}
            <div className="project-info">
                <h1>{nombrePro}</h1>
            </div>

            {/* Formulario de donación */}
            <div className="donation-form">
                <label className="text">Monto a donar:</label>
                <div className="input">
                    <input 
                        type="number" 
                        value={monto} 
                        onChange={(e) => setMonto(e.target.value)} 
                        placeholder="Ingrese el monto" 
                    />
                </div>

                <div className="checkbox-container">
                    <input 
                        type="checkbox" 
                        checked={wantReceipt} 
                        onChange={handleReceiptChange} 
                    />
                    <label>¿Desea recibir un comprobante?</label>
                </div>

                <div className="input">
                    <input 
                        type="text" 
                        value={nombre} 
                        readOnly 
                        placeholder="Nombre" 
                    />
                </div>

                <div className="input">
                    <input 
                        type="text" 
                        value={email}
                        readOnly 
                        placeholder="Correo" 
                    />
                </div>

                <div className="button-container">
                    <div className="submit" onClick={store}>
                        Aceptar
                    </div>
                    <Link to={`/v-project/${id}/${id_User}/${proy_O}`} className="submit exit">
                        Salir
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default Donar;
