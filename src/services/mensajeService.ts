import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  Unsubscribe,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { Mensaje } from '../types/Mensaje';
import { Usuario } from '../types/Usuario';

/**
 * Messaging Service
 * Handles all Firestore operations for the messaging module
 */

// Collection names
const MENSAJES_COLLECTION = 'mensaje'; // Note: singular form in Spanish
const USUARIOS_COLLECTION = 'usuarios';

// ==================== QUERY MESSAGES ====================

/**
 * Subscribe to inbox messages (received, not archived)
 * @param currentUserId - ID of the current user
 * @param callback - Function to call with messages array
 * @returns Unsubscribe function
 */
export const subscribeToInbox = (
  currentUserId: string,
  callback: (messages: Mensaje[]) => void,
  onError?: (error: Error) => void
): Unsubscribe => {
  const q = query(
    collection(db, MENSAJES_COLLECTION),
    where('destinatario', '==', currentUserId),
    where('archivado', '==', false),
    orderBy('fecha_envio', 'desc')
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const messages: Mensaje[] = [];
      snapshot.forEach((doc) => {
        messages.push({ id: doc.id, ...doc.data() } as Mensaje);
      });
      callback(messages);
    },
    (error) => {
      console.error('Error fetching inbox messages:', error);
      onError?.(error);
    }
  );
};

/**
 * Subscribe to sent messages
 * @param currentUserId - ID of the current user
 * @param callback - Function to call with messages array
 * @returns Unsubscribe function
 */
export const subscribeToSentMessages = (
  currentUserId: string,
  callback: (messages: Mensaje[]) => void,
  onError?: (error: Error) => void
): Unsubscribe => {
  const q = query(
    collection(db, MENSAJES_COLLECTION),
    where('remitente', '==', currentUserId),
    where('enviado', '==', true),
    orderBy('fecha_envio', 'desc')
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const messages: Mensaje[] = [];
      snapshot.forEach((doc) => {
        messages.push({ id: doc.id, ...doc.data() } as Mensaje);
      });
      callback(messages);
    },
    (error) => {
      console.error('Error fetching sent messages:', error);
      onError?.(error);
    }
  );
};

/**
 * Subscribe to archived messages
 * @param currentUserId - ID of the current user
 * @param callback - Function to call with messages array
 * @returns Unsubscribe function
 */
export const subscribeToArchivedMessages = (
  currentUserId: string,
  callback: (messages: Mensaje[]) => void,
  onError?: (error: Error) => void
): Unsubscribe => {
  const q = query(
    collection(db, MENSAJES_COLLECTION),
    where('destinatario', '==', currentUserId),
    where('archivado', '==', true),
    orderBy('fecha_envio', 'desc')
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const messages: Mensaje[] = [];
      snapshot.forEach((doc) => {
        messages.push({ id: doc.id, ...doc.data() } as Mensaje);
      });
      callback(messages);
    },
    (error) => {
      console.error('Error fetching archived messages:', error);
      onError?.(error);
    }
  );
};

// ==================== MESSAGE OPERATIONS ====================

/**
 * Send a new message
 * @param remitente - Sender user ID
 * @param destinatario - Recipient user ID
 * @param asunto - Subject line
 * @param contenido - Message content
 * @returns Document ID of the created message
 */
export const sendMessage = async (
  remitente: string,
  destinatario: string,
  asunto: string,
  contenido: string
): Promise<string> => {
  try {
    const mensaje: Omit<Mensaje, 'id'> = {
      remitente,
      destinatario,
      asunto,
      contenido,
      fecha_envio: new Date().toISOString(),
      recibido: false,
      archivado: false,
      enviado: true,
    };

    const docRef = await addDoc(collection(db, MENSAJES_COLLECTION), mensaje);
    return docRef.id;
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
};

/**
 * Mark a message as read
 * @param mensajeId - Message document ID
 */
export const markAsRead = async (mensajeId: string): Promise<void> => {
  try {
    const mensajeRef = doc(db, MENSAJES_COLLECTION, mensajeId);
    await updateDoc(mensajeRef, { recibido: true });
  } catch (error) {
    console.error('Error marking message as read:', error);
    throw error;
  }
};

/**
 * Archive a message
 * @param mensajeId - Message document ID
 */
export const archiveMessage = async (mensajeId: string): Promise<void> => {
  try {
    const mensajeRef = doc(db, MENSAJES_COLLECTION, mensajeId);
    await updateDoc(mensajeRef, { archivado: true });
  } catch (error) {
    console.error('Error archiving message:', error);
    throw error;
  }
};

/**
 * Unarchive a message (move back to inbox)
 * @param mensajeId - Message document ID
 */
export const unarchiveMessage = async (mensajeId: string): Promise<void> => {
  try {
    const mensajeRef = doc(db, MENSAJES_COLLECTION, mensajeId);
    await updateDoc(mensajeRef, { archivado: false });
  } catch (error) {
    console.error('Error unarchiving message:', error);
    throw error;
  }
};

/**
 * Delete a message permanently
 * @param mensajeId - Message document ID
 */
export const deleteMessage = async (mensajeId: string): Promise<void> => {
  try {
    const mensajeRef = doc(db, MENSAJES_COLLECTION, mensajeId);
    await deleteDoc(mensajeRef);
  } catch (error) {
    console.error('Error deleting message:', error);
    throw error;
  }
};

// ==================== USER OPERATIONS ====================

/**
 * Fetch all active users (for recipient selection)
 * @param excludeUserId - User ID to exclude from results (typically current user)
 * @returns Array of active users
 */
export const fetchActiveUsers = async (
  excludeUserId?: string
): Promise<Usuario[]> => {
  try {
    const q = query(
      collection(db, USUARIOS_COLLECTION),
      where('activo', '==', true)
    );

    const snapshot = await getDocs(q);
    const users: Usuario[] = [];

    snapshot.forEach((doc) => {
      const user = { id: doc.id, ...doc.data() } as Usuario;
      // Exclude current user if specified
      if (!excludeUserId || doc.id !== excludeUserId) {
        users.push(user);
      }
    });

    return users;
  } catch (error) {
    console.error('Error fetching active users:', error);
    throw error;
  }
};

/**
 * Fetch a single user by ID
 * @param userId - User document ID
 * @returns Usuario object or null if not found
 */
export const fetchUserById = async (userId: string): Promise<Usuario | null> => {
  try {
    const q = query(
      collection(db, USUARIOS_COLLECTION),
      where('__name__', '==', userId)
    );

    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      return null;
    }

    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data() } as Usuario;
  } catch (error) {
    console.error('Error fetching user:', error);
    throw error;
  }
};

/**
 * Fetch multiple users by IDs
 * @param userIds - Array of user IDs
 * @returns Map of user ID to Usuario object
 */
export const fetchUsersByIds = async (
  userIds: string[]
): Promise<Map<string, Usuario>> => {
  try {
    const usersMap = new Map<string, Usuario>();
    
    if (userIds.length === 0) {
      return usersMap;
    }

    // Fetch all users (since we need to filter by IDs client-side)
    const snapshot = await getDocs(collection(db, USUARIOS_COLLECTION));
    
    snapshot.forEach((doc) => {
      if (userIds.includes(doc.id)) {
        usersMap.set(doc.id, { id: doc.id, ...doc.data() } as Usuario);
      }
    });

    return usersMap;
  } catch (error) {
    console.error('Error fetching users by IDs:', error);
    throw error;
  }
};

// ==================== HELPER FUNCTIONS ====================

/**
 * Format date for display
 * @param fecha_envio - ISO date string
 * @returns Formatted date string (DD/MM/YYYY HH:mm)
 */
export const formatMessageDate = (fecha_envio: string): string => {
  try {
    const date = new Date(fecha_envio);
    return date.toLocaleString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  } catch (error) {
    return 'Fecha no disponible';
  }
};

/**
 * Get content summary (first N characters)
 * @param contenido - Full message content
 * @param maxLength - Maximum characters to return
 * @returns Truncated content with ellipsis
 */
export const getContentSummary = (
  contenido: string,
  maxLength: number = 100
): string => {
  if (contenido.length <= maxLength) {
    return contenido;
  }
  return contenido.substring(0, maxLength) + '...';
};

/**
 * Filter messages by search query
 * @param messages - Array of messages
 * @param usuarios - Map of user ID to Usuario
 * @param query - Search query string
 * @returns Filtered messages array
 */
export const filterMessages = (
  messages: Mensaje[],
  usuarios: Map<string, Usuario>,
  query: string
): Mensaje[] => {
  if (!query || query.trim() === '') {
    return messages;
  }

  const lowerQuery = query.toLowerCase().trim();

  return messages.filter((mensaje) => {
    const remitente = usuarios.get(mensaje.remitente);
    
    // Build full name
    const nombreCompleto = remitente
      ? [
          remitente.primer_nombre,
          remitente.segundo_nombre,
          remitente.primer_apellido,
          remitente.segundo_apellido,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
      : '';
    
    const email = remitente?.email.toLowerCase() || '';
    const asunto = mensaje.asunto.toLowerCase();
    const contenido = mensaje.contenido.toLowerCase();

    return (
      asunto.includes(lowerQuery) ||
      contenido.includes(lowerQuery) ||
      nombreCompleto.includes(lowerQuery) ||
      email.includes(lowerQuery)
    );
  });
};

/**
 * Get unread message count
 * @param messages - Array of messages
 * @returns Count of unread messages
 */
export const getUnreadCount = (messages: Mensaje[]): number => {
  return messages.filter((m) => !m.recibido).length;
};

/**
 * Create reply subject (adds "Re: " prefix if not present)
 * @param originalSubject - Original message subject
 * @returns Reply subject with "Re: " prefix
 */
export const createReplySubject = (originalSubject: string): string => {
  if (originalSubject.toLowerCase().startsWith('re:')) {
    return originalSubject;
  }
  return `Re: ${originalSubject}`;
};
