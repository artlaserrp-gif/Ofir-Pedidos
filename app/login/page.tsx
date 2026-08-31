'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [cnpj, setCnpj] = useState('');
  const [pin, setPin] = useState('');
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);
  const router = useRouter();

  async function entrar(e: React.FormEvent) {
    e.preventDefault();
    setErro('');
    setCarregando(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cnpj, pin })
      });
      const data = await res.json();
      if (!res.ok) {
        setErro(data.erro || 'Erro ao entrar.');
        return;
      }
      router.push('/dashboard');
    } catch {
      setErro('Falha de conexão. Tente novamente.');
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <h1 className="text-2xl font-bold tracking-tight">
            OFIR <span className="text-gold">Pedidos</span>
          </h1>
          <p className="text-white/50 text-sm mt-1">iFood · Balcão · Delivery próprio</p>
        </div>

        <form onSubmit={entrar} className="space-y-4">
          <div>
            <label className="text-xs text-white/60 mb-1 block">CNPJ da loja</label>
            <input
              value={cnpj}
              onChange={(e) => setCnpj(e.target.value)}
              placeholder="00.000.000/0000-00"
              className="w-full bg-navy2 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-gold transition"
              inputMode="numeric"
            />
          </div>
          <div>
            <label className="text-xs text-white/60 mb-1 block">PIN</label>
            <input
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="••••"
              type="password"
              inputMode="numeric"
              className="w-full bg-navy2 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-gold transition"
            />
          </div>

          {erro && <p className="text-red-400 text-sm">{erro}</p>}

          <button
            disabled={carregando}
            className="w-full bg-gold text-navy font-semibold rounded-xl py-3 mt-2 active:scale-[0.98] transition disabled:opacity-50"
          >
            {carregando ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <p className="text-center text-white/40 text-sm mt-6">
          Ainda não tem conta?{' '}
          <a href="/cadastro" className="text-gold">
            Criar conta grátis
          </a>
        </p>
      </div>
    </div>
  );
}
