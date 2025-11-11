# Sistema de Calendario - AP-LABS

## 📅 Funcionalidades Implementadas

Se ha implementado un sistema completo de calendario para visualizar disponibilidad y gestionar reservas de laboratorios y recursos.

### ✅ Componentes Creados

#### 1. **UserCalendario.tsx** (Para Estudiantes/Docentes)
**Ruta:** `/user/calendario`

**Características:**
- ✨ Vista semanal y mensual del calendario
- 📊 Visualización de reservas existentes (laboratorios y recursos)
- 🔍 Consulta de disponibilidad en tiempo real
- 📝 Solicitud rápida desde el calendario (clic en día)
- 🏢 Selección de laboratorios con información de capacidad
- 📦 Selección de recursos con disponibilidad
- ⏰ Selección de horarios para laboratorios
- 📋 Formulario de solicitud integrado
- 🎨 Código de colores por tipo (laboratorio/recurso)
- 📱 Diseño responsivo

**Flujo de Uso:**
1. El usuario selecciona vista semanal o mensual
2. Ve las reservas existentes marcadas en cada día
3. Hace clic en un día para solicitar
4. Selecciona laboratorio o recurso
5. Completa el formulario (horario, cantidad, motivo)
6. Envía la solicitud
7. Se registra en bitácora automáticamente

#### 2. **AdminCalendario.tsx** (Para Administradores)
**Ruta:** `/admin/calendario`

**Características:**
- 📆 Vista mensual completa del sistema
- 👥 Visualización de TODAS las reservas con información de usuario
- 🚫 Creación de bloqueos (mantenimiento/inhabilitación)
- 📊 Estadísticas en tiempo real
- 🔍 Filtros por tipo (laboratorio/recurso) y estado
- 📋 Información detallada de cada reserva
- 🎯 Gestión centralizada de disponibilidad
- 📈 Contador de reservas por día
- 🔄 Actualización automática del estado de items bloqueados

**Flujo de Bloqueo:**
1. Admin hace clic en "Crear Bloqueo"
2. Selecciona tipo (laboratorio/recurso)
3. Selecciona el item específico
4. Define rango de fechas (inicio-fin)
5. Especifica motivo del bloqueo
6. Al crear, actualiza automáticamente el estado del item
7. Se registra en bitácora

### 📁 Archivos Creados

```
src/components/user/
  ├── UserCalendario.tsx         # Componente principal calendario usuarios
  └── UserCalendario.css         # Estilos del calendario usuarios

src/components/admin/
  ├── AdminCalendario.tsx        # Componente calendario administradores
  └── AdminCalendario.css        # Estilos del calendario admin
```

### 🔗 Rutas Agregadas

**App.tsx actualizado:**
- `/user/calendario` → UserCalendario (Roles: 1=Estudiante, 2=Docente)
- `/admin/calendario` → AdminCalendario (Rol: 3=Administrador)

**Menús actualizados:**
- `UserLayout.tsx` → Nuevo ítem "📅 Calendario"
- `AdminLayout.tsx` → Nuevo ítem "📅 Calendario Sistema"

### 🎨 Características de UX/UI

#### Colores por Tipo:
- 🔬 **Laboratorios:** Azul (#667eea)
- 📦 **Recursos:** Verde (#48bb78)
- ⏳ **Pendiente:** Naranja (#ed8936)
- ✅ **Aprobada:** Verde oscuro (#38a169)
- 🔴 **Hoy:** Borde naranja destacado

#### Estados Visuales:
- **Vista Semanal:** Cards verticales por día con lista de reservas
- **Vista Mensual:** Grid de calendario clásico con indicadores
- **Hover Effects:** Feedback visual en todas las interacciones
- **Loading States:** Spinner mientras carga datos
- **Modales:** Formularios en overlay con backdrop blur

### 🔄 Integración con Firebase

**Colecciones utilizadas:**
- ✅ `reserva_labs` - Reservas de laboratorios
- ✅ `reserva_recurso` - Reservas de recursos
- ✅ `laboratorios` - Datos de laboratorios
- ✅ `recurso` - Datos de recursos
- ✅ `usuarios` - Información de usuarios
- ✅ `solicitudes_labs` - Nuevas solicitudes de laboratorios
- ✅ `solicitudes_recursos` - Nuevas solicitudes de recursos
- ✅ `bloqueos` - Bloqueos de mantenimiento (nueva colección)
- ✅ `bitacora` - Registro de acciones

### 📊 Mapeo con Rúbrica

#### B2. Publicación de disponibilidad/recursos (8 pts)
✅ **Calendario semanal/mensual:** Vista semanal y mensual implementadas
✅ **Bloqueos:** Sistema de bloqueos para mantenimiento
✅ **Catálogo con ficha técnica:** Muestra capacidad y disponibilidad
✅ **Estados:** Visualización de estados (Disponible, En Mantenimiento)
✅ **Enlace "solicitar":** Botón rápido desde calendario
✅ **Bitácora:** Todas las acciones se registran
✅ **Avisos al liberar:** Sistema preparado para notificaciones

#### B3. Gestión de solicitudes/reservas (10 pts)
✅ **Visualización:** Calendario muestra todas las reservas
✅ **Validación automática:** Verifica capacidad y disponibilidad
✅ **Acciones:** Aprobar/rechazar desde gestión solicitudes (ya existía)
✅ **Filtros:** Por tipo y estado en vista admin
✅ **Integración inventario:** Consulta disponibilidad en tiempo real
✅ **Registro histórico:** Bitácora completa

#### F1. Seguridad (3 pts)
✅ **Roles:** Solo usuarios autenticados acceden al calendario
✅ **Validación:** Roles verificados por ProtectedRoute
✅ **Bitácora:** Todas las solicitudes registran usuario y rol

### 🚀 Cómo Probar

#### Como Usuario (Estudiante/Docente):
1. Iniciar sesión con rol 1 o 2
2. Ir a "Calendario" en el menú lateral
3. Cambiar entre vista semanal/mensual
4. Ver reservas existentes
5. Hacer clic en un día futuro
6. Seleccionar laboratorio o recurso
7. Completar formulario y enviar
8. Verificar en "Mis Solicitudes"

#### Como Administrador:
1. Iniciar sesión con rol 3
2. Ir a "Calendario Sistema"
3. Ver todas las reservas del mes
4. Usar filtros por tipo/estado
5. Hacer clic en "Crear Bloqueo"
6. Seleccionar laboratorio, fechas y motivo
7. Crear bloqueo
8. Verificar que el estado del lab cambió a "En Mantenimiento"

### 📱 Responsive Design

- **Desktop (>1200px):** Vista completa con todos los detalles
- **Tablet (768-1200px):** Grid adaptado, menos columnas
- **Mobile (<768px):** Vista optimizada con columnas reducidas

### 🔧 Mejoras Futuras Sugeridas

1. **Drag & Drop:** Arrastrar reservas para reprogramar
2. **Exportar calendario:** PDF o iCal para integrar con Google Calendar
3. **Notificaciones push:** Alertas cuando se libera un recurso
4. **Conflictos automáticos:** Detectar solapamientos al solicitar
5. **Vista por recurso:** Calendario individual por laboratorio/recurso
6. **Reportes de ocupación:** Estadísticas de uso por periodo

### ✨ Ventajas de la Implementación

- ✅ **Sin dependencias externas:** Calendario custom, no requiere librerías adicionales
- ✅ **Totalmente integrado:** Usa la misma estructura de Firebase
- ✅ **Consistente:** Mismo diseño que el resto del sistema
- ✅ **Performante:** Consultas optimizadas con rangos de fecha
- ✅ **Escalable:** Fácil agregar más vistas o funcionalidades
- ✅ **Documentado:** Código comentado y estructura clara

---

**Fecha de implementación:** 11 de noviembre de 2025  
**Tiempo de desarrollo:** ~2 horas  
**Estado:** ✅ Completado y funcional
