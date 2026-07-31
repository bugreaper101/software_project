import { useEffect, useState } from 'react';
import { Menu, X, User, LogOut, LayoutGrid, Calendar } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import type { Route } from '@/App';

interface NavbarProps {
  onNavigate: (route: Route) => void;
  current: Route;
}

const navLinks = [
  { label: 'Home', target: 'top' },
  { label: 'About', target: 'about' },
  { label: 'Menu', target: 'menu' },
  { label: 'Events', target: 'events' },
  { label: 'Gallery', target: 'gallery' },
  { label: 'Contact', target: 'contact' },
] as const;

export function Navbar({ onNavigate, current }: NavbarProps) {
  const { user, isAdmin, isStaff, profileName, signOut } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollTo = (target: string) => {
    setMobileOpen(false);
    if (current.name !== 'home') {
      onNavigate({ name: 'home' });
      setTimeout(() => doScroll(target), 120);
    } else {
      doScroll(target);
    }
  };

  const doScroll = (target: string) => {
    const el = document.getElementById(target);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const solid = scrolled || current.name !== 'home' || mobileOpen;

  return (
    <>
      <header
        className={`fixed top-0 inset-x-0 z-50 transition-all duration-500 ${
          solid
            ? 'bg-ink-950/85 backdrop-blur-xl border-b border-white/5 py-3'
            : 'bg-transparent py-5'
        }`}
      >
        <nav className="section-pad flex items-center justify-between gap-6">
          <button
            onClick={() => scrollTo('top')}
            className="group flex items-center gap-2.5 shrink-0"
            aria-label="Lumière home"
          >
            <span className="font-serif text-2xl md:text-[1.7rem] tracking-wide text-cream-50 group-hover:text-gold-300 transition-colors">
              Lumière
            </span>
            <span className="hidden sm:block text-gold-500 text-xl leading-none -translate-y-0.5">·</span>
          </button>

          <div className="hidden lg:flex items-center gap-7">
            {navLinks.map((l) => (
              <button
                key={l.target}
                onClick={() => scrollTo(l.target)}
                className="relative text-sm uppercase tracking-widest2 text-ink-200 hover:text-gold-300 transition-colors duration-300 group py-1"
              >
                {l.label}
                <span className="absolute -bottom-0.5 left-0 h-px w-0 bg-gold-500 group-hover:w-full transition-all duration-400" />
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => scrollTo('reservations')}
              className="hidden sm:inline-flex btn-gold !py-2.5 !px-5 !text-xs"
            >
              Book a Table
            </button>

            {user ? (
              <div className="relative">
                <button
                  onClick={() => setMenuOpen((v) => !v)}
                  className="flex items-center gap-2 rounded-full border border-white/10 pl-1 pr-3 py-1 hover:border-gold-500/50 transition-colors"
                >
                  <span className="grid place-items-center h-7 w-7 rounded-full bg-gold-500/15 text-gold-300 text-xs font-medium">
                    {(profileName?.[0] ?? user.email?.[0] ?? 'U').toUpperCase()}
                  </span>
                  <span className="hidden md:block text-xs text-ink-200 max-w-[120px] truncate">
                    {isAdmin ? 'Admin' : isStaff ? 'Staff' : profileName ?? 'Account'}
                  </span>
                </button>
                {menuOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                    <div className="absolute right-0 mt-2 w-56 glass-strong rounded-xl p-2 z-50 animate-scale-in">
                      <div className="px-3 py-2 border-b border-white/10 mb-1">
                        <p className="text-xs text-ink-300">Signed in as</p>
                        <p className="text-sm text-cream-100 truncate">{user.email}</p>
                      </div>
                      {(isAdmin || isStaff) && (
                        <button
                          onClick={() => { setMenuOpen(false); onNavigate({ name: 'reservations' }); }}
                          className="w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-ink-200 hover:bg-white/5 hover:text-gold-300 transition-colors"
                        >
                          <Calendar size={16} /> Manage Reservations
                        </button>
                      )}
                      {isAdmin && (
                        <button
                          onClick={() => { setMenuOpen(false); onNavigate({ name: 'organization' }); }}
                          className={`w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors ${
                            current.name === 'organization'
                              ? 'bg-gold-500/10 text-gold-300'
                              : 'text-ink-200 hover:bg-white/5 hover:text-gold-300'
                          }`}
                        >
                          <LayoutGrid size={16} /> Organization
                        </button>
                      )}
                      <button
                        onClick={() => { setMenuOpen(false); onNavigate({ name: 'home' }); }}
                        className="w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-ink-200 hover:bg-white/5 hover:text-gold-300 transition-colors"
                      >
                        <User size={16} /> View Site
                      </button>
                      <div className="h-px bg-white/10 my-1" />
                      <button
                        onClick={async () => { setMenuOpen(false); await signOut(); onNavigate({ name: 'home' }); }}
                        className="w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-ink-200 hover:bg-wine-500/20 hover:text-red-300 transition-colors"
                      >
                        <LogOut size={16} /> Sign Out
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <button
                onClick={() => onNavigate({ name: 'auth' })}
                className="hidden md:inline-flex items-center gap-2 text-sm text-ink-200 hover:text-gold-300 transition-colors uppercase tracking-widest2"
              >
                <User size={16} /> Sign In
              </button>
            )}

            <button
              className="lg:hidden grid place-items-center h-10 w-10 rounded-full border border-white/10 text-cream-100 hover:border-gold-500/50 transition-colors"
              onClick={() => setMobileOpen((v) => !v)}
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </nav>
      </header>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-ink-950/95 backdrop-blur-xl pt-24 px-6 animate-fade-in">
            <div className="flex flex-col gap-2">
              {navLinks.map((l, i) => (
                <button
                  key={l.target}
                  onClick={() => scrollTo(l.target)}
                  className="text-left text-2xl font-serif font-light text-cream-100 hover:text-gold-300 transition-colors py-3 border-b border-white/5 animate-slide-right"
                  style={{ animationDelay: `${i * 60}ms` }}
                >
                  {l.label}
                </button>
              ))}
              <button
                onClick={() => scrollTo('reservations')}
                className="btn-gold mt-6 w-full"
              >
                Book a Table
              </button>
              {!user && (
                <button
                  onClick={() => { setMobileOpen(false); onNavigate({ name: 'auth' }); }}
                  className="btn-ghost mt-3 w-full"
                >
                  Sign In
                </button>
              )}
              {isAdmin && (
                <button
                  onClick={() => { setMobileOpen(false); onNavigate({ name: 'organization' }); }}
                  className="btn-ghost mt-3 w-full"
                >
                  Organization
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
