// Import de react
import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';

// CSS de App.js
import './App.css';

// File: Admin
import Admin from './componentes/Admin/Admin';
import ADonations from './componentes/Admin/ADonations';
import Estadisticas from './componentes/Admin/Estadisticas';
import MyDonations from './componentes/Admin/MyDonations';
import ProjectList from './componentes/Admin/ProjectList';
import Users from './componentes/Admin/Users';

// File: LoginSignup
import LoginSignup from './componentes/LoginSignup/LoginSignup';
import Signup from './componentes/LoginSignup/Signup';

// File: MainS
import Inicio from './componentes/MainS/Inicio';

// File: Owner
import Donar from './componentes/Owner/Donar';
import EditProject from './componentes/Owner/EditProject';
import NewProject from './componentes/Owner/NewProject';
import VProject from './componentes/Owner/VProject';

// File: Perfil
import Perfil from './componentes/Perfil/Perfil';
import EditarPerfil from './componentes/Perfil/EditarPerfil';

// File: Portada
import Portada from './componentes/Portada/Portada'; 

function App() {

//Prueba de perfil
const user = {
  name: "Sebastian Rodriguez",
  email: "srod@example.com",
  phone: "123456789",
  workArea: "Desarrollo web",
  money: 1500
};

  // Datos de ejemplo para el proyecto
    const project = {
      name: "Simulador de consola",
      description: "Un proyecto para emular juegos de consola.",
      category: "Videojuego",
      raisedAmount: 12000,
      daysRemaining: 10,
    };
    
//Fin de prueba, cabiar la seccion de perfil, edit y v project, ya que sino solo toma el ejemplo como usuario, es para probar la pantalla solo***


  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<Portada />} />
          <Route path="/login" element={<LoginSignup />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/edit-project/:id" element={<EditProject />} /> 
          <Route path="/donar/:id/:id_User/:proy_O" element={<Donar />} />
          <Route path="/perfil" element={<Perfil user={user}/>} />  
          <Route path="/editar-perfil" element={<EditarPerfil user={user}/>} />  
          <Route path="/new-project" element={<NewProject />} />
          <Route path="/v-project/:id/:id_User/:proy_O" element={<VProject/>} /> 
          <Route path="/inicio" element={<Inicio />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/monitoreo-donaciones" element={<ADonations />} />
          <Route path="/mydonations/:docId" element={<MyDonations />} />
          <Route path="/monitoreo-proyectos" element={<ProjectList />} />
          <Route path="/estadisticas-sistema" element={<Estadisticas />} />
          <Route path="/usuarios" element={<Users />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
