// Horario laboral de la camarera de piso, en hora de Madrid (verano/invierno correcto).
// 06:50 a 15:10.
const INICIO_MIN = 6 * 60 + 50;  // 410
const FIN_MIN = 15 * 60 + 10;    // 910
export const HORARIO_CAMARERA_TXT = '06:50 a 15:10';

function minutosMadrid(d = new Date()): number {
  const partes = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Madrid', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).formatToParts(d);
  const h = Number(partes.find((p) => p.type === 'hour')?.value ?? '0') % 24;
  const m = Number(partes.find((p) => p.type === 'minute')?.value ?? '0');
  return h * 60 + m;
}

// Solo la camarera de piso (rol 'camarera') queda restringida a su horario.
export function dentroHorarioCamarera(d = new Date()): boolean {
  const min = minutosMadrid(d);
  return min >= INICIO_MIN && min < FIN_MIN;
}
