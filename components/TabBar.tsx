'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const ABAS = [
  { href: '/dashboard', label: 'Pedidos', icone: '📋' },
  { href: '/dashboard/cardapio', label: 'Cardápio', icone: '🍔' },
  { href: '/dashboard/relatorios', label: 'Relatórios', icone: '📊' }
];

export default function TabBar() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-navy2/95 backdrop-blur border-t border-white/10 flex z-40 print:hidden">
      {ABAS.map((aba) => {
        const ativo = pathname === aba.href;
        return (
          <Link
            key={aba.href}
            href={aba.href}
            className={`flex-1 flex flex-col items-center py-2.5 text-xs transition ${
              ativo ? 'text-gold' : 'text-white/40'
            }`}
          >
            <span className="text-lg leading-none mb-0.5">{aba.icone}</span>
            {aba.label}
          </Link>
        );
      })}
    </nav>
  );
}
