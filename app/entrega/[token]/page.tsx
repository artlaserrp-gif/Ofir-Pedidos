'use client';

import { useEffect, useRef, useState } from 'react';

type InfoPedido = {
  numero_pedido: string;
  endereco_entrega: string | null;
  entregador_nome: string;
  loja_nome: string;
  ativo: boolean;
  erro?: string;
};

export default function PaginaEntrega({ params }: { params: { token: string } }) {
  const [info, setInfo] = useState<InfoPedido | null>(null);
  const [rastreando, setRastreando] = useState(false);
  const [erroGps, setErroGps] = useState('');
  const watchIdRef = useRef<number | null>(null);
  const wakeLockRef = useRef<any>(null);

  useEffect(() => {
    fetch(`/api/entrega/${params.token}`)
      .then((r) => r.json())
      .then(setInfo);
  }, [params.token]);

  async function iniciarRastreio() {
    setErroGps('');

    if (!navigator.geolocation) {
      setErroGps('Este navegador não suporta GPS.');
      return;
    }

    // trava a tela ligada enquanto possível — reduz (não elimina) a chance
    // de o Safari pausar o GPS por a tela apagar
    try {
      if ('wakeLock' in navigator) {
        wakeLockRef.current = await (navigator as any).wakeLock.request('screen');
      }
    } catch {
      // se não conseguir travar a tela, segue mesmo assim
    }

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        fetch(`/api/entrega/${params.token}/posicao`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        }).catch(() => {});
      },
      () => setErroGps('Não foi possível acessar sua localização. Verifique a permissão de GPS.'),
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 }
    );

    setRastreando(true);
  }

  function pararRastreio() {
    if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current);
    wakeLockRef.current?.release?.();
    setRastreando(false);
  }

  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current);
      wakeLockRef.current?.release?.();
    };
  }, []);

  if (!info) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-navy text-white">
        <p className="text-white/50">Carregando...</p>
      </div>
    );
  }

  if (info.erro) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-navy text-white px-6 text-center">
        <p className="text-white/60">{info.erro}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-navy text-white flex flex-col items-center justify-center px-6 text-center">
      <p className="text-white/40 text-sm mb-1">{info.loja_nome}</p>
      <h1 className="text-2xl font-bold mb-1">Pedido #{info.numero_pedido}</h1>
      {info.endereco_entrega && <p className="text-white/60 text-sm mb-8">{info.endereco_entrega}</p>}

      {!info.ativo ? (
        <p className="text-white/50">Este pedido não está mais em rota de entrega.</p>
      ) : !rastreando ? (
        <>
          <button
            onClick={iniciarRastreio}
            className="bg-gold text-navy font-bold rounded-full px-8 py-4 text-lg active:scale-95 transition"
          >
            Iniciar entrega
          </button>
          <p className="text-white/40 text-xs mt-4 max-w-xs">
            Isso vai pedir permissão de localização e mostrar sua posição pra loja em tempo real.
          </p>
        </>
      ) : (
        <>
          <div className="w-3 h-3 rounded-full bg-green-400 animate-pulse mb-4" />
          <p className="text-green-400 font-medium mb-1">Rastreando entrega...</p>
          <p className="text-white/40 text-xs mb-8 max-w-xs">
            Mantenha essa tela aberta e a tela do celular ligada durante o trajeto.
          </p>
          <button
            onClick={pararRastreio}
            className="border border-white/20 text-white/70 rounded-full px-6 py-2.5 text-sm active:scale-95 transition"
          >
            Cheguei / Encerrar
          </button>
        </>
      )}

      {erroGps && <p className="text-red-400 text-sm mt-4 max-w-xs">{erroGps}</p>}
    </div>
  );
}
