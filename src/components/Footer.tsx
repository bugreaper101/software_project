import { Instagram, Facebook, MapPin, Phone, Mail, Clock } from 'lucide-react';
import type { RestaurantSettings } from '@/types/database';

interface FooterProps {
  settings: RestaurantSettings | null;
  onBook: () => void;
}

const dayNames: Record<string, string> = {
  mon: 'Monday', tue: 'Tuesday', wed: 'Wednesday', thu: 'Thursday',
  fri: 'Friday', sat: 'Saturday', sun: 'Sunday',
};

export function Footer({ settings, onBook }: FooterProps) {
  const hours = settings?.hours ?? {};

  return (
    <footer className="relative bg-ink-950 border-t border-white/5">
      <div className="section-pad py-16 lg:py-20">
        <div className="grid gap-12 lg:gap-16 md:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="lg:col-span-1">
            <h3 className="font-serif text-3xl text-cream-50 font-light">Lumière</h3>
            <p className="eyebrow eyebrow-left mt-3 !text-[10px]">Est. 2014</p>
            <p className="mt-5 text-sm text-ink-300 leading-relaxed max-w-xs">
              An evening of French elegance. Seasonal tasting menus, an intimate
              candlelit room, and a cellar to remember.
            </p>
            <div className="flex gap-3 mt-6">
              {settings?.social_instagram && (
                <a
                  href={settings.social_instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="grid place-items-center h-10 w-10 rounded-full border border-white/10 text-ink-200 hover:border-gold-500/60 hover:text-gold-300 transition-colors"
                  aria-label="Instagram"
                >
                  <Instagram size={18} />
                </a>
              )}
              {settings?.social_facebook && (
                <a
                  href={settings.social_facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="grid place-items-center h-10 w-10 rounded-full border border-white/10 text-ink-200 hover:border-gold-500/60 hover:text-gold-300 transition-colors"
                  aria-label="Facebook"
                >
                  <Facebook size={18} />
                </a>
              )}
            </div>
          </div>

          {/* Hours */}
          <div>
            <h4 className="text-xs uppercase tracking-widest2 text-gold-300 mb-5 flex items-center gap-2">
              <Clock size={14} /> Hours
            </h4>
            <ul className="space-y-2.5">
              {Object.entries(hours).map(([day, h]) => (
                <li key={day} className="flex justify-between text-sm">
                  <span className="text-ink-300">{dayNames[day] ?? day}</span>
                  <span className="text-cream-100">
                    {h.closed ? 'Closed' : `${h.open} – ${h.close}`}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-xs uppercase tracking-widest2 text-gold-300 mb-5">Contact</h4>
            <ul className="space-y-3 text-sm">
              {settings?.address && (
                <li className="flex gap-3 text-ink-200">
                  <MapPin size={16} className="mt-0.5 shrink-0 text-gold-500" />
                  <span>{settings.address}</span>
                </li>
              )}
              {settings?.phone && (
                <li className="flex gap-3 text-ink-200">
                  <Phone size={16} className="mt-0.5 shrink-0 text-gold-500" />
                  <a href={`tel:${settings.phone}`} className="hover:text-gold-300 transition-colors">
                    {settings.phone}
                  </a>
                </li>
              )}
              {settings?.email && (
                <li className="flex gap-3 text-ink-200">
                  <Mail size={16} className="mt-0.5 shrink-0 text-gold-500" />
                  <a href={`mailto:${settings.email}`} className="hover:text-gold-300 transition-colors">
                    {settings.email}
                  </a>
                </li>
              )}
            </ul>
          </div>

          {/* CTA */}
          <div>
            <h4 className="text-xs uppercase tracking-widest2 text-gold-300 mb-5">Reservations</h4>
            <p className="text-sm text-ink-300 mb-5 leading-relaxed">
              We welcome parties of up to eight. For larger gatherings and private
              events, please contact us directly.
            </p>
            <button onClick={onBook} className="btn-gold w-full">Book a Table</button>
          </div>
        </div>

        <div className="mt-14 pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-ink-400">
            © {new Date().getFullYear()} Lumière. All rights reserved.
          </p>
          <p className="text-xs text-ink-400">
            Crafted with care · French fine dining
          </p>
        </div>
      </div>
    </footer>
  );
}
