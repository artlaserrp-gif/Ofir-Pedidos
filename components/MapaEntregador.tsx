'use client';

import { useEffect, useRef } from 'react';

export default function MapaEntregador({ lat, lng }: { lat: number; lng: number }) {
  const mapaRef = useRef<HTMLDivElement>(null);
  const mapaInstanciaRef = useRef<any>(null);
  const marcadorRef = useRef<any>(null);

  useEffect(() => {
    let cancelado = false;

    (async () => {
      const L = (await import('leaflet')).default;
      if (cancelado || !mapaRef.current) return;

      // ícone padrão do Leaflet quebra com bundlers — aponta pro CDN
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png'
      });

      if (!mapaInstanciaRef.current) {
        mapaInstanciaRef.current = L.map(mapaRef.current).setView([lat, lng], 16);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap'
        }).addTo(mapaInstanciaRef.current);
        marcadorRef.current = L.marker([lat, lng]).addTo(mapaInstanciaRef.current);
      } else {
        marcadorRef.current.setLatLng([lat, lng]);
        mapaInstanciaRef.current.panTo([lat, lng]);
      }
    })();

    return () => {
      cancelado = true;
    };
  }, [lat, lng]);

  useEffect(() => {
    return () => {
      mapaInstanciaRef.current?.remove?.();
      mapaInstanciaRef.current = null;
    };
  }, []);

  return <div ref={mapaRef} className="w-full h-64 rounded-xl overflow-hidden" />;
}
