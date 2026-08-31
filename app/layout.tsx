import './globals.css';

export const metadata = {
  title: 'OFIR Pedidos',
  description: 'Gestor de pedidos iFood + Balcão + Delivery próprio'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <link
          rel="stylesheet"
          href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
          integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
          crossOrigin=""
        />
      </head>
      <body className="bg-navy text-white antialiased">{children}</body>
    </html>
  );
}
