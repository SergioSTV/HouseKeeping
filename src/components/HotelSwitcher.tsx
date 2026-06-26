'use client';
import { useHotel } from '@/providers/HotelProvider';

// Selector de hotel. Si el usuario solo tiene uno asignado, queda fijo sin selector.
export function HotelSwitcher() {
  const { hotels, hotelId, setHotel } = useHotel();
  if (hotels.length <= 1) {
    return (
      <span className="rounded-full bg-white/15 px-3 py-1 text-sm font-medium text-white">
        {hotels[0]?.name ?? ''}
      </span>
    );
  }
  return (
    <select
      value={hotelId ?? ''}
      onChange={(e) => setHotel(e.target.value)}
      className="cursor-pointer rounded-full bg-white/15 px-3 py-1 text-sm font-medium text-white outline-none hover:bg-white/25"
      aria-label="Cambiar de hotel"
    >
      {hotels.map((h) => (
        <option key={h.id} value={h.id} className="text-black">
          {h.name}
        </option>
      ))}
    </select>
  );
}
