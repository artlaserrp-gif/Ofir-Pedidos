'use client';

import { useEffect, useState } from 'react';

type Status = { bloqueado: boolean; motivo: string | null; plano: string; diasRestantesTrial: number | null };

export default function GuardaAssinatura({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<Status | null>(null);

  useEffect(() => {
    async function checar() {
      const res = await fetch('/api/loja/status');
      if (res.ok) setStatus(await res.json());
    }
    checar();
    const intervalo = setInterval(checar, 30000); // rechecar a cada 30s
    return () => clearInterval(intervalo);
  }, []);

  if (status?.bloqueado) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
        <div className="w-14 h-14 rounded-full bg-red-500/15 border border-red-500/30 flex items-center justify-center mb-4 text-2xl">
          🔒
        </div>
        <h1 className="text-lg font-bold mb-2">Acesso bloqueado</h1>
        <p className="text-white/50 text-sm max-w-xs">{status.motivo}</p>
        <a
          href="https://wa.me/"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-6 bg-gold text-navy font-semibold rounded-full px-6 py-2.5 text-sm active:scale-95 transition"
        >
          Falar com o suporte
        </a>
      </div>
    );
  }

  return (
    <>
      {status?.plano === 'trial' && status.diasRestantesTrial !== null && (
        <div className="bg-gold/15 border-b border-gold/30 text-gold text-xs text-center py-1.5 px-4">
          {status.diasRestantesTrial > 0
            ? `Teste grátis: ${status.diasRestantesTrial} dia(s) restante(s)`
            : 'Seu teste grátis vence hoje'}
        </div>
      )}
      {children}
    </>
  );
}
