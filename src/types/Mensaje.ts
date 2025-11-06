export interface Mensaje {
  id: string;
  remitente: string; // User ID of sender
  destinatario: string; // User ID of recipient
  asunto: string; // Subject
  contenido: string; // Message content/body
  fecha_envio: string; // ISO format date string (yyyy-MM-dd'T'HH:mm:ss'Z')
  recibido: boolean; // Read status
  archivado: boolean; // Archived status
  enviado: boolean; // Sent status
}

export interface MensajeDisplay extends Mensaje {
  remitenteNombre?: string; // Sender's full name
  remitenteEmail?: string; // Sender's email
  remitenteDepartamento?: string; // Sender's department ID
  destinatarioNombre?: string; // Recipient's full name
  destinatarioEmail?: string; // Recipient's email
  fechaFormateada?: string; // Formatted date for display (DD/MM/YYYY HH:mm)
  resumenContenido?: string; // Content summary (first 100 chars)
}

export interface MensajeFormData {
  destinatario: string;
  asunto: string;
  contenido: string;
}

export interface MensajeFiltros {
  query?: string; // Search query (searches in subject, content, sender name/email)
  archivado?: boolean; // Filter by archived status
  recibido?: boolean; // Filter by read status
}
