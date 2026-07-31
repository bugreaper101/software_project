import { useEffect, useState } from 'react';
import { X, ChevronLeft, ChevronRight, Quote, Star, Play, Pause, Image as ImageIcon } from 'lucide-react';
import { useGuestMemoryMedia } from '@/hooks/useGuestTestimonials';
import type { GuestTestimonial } from '@/types/database';

interface GuestMemoryModalProps {
  testimonial: GuestTestimonial;
  onClose: () => void;
}

export function GuestMemoryModal({ testimonial, onClose }: GuestMemoryModalProps) {
  const { media, loading } = useGuestMemoryMedia(testimonial.id);
  const [idx, setIdx] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    setIdx(0);
  }, [testimonial.id]);

  useEffect(() => {
    if (media.length <= 1 || paused) return;
    const t = setInterval(() => setIdx((i) => (i + 1) % media.length), 5000);
    return () => clearInterval(t);
  }, [media.length, paused]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') setIdx((i) => (i - 1 + media.length) % media.length);
      if (e.key === 'ArrowRight') setIdx((i) => (i + 1) % media.length);
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [media.length, onClose]);

  const current = media[idx];

  return (
    <div className="fixed inset-0 z-[120] flex flex-col bg-ink-950/95 backdrop-blur-md animate-fade-in">
      {/* Top bar — testimonial quote + close */}
      <div className="relative z-10 flex items-start justify-between gap-6 px-6 py-5 lg:px-12 lg:py-8">
        <div className="flex-1 max-w-3xl">
          <Quote className="text-gold-500/50 mb-3" size={32} />
          <blockquote className="font-serif text-xl lg:text-2xl text-cream-100 font-light leading-relaxed text-balance">
            "{testimonial.quote}"
          </blockquote>
          <div className="mt-4 flex items-center gap-3">
            <div className="flex gap-0.5">
              {Array.from({ length: testimonial.rating }).map((_, i) => (
                <Star key={i} size={14} className="fill-gold-400 text-gold-400" />
              ))}
            </div>
            <span className="font-serif text-gold-300">{testimonial.author_name}</span>
          </div>
        </div>
        <button
          onClick={onClose}
          className="shrink-0 grid place-items-center h-10 w-10 rounded-full bg-white/5 text-cream-100 hover:bg-wine-500/40 transition-colors"
          aria-label="Close"
        >
          <X size={20} />
        </button>
      </div>

      {/* Main stage */}
      <div className="flex-1 relative flex items-center justify-center overflow-hidden">
        {loading ? (
          <div className="skeleton h-full w-full" />
        ) : media.length === 0 ? (
          <div className="text-center">
            <ImageIcon className="mx-auto text-ink-600 mb-4" size={48} />
            <p className="text-ink-400">No photos or videos in this story.</p>
          </div>
        ) : (
          <>
            <div className="relative max-h-full max-w-full w-full h-full flex items-center justify-center">
              {current?.media_type === 'image' ? (
                <img
                  key={current.id}
                  src={current.media_url}
                  alt={current.caption ?? ''}
                  className="max-h-full max-w-full object-contain animate-fade-in"
                />
              ) : current?.media_type === 'video' ? (
                <video
                  key={current.id}
                  src={current.media_url}
                  controls
                  autoPlay
                  className="max-h-full max-w-full object-contain animate-fade-in"
                />
              ) : null}
            </div>

            {/* Caption */}
            {current?.caption && (
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 max-w-xl text-center">
                <p className="text-sm text-cream-200/90 bg-ink-950/60 backdrop-blur-sm rounded-full px-5 py-2">
                  {current.caption}
                </p>
              </div>
            )}

            {/* Nav arrows */}
            {media.length > 1 && (
              <>
                <button
                  onClick={() => setIdx((i) => (i - 1 + media.length) % media.length)}
                  className="absolute left-4 top-1/2 -translate-y-1/2 grid place-items-center h-12 w-12 rounded-full bg-white/5 text-cream-100 hover:bg-gold-500 hover:text-ink-950 transition-all"
                >
                  <ChevronLeft size={22} />
                </button>
                <button
                  onClick={() => setIdx((i) => (i + 1) % media.length)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 grid place-items-center h-12 w-12 rounded-full bg-white/5 text-cream-100 hover:bg-gold-500 hover:text-ink-950 transition-all"
                >
                  <ChevronRight size={22} />
                </button>
              </>
            )}
          </>
        )}
      </div>

      {/* Bottom thumbnail strip */}
      {media.length > 0 && (
        <div className="relative z-10 px-6 py-5 lg:px-12">
          <div className="flex items-center gap-3 overflow-x-auto no-scrollbar">
            {media.map((m, i) => (
              <button
                key={m.id}
                onClick={() => setIdx(i)}
                className={`relative shrink-0 h-16 w-16 rounded-lg overflow-hidden border-2 transition-all ${
                  i === idx ? 'border-gold-400 scale-110' : 'border-transparent opacity-50 hover:opacity-90'
                }`}
              >
                {m.media_type === 'image' ? (
                  <img src={m.media_url} alt="" className="h-full w-full object-cover" />
                ) : (
                  <>
                    <video src={m.media_url} className="h-full w-full object-cover" muted />
                    <Play className="absolute inset-0 m-auto text-white/80" size={16} />
                  </>
                )}
              </button>
            ))}

            {media.length > 1 && (
              <button
                onClick={() => setPaused((p) => !p)}
                className="shrink-0 ml-auto grid place-items-center h-10 w-10 rounded-full border border-white/10 text-cream-100 hover:border-gold-500/50 transition-colors"
                aria-label={paused ? 'Play slideshow' : 'Pause slideshow'}
              >
                {paused ? <Play size={16} /> : <Pause size={16} />}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
