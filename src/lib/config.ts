// Dominio interno para las cuentas. El usuario escribe solo su nombre
// (ej. "maria") y por dentro se convierte en "maria@saloupark.local".
export const USER_DOMAIN = 'saloupark.local';

export function toEmail(usuario: string): string {
  const u = usuario.trim();
  return u.includes('@') ? u : `${u}@${USER_DOMAIN}`;
}

export function toUsername(email: string): string {
  const suf = `@${USER_DOMAIN}`;
  return email.endsWith(suf) ? email.slice(0, -suf.length) : email;
}
