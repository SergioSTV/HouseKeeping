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
  sucia:           { bg: '#F9CDCD', fg: '#6E1414', stripe: '#D93B3B' },
  limpia:          { bg: '#D6E8B6', fg: '#20450A', stripe: '#5A9018' },
  lista_revision:  { bg: '#F6DBA6', fg: '#5A3205', stripe: '#B06D10' },
  no_molestar:     { bg: '#D9D4FB', fg: '#332B80', stripe: '#7167DA' },
  cliente_no_sale: { bg: '#C6DFF7', fg: '#093B6E', stripe: '#2E82D9' },
  averia_grave:    { bg: '#F2A2A2', fg: '#450F0F', stripe: '#9E2626' },
  sucia_guardia:   { bg: '#E2DCC7', fg: '#28281F', stripe: '#7E7D74' },
};

export const NAV_ITEMS: { path: string; label: string }[] = [
  { path: '/dashboard', label: 'Dashboard' },
  { path: '/rack', label: 'Rack' },
  { path: '/averias', label: 'Averias' },
  { path: '/comentarios', label: 'Comentarios' },
  { path: '/usuarios', label: 'Usuarios' },
];
