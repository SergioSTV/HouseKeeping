import type { Role, RoomStatus, CheckoutStatus } from './types';

// ---- Acceso a rutas (apartados de la app) por rol ----
export const ROUTE_ACCESS: Record<string, Role[]> = {
  '/dashboard':   ['admin', 'governanta', 'subgovernanta', 'recepcion', 'camarera_guardia'],
  '/rack':        ['admin', 'governanta', 'subgovernanta', 'recepcion', 'camarera', 'camarera_guardia'],
  '/esperando':   ['admin', 'governanta', 'subgovernanta', 'recepcion', 'camarera', 'camarera_guardia'],
  '/cambiar-password': ['admin', 'governanta', 'subgovernanta', 'recepcion', 'camarera', 'camarera_guardia'],
  '/averias':     ['admin', 'governanta', 'subgovernanta', 'recepcion'],
  '/comentarios': ['admin', 'governanta', 'subgovernanta', 'recepcion'],
  '/usuarios':    ['admin'],
};

export function canAccess(path: string, role: Role): boolean {
  const top = '/' + path.split('/').filter(Boolean)[0];
  const allowed = ROUTE_ACCESS[top];
  return !allowed || allowed.includes(role);
}

// ---- Que estado de habitacion puede fijar cada rol ----
export const STATUS_PERMISSIONS: Record<Role, RoomStatus[]> = {
  admin:         ['sucia', 'limpia', 'lista_revision', 'no_molestar', 'cliente_no_sale', 'averia_grave', 'sucia_guardia'],
  governanta:    ['sucia', 'limpia', 'lista_revision', 'no_molestar', 'cliente_no_sale', 'averia_grave', 'sucia_guardia'],
  subgovernanta: ['sucia', 'limpia', 'lista_revision', 'no_molestar', 'cliente_no_sale', 'averia_grave', 'sucia_guardia'],
  recepcion:     ['limpia', 'sucia'],
  camarera:      ['lista_revision', 'no_molestar', 'cliente_no_sale'],
  camarera_guardia: ['limpia', 'sucia'],
};

// Recepcion gestiona el checkout, no el estado de limpieza.
export const CHECKOUT_PERMISSIONS: Record<Role, boolean> = {
  admin: true,
  governanta: false,
  subgovernanta: false,
  recepcion: true,
  camarera: false,
  camarera_guardia: false,
};

// ---- Etiquetas legibles ----
export const ROLE_LABELS: Record<Role, string> = {
  admin: 'Administrador',
  governanta: 'Governanta',
  subgovernanta: 'Subgovernanta',
  recepcion: 'Recepcion',
  camarera: 'Camarera de piso',
  camarera_guardia: 'Camarera de guardia',
};

export const STATUS_LABELS: Record<RoomStatus, string> = {
  sucia: 'Sucia',
  limpia: 'Limpia',
  lista_revision: 'Lista para revisar',
  no_molestar: 'No molestar',
  cliente_no_sale: 'Cliente no sale',
  averia_grave: 'Averia grave',
  sucia_guardia: 'Sucia guardia',
};

export const CHECKOUT_LABELS: Record<CheckoutStatus, string> = {
  ninguno: 'Sin checkout',
  ya_checkout: 'Ya hizo check out',
  checkout_anticipado: 'Check out anticipado',
  late_14: 'Late check out 14 h',
  late_18: 'Late check out 18 h',
};

// Colores de estado: contraste alto para escanear el rack de un vistazo.
// bg/fg para la etiqueta; stripe para la franja lateral de la tarjeta.
export const STATUS_HEX: Record<RoomStatus, { bg: string; fg: string; stripe: string }> = {
  sucia:           { bg: '#FCEBEB', fg: '#791F1F', stripe: '#E24B4A' },
  limpia:          { bg: '#EAF3DE', fg: '#27500A', stripe: '#639922' },
  lista_revision:  { bg: '#FAEEDA', fg: '#633806', stripe: '#BA7517' },
  no_molestar:     { bg: '#EEEDFE', fg: '#3C3489', stripe: '#7F77DD' },
  cliente_no_sale: { bg: '#E6F1FB', fg: '#0C447C', stripe: '#378ADD' },
  averia_grave:    { bg: '#F7C1C1', fg: '#501313', stripe: '#A32D2D' },
  sucia_guardia:   { bg: '#F1EFE8', fg: '#2C2C2A', stripe: '#888780' },
};

export const NAV_ITEMS: { path: string; label: string }[] = [
  { path: '/dashboard', label: 'Dashboard' },
  { path: '/rack', label: 'Rack' },
  { path: '/averias', label: 'Averias' },
  { path: '/comentarios', label: 'Comentarios' },
  { path: '/usuarios', label: 'Usuarios' },
];
