import TabBar from '@/components/TabBar';
import GuardaAssinatura from '@/components/GuardaAssinatura';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <GuardaAssinatura>
      {children}
      <TabBar />
    </GuardaAssinatura>
  );
}
