# Guía de Reemplazo de Emojis por Iconos Profesionales

## Estado Actual
✅ Completado:
- `src/components/user/UserHistorial.tsx` - Todos los emojis reemplazados
- `src/components/user/UserSolicitudes.tsx` - Todos los emojis reemplazados

## Pendientes de Actualizar

### Iconos de React Icons a Usar

```tsx
import { 
  // Generales
  FiHome,          // 🏠 Home/Inicio
  FiUsers,         // 👥 Usuarios
  FiUser,          // 👤 Usuario individual
  FiPackage,       // 📦 Paquetes/Recursos
  FiBox,           // 🏢 Laboratorios/Edificios
  
  // Acciones
  FiEdit,          // ✏️ Editar
  FiTrash2,        // 🗑️ Eliminar
  FiEye,           // 👁️ Ver
  FiPlus,          // ➕ Agregar
  FiSave,          // 💾 Guardar
  FiX,             // ❌ Cerrar/Cancelar
  FiCheck,         // ✅ Confirmar
  FiCheckCircle,   // ✅ Completado
  FiXCircle,       // ❌ Error
  FiAlertCircle,   // ⚠️ Advertencia
  
  // Documentos
  FiFileText,      // 📝 Documento/Texto
  FiFile,          // 📄 Archivo
  FiFolder,        // 📁 Carpeta
  FiDownload,      // 📥 Descargar
  FiUpload,        // 📤 Subir
  
  // Comunicación
  FiMail,          // 📧 Email
  FiMessageSquare, // 💬 Mensaje
  FiBell,          // 🔔 Notificación
  
  // Tiempo
  FiCalendar,      // 📅 Calendario
  FiClock,         // 🕐 Reloj/Hora
  
  // Herramientas
  FiTool,          // 🔧 Herramienta
  FiSettings,      // ⚙️ Configuración
  FiFilter,        // 🔍 Filtro
  FiSearch,        // 🔍 Buscar
  
  // Gráficos
  FiBarChart,      // 📊 Gráfico de barras
  FiPieChart,      // 📈 Gráfico circular
  FiTrendingUp,    // 📈 Tendencia
  
  // Estado
  FiActivity,      // ⚡ Actividad
  FiLoader,        // ⏳ Cargando
  FiRefreshCw,     // 🔄 Refrescar
  
  // Otros
  FiLogOut,        // 🚪 Salir
  FiLock,          // 🔐 Bloqueado
  FiUnlock,        // 🔓 Desbloqueado
  FiInfo,          // ℹ️ Información
  FiHelpCircle     // ❓ Ayuda
} from 'react-icons/fi';
```

## Mapa de Reemplazo de Emojis

### Emojis Comunes y sus Reemplazos

| Emoji | Icono React | Importar |
|-------|-------------|----------|
| 📊 | `<FiBarChart />` | `FiBarChart` |
| 📅 | `<FiCalendar />` | `FiCalendar` |
| 🔍 | `<FiSearch />` | `FiSearch` |
| ✅ | `<FiCheckCircle />` | `FiCheckCircle` |
| ❌ | `<FiXCircle />` | `FiXCircle` |
| 📝 | `<FiFileText />` | `FiFileText` |
| 📄 | `<FiFile />` | `FiFile` |
| 📦 | `<FiPackage />` | `FiPackage` |
| 🏢 | `<FiBox />` | `FiBox` |
| 👥 | `<FiUsers />` | `FiUsers` |
| 💬 | `<FiMessageSquare />` | `FiMessageSquare` |
| 🔔 | `<FiBell />` | `FiBell` |
| ⚙️ | `<FiSettings />` | `FiSettings` |
| 📧 | `<FiMail />` | `FiMail` |
| 🔧 | `<FiTool />` | `FiTool` |
| 📈 | `<FiTrendingUp />` | `FiTrendingUp` |
| 💾 | `<FiSave />` | `FiSave` |
| 🗑️ | `<FiTrash2 />` | `FiTrash2` |
| ✏️ | `<FiEdit />` | `FiEdit` |
| 👁️ | `<FiEye />` | `FiEye` |
| 🚀 | `<FiTrendingUp />` | `FiTrendingUp` |
| ⏳ | `<FiLoader />` | `FiLoader` |
| 📋 | `<FiFileText />` | `FiFileText` |
| 🎯 | `<FiTarget />` | `FiTarget` |
| 💡 | `<FiLightbulb />` | `FiLightbulb` |
| 🔐 | `<FiLock />` | `FiLock` |
| 🏠 | `<FiHome />` | `FiHome` |
| ⚠️ | `<FiAlertCircle />` | `FiAlertCircle` |
| ℹ️ | `<FiInfo />` | `FiInfo` |
| × | `×` (usar el carácter HTML) | N/A |
| ✕ | `×` (usar el carácter HTML) | N/A |

## Patrones de Reemplazo

### 1. Encabezados de Página
```tsx
// Antes:
<h1>📊 Título</h1>

// Después:
import { FiBarChart } from 'react-icons/fi';
<h1><FiBarChart className="header-icon" /> Título</h1>
```

### 2. Botones
```tsx
// Antes:
<button>📥 Exportar</button>

// Después:
import { FiDownload } from 'react-icons/fi';
<button><FiDownload /> Exportar</button>
```

### 3. Input de Búsqueda
```tsx
// Antes:
<input placeholder="🔍 Buscar..." />

// Después:
import { FiSearch } from 'react-icons/fi';
<div className="search-box">
  <FiSearch className="search-icon" />
  <input placeholder="Buscar..." />
</div>
```

### 4. Badges de Estado
```tsx
// Antes:
<span className="badge">✅ Completado</span>

// Después:
import { FiCheckCircle } from 'react-icons/fi';
<span className="badge"><FiCheckCircle /> Completado</span>
```

### 5. Tarjetas de Estadísticas
```tsx
// Antes:
<div className="stat-icon">📊</div>

// Después:
import { FiBarChart } from 'react-icons/fi';
<div className="stat-icon"><FiBarChart /></div>
```

### 6. Alertas y Mensajes
```tsx
// Antes:
alert('✅ Operación exitosa');

// Después:
alert('Operación exitosa'); // Solo texto, sin emoji
```

### 7. Opciones de Select
```tsx
// Antes:
<option value="pdf">📄 Solo PDF</option>

// Después:
<option value="pdf">Solo PDF</option> // Sin icono en options
```

## Archivos Pendientes

### Prioridad Alta (Admin)
1. ✅ `src/components/admin/GestionReportes.tsx` - Líneas con console.log y alerts
2. `src/components/admin/RegistrarMantenimiento.tsx`
3. `src/components/admin/ProgramarMantenimiento.tsx`
4. `src/components/admin/PerfilUsuario.tsx`
5. `src/components/admin/AdminDashboard.tsx`
6. `src/components/admin/GestionUsuarios.tsx`
7. `src/components/admin/GestionLaboratorios.tsx`
8. `src/components/admin/GestionInventario.tsx`
9. `src/components/admin/GestionMantenimientos.tsx`
10. `src/components/admin/GestionSolicitudes.tsx`
11. `src/components/admin/GestionMensajeria.tsx`
12. `src/components/admin/GestionBitacora.tsx`
13. `src/components/admin/GestionNotificaciones.tsx`
14. `src/components/admin/GestionDepartamentos.tsx`

### Prioridad Media (Técnico)
15. `src/components/tecnico/TecnicoDashboard.tsx`
16. `src/components/tecnico/TecnicoGestionInventario.tsx`
17. `src/components/tecnico/TecnicoGestionMantenimientos.tsx`
18. `src/components/tecnico/TecnicoGestionSolicitudes.tsx`

### Prioridad Baja (Otros)
19. `src/components/Login.tsx`
20. `src/context/AuthContext.tsx` - Solo console.logs

## CSS Necesario

Agrega estos estilos globales para los iconos:

```css
/* Iconos en encabezados */
.header-icon {
  font-size: 1.5em;
  margin-right: 0.5rem;
  vertical-align: middle;
}

/* Iconos inline en texto */
.inline-icon {
  font-size: 1em;
  margin-right: 0.25rem;
  vertical-align: middle;
}

/* Iconos en secciones */
.section-icon {
  font-size: 1.2em;
  margin-right: 0.5rem;
  vertical-align: middle;
}

/* Iconos en búsqueda */
.search-box {
  position: relative;
  display: flex;
  align-items: center;
}

.search-icon {
  position: absolute;
  left: 12px;
  color: #666;
  pointer-events: none;
}

.search-box input {
  padding-left: 40px;
}

/* Iconos en botones */
button svg {
  margin-right: 0.5rem;
  vertical-align: middle;
}

/* Iconos en badges */
.badge svg {
  margin-right: 0.25rem;
  vertical-align: middle;
  font-size: 0.9em;
}

/* Iconos en stats */
.stat-icon svg {
  font-size: 2rem;
  color: #667eea;
}
```

## Notas Importantes

1. **No uses emojis en:**
   - Alerts de JavaScript (`alert()`)
   - Console.logs (déjalos limpios o elimínalos)
   - Opciones de `<select>` (los navegadores no los renderizan bien)

2. **Usa iconos en:**
   - Encabezados de página
   - Botones de acción
   - Badges de estado
   - Tarjetas de estadísticas
   - Títulos de secciones

3. **Caracteres especiales aceptables:**
   - `×` para cerrar modales (mejor que `✕`)
   - `-` para separadores
   - `•` para bullets si es necesario

## Comando Rápido para Buscar Emojis

```bash
# Buscar todos los emojis en archivos TSX
grep -r "📊\|📅\|🔍\|✅\|❌\|📝\|📄\|📦\|🏢\|👥\|💬\|🔔\|⚙️\|📧\|🔧" src/ --include="*.tsx"
```

## Ejemplo Completo de Archivo Convertido

Ver `src/components/user/UserHistorial.tsx` como referencia completa de cómo debe quedar un archivo sin emojis.
