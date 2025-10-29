import './LoginSignup.css';
import React from 'react'
import { useState } from 'react'
import Login1 from './LoginSignup'
import { getFirestore, collection, addDoc } from 'firebase/firestore'
import { Link } from 'react-router-dom'
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth'
import app from '../../firebaseConfig/firebase'
import emailjs from '@emailjs/browser'; // Importar EmailJS

const auth = getAuth(app) // Inicializar Auth
const db = getFirestore(app) // Inicializar Firestore

const Signup = () => {
    const [showLogin, setShowLogin] = useState(false); // Estado para mostrar el login
    const [emailError, setEmailError] = useState(''); // Estado para manejar errores de email
    
    const valorInicial = { // Estado inicial del formulario (especie de "plantilla")
        nombre: '',
        email: '',
        contrasenna: '',
        cedula: '',
        telefono: '',
        areaDeTrabajo: '',
        dinero: '',
        activo: true,
        admin: false
    }

    const [values, setValues] = useState(valorInicial) // Estado para almacenar los valores del formulario

    const handleInputChange = (e) => { // Función para manejar los cambios en los inputs
        const {name, value} = e.target
        setValues({...values, [name]: value})

        if (name === 'email') {
            setEmailError('');
        }
    }
    
    const validateEmail = (email) => { // Función para validar que el dominio del correo sea el correcto
        const validDomains = ['@estudiantec.cr', '@itcr.cr'];
        return validDomains.some(domain => email.endsWith(domain));
    }

    const sendConfirmationEmail = () => { // Función para enviar correo de notificación
        const templateParams = {
            user_email: values.email, // El correo registrado
            user_name: values.nombre,  // El nombre del usuario
            message: 'Tu cuenta ha sido registrada exitosamente en nuestro sistema.'
        };

        emailjs.send('service_mz0f82k', 'template_ip4oqii', templateParams, 'jZwHruEclEtlZ91yG')
            .then(() => {
                console.log('Correo enviado exitosamente');
            })
            .catch((error) => {
                console.log('Error al enviar el correo:', error);
            });
    };

    const handlerSubmit = async (e) => { // Función para manejar el envío del formulario
        e.preventDefault()
        const email = e.target.email.value; 
        const contrasenna = e.target.contrasenna.value;
        
        if (!validateEmail(email)) { // Validar el dominio del correo
            setEmailError('Los únicos dominios permitidos son @estudiantec y @itcr');
            return;
        }

        try {
            // Crear usuario con el authentication de Firebase
            await createUserWithEmailAndPassword(auth, email, contrasenna)

            // Agrega el documento del usuario a Firestore
            await addDoc(collection(db, 'usuarios'), {...values})

            // Enviar correo de notificación de registro exitoso
            sendConfirmationEmail();

            // Restablecer los valores del formulario
            setValues({...valorInicial})

            // Cambiar a la pantalla de Login
            setShowLogin(true)
        } catch (error) {
            console.log('Error al registrar usuario:', error)
        }
    }

    if (showLogin) {
        return <Login1 />; // Redirige a Login si se creó la cuenta
    }

    return (
        <div className="container">
            <div className="header">
                <div className="text">Crear Cuenta</div>
                <div className="underline"></div>
            </div>
            <form onSubmit={handlerSubmit}>
                <div className="inputs">
                    <div className="input">
                        <input type="text" placeholder="Nombre de usuario" className='form-control' name='nombre' required onChange={handleInputChange} value={values.nombre}/>
                    </div>
                    <div className="input">
                        <input type="email" placeholder="Correo electrónico" className={`form-control ${emailError ? 'is-invalid' : ''}`} id='email' name='email' required  onChange={handleInputChange} value={values.email}/>
                        {emailError && <div className="invalid-feedback">{emailError}</div>}
                    </div>
                    <div className="input">
                        <input type="password" placeholder="Contraseña" className='form-control' id='contrasenna' name='contrasenna' required onChange={handleInputChange} value={values.contrasenna}/>
                    </div>
                    <div className="input">
                        <input type="text" placeholder="Cédula" className='form-control' name='cedula' required onChange={handleInputChange} value={values.cedula}/>
                    </div>
                    <div className="input">
                        <input type="number" placeholder="Teléfono" className='form-control' name='telefono' required onChange={handleInputChange} value={values.telefono}/>
                    </div>
                    <div className="input">
                        <input type="text" placeholder="Área de trabajo" className='form-control' name='areaDeTrabajo' required onChange={handleInputChange} value={values.areaDeTrabajo}/>
                    </div>
                    <div className="input">
                        <input type="number" placeholder="Cantidad inicial de dinero" className='form-control' name='dinero' required onChange={handleInputChange} value={values.dinero}/>
                    </div>
                </div>
                <div className="submit-container">
                    <Link to="/" className="submit">Regresar</Link>
                    <Link to={`/login`} className='submit'>Inicia sesión</Link>  
                    <button className='submit' type='submit'>Registrarse</button>
                </div>
            </form>
        </div>
    );
};

export default Signup;
