import { useEffect, useState } from 'react';
import { AuthProvider } from '@/context/AuthContext';
import { AdminProvider } from '@/context/AdminContext';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { AdminToolbar } from '@/components/AdminToolbar';
import { ContentEditor } from '@/components/ContentEditor';
import { ReservationModal } from '@/components/ReservationModal';
import { HomePage } from '@/pages/HomePage';
import { AuthPage } from '@/pages/AuthPage';
import { ReservationsPage } from '@/pages/ReservationsPage';
import { OrganizationPage } from '@/pages/OrganizationPage';
import { CategoryMenuPage } from '@/pages/CategoryMenuPage';
import { useSiteData } from '@/hooks/useSiteData';

export type Route =
  | { name: 'home' }
  | { name: 'menu-category'; categoryId: string }
  | { name: 'auth' }
  | { name: 'reservations' }
  | { name: 'organization' };

function AppShell() {
  const [route, setRoute] = useState<Route>({ name: 'home' });
  const [reservationOpen, setReservationOpen] = useState(false);
  const { settings } = useSiteData();

  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [route.name]);

  const openReservation = () => setReservationOpen(true);

  const showChrome = route.name !== 'auth';

  return (
    <div className="min-h-screen bg-ink-950 text-cream-100">
      {showChrome && <Navbar onNavigate={setRoute} current={route} />}

      <div className={showChrome ? '' : ''}>
        {route.name === 'home' && <HomePage onOpenReservation={openReservation} onNavigate={setRoute} />}
        {route.name === 'menu-category' && <CategoryMenuPage categoryId={route.categoryId} onNavigate={setRoute} />}
        {route.name === 'auth' && <AuthPage onNavigate={setRoute} />}
        {route.name === 'reservations' && <ReservationsPage onNavigate={setRoute} />}
        {route.name === 'organization' && <OrganizationPage onNavigate={setRoute} />}
      </div>

      {showChrome && <Footer settings={settings} onBook={openReservation} />}

      {showChrome && <AdminToolbar />}
      <ContentEditor />
      <ReservationModal open={reservationOpen} onClose={() => setReservationOpen(false)} />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AdminProvider>
        <AppShell />
      </AdminProvider>
    </AuthProvider>
  );
}
