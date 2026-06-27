export type Role =
  | 'admin'
  | 'governanta'
  | 'subgovernanta'
  | 'recepcion'
  | 'camarera'
  | 'camarera_guardia';

export type RoomStatus =
  | 'sucia'
  | 'limpia'
  | 'lista_revision'
  | 'no_molestar'
  | 'cliente_no_sale'
  | 'averia_grave'
  | 'sucia_guardia';

export type CheckoutStatus =
  | 'ninguno'
  | 'ya_checkout'
  | 'checkout_anticipado'
  | 'late_14'
  | 'late_18';

export interface HotelTheme {
  primary: string;
  secondary: string;
  accent: string;
}

export interface Hotel {
  id: string;
  name: string;
  theme: HotelTheme;
  floors: number;
  active: boolean;
}

export interface ActorRef {
  uid: string;
  name: string;
}

export interface Room {
  id: string;
  number: string;
  floor: number;
  status: RoomStatus;
  checkout: CheckoutStatus;
  lateCheckoutDate?: string | null;
  vip: boolean;
  blocked: boolean;
  rush?: boolean;
  updatedBy?: ActorRef;
  updatedAt?: unknown;
}

export interface Averia {
  id: string;
  roomId: string;
  roomNumber: string;
  tipo: string;
  descripcion: string;
  grave: boolean;
  reportadoPor: ActorRef;
  createdAt?: unknown;
  dayKey: string;
}

export interface Comentario {
  id: string;
  roomId: string;
  roomNumber: string;
  texto: string;
  tipo: 'vip' | 'importante' | 'urgente';
  notificarGovernanta: boolean;
  creadoPor: ActorRef;
  createdAt?: unknown;
}

export interface AppUser {
  uid: string;
  email: string;
  displayName: string;
  role: Role;
  assignedHotels: string[];
  mustChangePassword: boolean;
  active: boolean;
}

export interface CambioHabitacion {
  id: string;
  de: string;
  a: string;
  motivo?: string;
  creadoPor: ActorRef;
  createdAt?: unknown;
  dayKey: string;
}

export interface LlegadaExtra {
  id: string;
  personas: number;
  habitacion: string;
  fechaEntrada: string;
  fechaSalida: string;
  creadoPor: ActorRef;
  createdAt?: unknown;
}

export interface ObjetoPerdido {
  id: string;
  descripcion: string;
  lugar: string;
  estado: 'guardado' | 'entregado';
  creadoPor: ActorRef;
  createdAt?: unknown;
}

export interface Pedido {
  id: string;
  habitacion: string;
  descripcion: string;
  estado: 'pendiente' | 'hecho';
  creadoPor: ActorRef;
  createdAt?: unknown;
  dayKey: string;
}
