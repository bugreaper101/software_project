export type UserRole = 'admin' | 'manager' | 'staff' | 'guest';

export interface Profile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  phone: string | null;
  created_at: string;
}

export interface TeamMember {
  id: string;
  email: string;
  role: UserRole;
  status: 'invited' | 'active' | 'revoked';
  user_id: string | null;
  invited_by: string | null;
  created_at: string;
}

export interface DayHours {
  open: string;
  close: string;
  closed: boolean;
}

export interface RestaurantSettings {
  id: number;
  name: string;
  tagline: string;
  story: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  map_url: string | null;
  hero_image: string | null;
  social_instagram: string | null;
  social_facebook: string | null;
  hours: Record<string, DayHours>;
  hero_title: string | null;
  hero_title_accent: string | null;
  hero_subtitle: string | null;
  about_eyebrow: string | null;
  about_title: string | null;
  about_image: string | null;
  stat_number: string | null;
  stat_label: string | null;
  feature_1_icon: string | null;
  feature_1_label: string | null;
  feature_2_icon: string | null;
  feature_2_label: string | null;
  feature_3_icon: string | null;
  feature_3_label: string | null;
  menu_eyebrow: string | null;
  menu_title: string | null;
  menu_subtitle: string | null;
  events_eyebrow: string | null;
  events_title: string | null;
  gallery_eyebrow: string | null;
  gallery_title: string | null;
  testimonials_eyebrow: string | null;
  testimonials_title: string | null;
  contact_eyebrow: string | null;
  contact_title: string | null;
  reservation_eyebrow: string | null;
  reservation_title: string | null;
  reservation_subtitle: string | null;
  reservation_bg_image: string | null;
}

export interface MenuCategory {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  subtitle: string | null;
  sort_order: number;
  created_at: string;
}

export interface MenuItem {
  id: string;
  category_id: string | null;
  name: string;
  description: string | null;
  long_description: string | null;
  ingredients: string | null;
  pairing: string | null;
  price: number;
  image_url: string | null;
  available: boolean;
  featured: boolean;
  dietary_tags: string[];
  sort_order: number;
  created_at: string;
}

export interface RestaurantEvent {
  id: string;
  title: string;
  description: string | null;
  event_date: string;
  image_url: string | null;
  price_per_person: number | null;
  capacity: number | null;
  created_at: string;
}

export interface GalleryImage {
  id: string;
  image_url: string;
  caption: string | null;
  category: 'interior' | 'food' | 'events';
  sort_order: number;
  created_at: string;
}

export interface Testimonial {
  id: string;
  author: string;
  title: string | null;
  rating: number;
  quote: string;
  avatar_url: string | null;
  sort_order: number;
  created_at: string;
}

export type ReservationStatus =
  | 'pending'
  | 'confirmed'
  | 'cancelled'
  | 'seated'
  | 'completed';

export interface Reservation {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  party_size: number;
  reservation_date: string;
  reservation_time: string;
  special_requests: string | null;
  status: ReservationStatus;
  user_id: string | null;
  created_at: string;
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export interface MenuItemImage {
  id: string;
  menu_item_id: string;
  image_url: string;
  caption: string | null;
  sort_order: number;
  created_at: string;
}

export type GuestTestimonialStatus = 'pending' | 'approved' | 'rejected' | 'blocked';

export interface GuestTestimonial {
  id: string;
  user_id: string;
  author_name: string;
  avatar_url: string | null;
  rating: number;
  quote: string;
  status: GuestTestimonialStatus;
  sort_order: number;
  created_at: string;
}

export interface GuestMemoryMedia {
  id: string;
  testimonial_id: string;
  user_id: string;
  media_url: string;
  media_type: 'image' | 'video';
  caption: string | null;
  sort_order: number;
  created_at: string;
}
