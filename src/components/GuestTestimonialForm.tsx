import { useRef, useState } from 'react';
import { Star, Loader2, ImagePlus, Video, X, Check, Upload } from 'lucide-react';
import { Modal } from '@/components/Modal';
import { useAuth } from '@/context/AuthContext';
import { useGuestTestimonials, uploadGuestMedia } from '@/hooks/useGuestTestimonials';

interface GuestTestimonialFormProps {
  open: boolean;
  onClose: () => void;
  onSubmitted: () => void;
}

interface PendingMedia {
  file: File;
  previewUrl: string;
  type: 'image' | 'video';
  caption: string;
}

export function GuestTestimonialForm({ open, onClose, onSubmitted }: GuestTestimonialFormProps) {
  const { user, profileName } = useAuth();
  const { submit } = useGuestTestimonials();
  const [authorName, setAuthorName] = useState(profileName ?? '');
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [quote, setQuote] = useState('');
  const [media, setMedia] = useState<PendingMedia[]>([]);
  const [uploading, setUploading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setAuthorName(profileName ?? '');
    setRating(5);
    setQuote('');
    setMedia([]);
    setError(null);
    setDone(false);
  };

  const pickFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setUploading(true);
    const added: PendingMedia[] = files.map((file) => {
      const isVideo = file.type.startsWith('video/');
      return {
        file,
        previewUrl: URL.createObjectURL(file),
        type: isVideo ? 'video' : 'image',
        caption: '',
      };
    });
    setMedia((prev) => [...prev, ...added]);
    setUploading(false);
    if (fileRef.current) fileRef.current.value = '';
  };

  const removeMedia = (idx: number) => {
    setMedia((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateCaption = (idx: number, caption: string) => {
    setMedia((prev) => prev.map((m, i) => (i === idx ? { ...m, caption } : m)));
  };

  const handleSubmit = async () => {
    setError(null);
    if (!quote.trim()) { setError('Please write a few words about your experience.'); return; }
    if (!authorName.trim()) { setError('Please enter your name.'); return; }

    setBusy(true);
    const userId = user?.id;
    if (!userId) { setError('You must be signed in.'); setBusy(false); return; }

    const uploadedMedia: { url: string; type: 'image' | 'video'; caption?: string }[] = [];
    for (const m of media) {
      const { url, error: upErr } = await uploadGuestMedia(m.file, userId);
      if (upErr || !url) {
        setError(`Upload failed: ${upErr}`);
        setBusy(false);
        return;
      }
      uploadedMedia.push({ url, type: m.type, caption: m.caption || undefined });
    }

    const { error: subErr } = await submit({
      authorName: authorName.trim(),
      avatarUrl: null,
      rating,
      quote: quote.trim(),
      media: uploadedMedia,
    });

    if (subErr) { setError(subErr); setBusy(false); return; }
    setDone(true);
    setBusy(false);
    setTimeout(() => { onSubmitted(); reset(); }, 2000);
  };

  const close = () => { reset(); onClose(); };

  return (
    <Modal open={open} onClose={close} title="Share Your Story" description="Tell us about your evening at Lumière" size="lg">
      {done ? (
        <div className="py-12 text-center animate-fade-in">
          <div className="mx-auto grid place-items-center h-16 w-16 rounded-full bg-gold-500/15 border border-gold-500/40 text-gold-300 mb-5">
            <Check size={32} />
          </div>
          <h3 className="font-serif text-2xl text-cream-50">Thank you!</h3>
          <p className="mt-3 text-ink-300 max-w-sm mx-auto">
            Your story has been submitted and is awaiting review. Once approved by our team, it will appear on the site.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Rating */}
          <div>
            <label className="label-field mb-2 block">Your Rating</label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onMouseEnter={() => setHoverRating(n)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={() => setRating(n)}
                  className="transition-transform hover:scale-110"
                  aria-label={`${n} star${n > 1 ? 's' : ''}`}
                >
                  <Star
                    size={28}
                    className={n <= (hoverRating || rating)
                      ? 'fill-gold-400 text-gold-400'
                      : 'fill-transparent text-ink-600'}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="label-field mb-2 block" htmlFor="gt-name">Your Name</label>
            <input
              id="gt-name"
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              className="input-field"
              placeholder="How should we credit you?"
            />
          </div>

          {/* Quote */}
          <div>
            <label className="label-field mb-2 block" htmlFor="gt-quote">Your Story</label>
            <textarea
              id="gt-quote"
              rows={4}
              value={quote}
              onChange={(e) => setQuote(e.target.value)}
              className="input-field resize-none"
              placeholder="Share a memory, a favorite dish, a moment that made the evening special..."
            />
          </div>

          {/* Media upload */}
          <div>
            <label className="label-field mb-2 block">Photos & Videos of Your Memory</label>
            <p className="text-xs text-ink-400 mb-3">
              These will be visible in the guest gallery once your testimonial is approved. They won't appear until approved.
            </p>

            <input
              ref={fileRef}
              type="file"
              accept="image/*,video/*"
              multiple
              onChange={pickFile}
              className="hidden"
            />

            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="w-full border-2 border-dashed border-white/15 rounded-2xl py-8 flex flex-col items-center gap-2 text-ink-300 hover:border-gold-500/40 hover:text-gold-300 transition-colors"
            >
              {uploading ? <Loader2 size={24} className="animate-spin" /> : <Upload size={24} />}
              <span className="text-sm">Click to upload photos or videos</span>
            </button>

            {media.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-4">
                {media.map((m, i) => (
                  <div key={i} className="relative group rounded-xl overflow-hidden h-28 bg-ink-800">
                    {m.type === 'image' ? (
                      <img src={m.previewUrl} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <video src={m.previewUrl} className="h-full w-full object-cover" muted />
                    )}
                    <div className="absolute top-1.5 left-1.5">
                      <span className="inline-flex items-center gap-1 rounded-full bg-ink-950/70 px-2 py-0.5 text-[9px] uppercase tracking-widest2 text-cream-100">
                        {m.type === 'image' ? <ImagePlus size={10} /> : <Video size={10} />} {m.type}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeMedia(i)}
                      className="absolute top-1.5 right-1.5 grid place-items-center h-6 w-6 rounded-full bg-ink-950/70 text-cream-100 hover:bg-wine-500 transition-colors"
                    >
                      <X size={12} />
                    </button>
                    <input
                      value={m.caption}
                      onChange={(e) => updateCaption(i, e.target.value)}
                      placeholder="Caption (optional)"
                      className="absolute bottom-0 inset-x-0 bg-ink-950/80 text-xs text-cream-100 px-2 py-1 outline-none placeholder:text-ink-500"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {error && (
            <div className="rounded-xl bg-wine-500/15 border border-wine-500/40 px-4 py-3 text-sm text-red-300">
              {error}
            </div>
          )}

          <button
            type="button"
            onClick={handleSubmit}
            disabled={busy}
            className="btn-gold w-full btn-gold-lg"
          >
            {busy ? <><Loader2 size={16} className="animate-spin" /> Submitting…</> : 'Share Your Story'}
          </button>
        </div>
      )}
    </Modal>
  );
}
