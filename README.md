# Lumière Restaurant Website

A modern restaurant web app built with React, TypeScript, Vite, Tailwind CSS, and Supabase.

This project is designed to present a restaurant brand with a dynamic homepage, menu sections, reservations, guest testimonials, and authenticated admin content editing.

## Features

- Responsive restaurant landing page with hero, menu, events, gallery, and contact sections
- Supabase-powered content and authentication
- Admin editing toolbar to update site content directly
- Reservation modal and menu item details
- Clean modern UI using Tailwind CSS and Lucide icons

## Tech Stack

Our technology choices:
- React 18 for component-based UI
- TypeScript for type safety
- Vite for fast build and dev server
- Tailwind CSS for responsive styling
- Supabase for backend services
- ESLint for code linting
- Jest for testing

## Project Setup

### Requirements

- Node.js 18+ recommended
- npm
- Git

### Install dependencies

```bash
npm install
```

### Environment variables

Create a `.env` file in the project root with the following variables:

```env
VITE_SUPABASE_URL=https://your-supabase-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

If you do not have Supabase credentials yet, sign in to Supabase and create a new project to get the URL and anon key.

### Run locally

```bash
npm run dev
```

Open the URL shown in the terminal, typically `http://localhost:5173`.

### Build for production

```bash
npm run build
```

### Preview production build

```bash
npm run preview
```

### Lint the project

```bash
npm run lint
```

### Type checking

```bash
npm run typecheck
```

## Development Notes

- Entry point: `src/main.tsx`
- Main app shell: `src/App.tsx`
- Supabase client: `src/lib/supabase.ts`
- Page components: `src/pages`
- Shared components: `src/components`
- Styles: `src/index.css`

## Deployment

This project can be deployed to services like Vercel, Netlify, or GitHub Pages.

For GitHub Pages deployment, ensure your `build` output is served from the correct repository branch and `base` path if needed.

## GitHub

Remote repository: `https://github.com/sayem4/software_project.git`

## How to Contribute

1. Create a new branch
2. Make your changes
3. Commit your work
4. Push to GitHub
5. Open a pull request

```bash
git add .
git commit -m "Describe your changes"
git push origin <branch-name>
```

## Project Structure

```
src/
├── components/        # Reusable UI components
│   ├── Navbar.tsx    # Navigation bar with menu
│   ├── Footer.tsx    # Footer with restaurant info
│   ├── AdminToolbar.tsx    # Admin editing controls
│   ├── ContentEditor.tsx    # In-place content editing
│   └── ReservationModal.tsx # Table booking modal
├── context/          # React Context providers
│   └── AuthContext.tsx      # Authentication state management
├── pages/            # Full page components
│   ├── HomePage.tsx         # Main landing page
│   ├── AuthPage.tsx         # Sign-in/Sign-up forms
│   └── AdminPage.tsx        # Admin dashboard
├── hooks/            # Custom React hooks
│   ├── useSiteData.ts       # Fetch restaurant content from Supabase
│   ├── useReservations.ts   # Handle table reservations
│   ├── useGuestTestimonials.ts  # Manage guest feedback
│   └── useGuestMemoryMedia.ts   # Media upload handler
├── lib/              # Utilities and client setup
│   └── supabase.ts   # Supabase client configuration
├── App.tsx           # Main app router and shell
├── main.tsx          # React entry point
└── index.css         # Global Tailwind styles
```

## Key Files & Functions

### Core Application Files

#### `src/App.tsx`
Main application router. Manages page rendering based on current route.
- Routes: `home`, `menu-category`, `auth`, `reservations`, `organization`
- Provides AuthProvider and AdminProvider contexts
- Renders Navbar, Footer, and AdminToolbar components

#### `src/main.tsx`
React entry point. Mounts the App component and initializes the application.

### Authentication & Context

#### `src/context/AuthContext.tsx`
Manages user authentication state and methods.

**Key Functions:**
- `AuthProvider()` — Wraps app with authentication context
- `useAuth()` — Hook to access auth functions and user state
- `signUp(email, password)` — Register new users
- `signIn(email, password)` — Login users
- `resetPassword(email)` — Send password reset email
- `signOut()` — Logout user
- `roleFromUser(user)` — Extract user role from metadata
- `translateAuthError(error)` — Convert auth errors to user messages

**User Roles:** `admin`, `staff`, `guest`

### Pages

#### `src/pages/HomePage.tsx`
Main restaurant landing page with multiple sections.

**Key Sections & Functions:**
- `Hero()` — Welcome banner with CTA buttons
- `About()` — Restaurant story and highlights
- `MenuSection()` — Browse menu by category
- `EventsSection()` — Upcoming events display
- `GallerySection()` — Photo gallery with filtering
- `TestimonialsSection()` — Guest reviews and ratings
- `ContactSection()` — Contact form and info
- `DynamicIcon()` — Renders Lucide icons dynamically

#### `src/pages/AuthPage.tsx`
User authentication interface with multiple forms.

**Features:**
- Sign-in form with email/password
- Sign-up form with validation
- Password reset form
- Role selection for new accounts
- Error handling and loading states

#### `src/pages/AdminPage.tsx`
Admin dashboard for content management.

**Features:**
- Content editing interface
- User management
- Analytics overview

### Data Hooks

#### `src/hooks/useSiteData.ts`
Fetches all restaurant content from Supabase.

**Returns:**
```typescript
{
  restaurantSettings: any,
  menuCategories: any[],
  menuItems: any[],
  events: any[],
  gallery: any[],
  testimonials: any[],
  guestTestimonials: any[],
  loading: boolean,
  error: Error | null,
  reload: () => Promise<void>
}
```

#### `src/hooks/useReservations.ts`
Handles table reservation submissions and tracking.

**Functions:**
- `submitReservation(details)` — Create new reservation
- `getReservations()` — Fetch user's reservations
- `cancelReservation(id)` — Cancel existing booking

#### `src/hooks/useGuestTestimonials.ts`
Manages guest testimonial submissions.

**Functions:**
- `submitTestimonial(text, rating)` — Add new review
- `uploadMedia(file)` — Attach photos to testimonial
- `getTestimonials()` — Fetch approved testimonials

### Supabase Integration

#### `src/lib/supabase.ts`
Supabase client factory with local fallback support.

**Key Functions:**
- `createStubSupabase()` — Mock Supabase for offline development
- `isSupabaseConfigured()` — Check if env vars are set

**Database Tables (expected):**
- `restaurant_settings` — Site configuration
- `menu_categories` — Menu sections
- `menu_items` — Individual menu items
- `menu_item_images` — Item photos
- `events` — Restaurant events
- `gallery` — Gallery images
- `testimonials` — Approved reviews
- `guest_testimonials` — User-submitted reviews
- `reservations` — Table bookings

## Feature Branches

This project uses feature branches for organized development. Each branch focuses on a specific area:

### `feature/homepage-ui`
**Focus:** Homepage UI improvements and component enhancements

**Includes:**
- Hero section styling and animations
- Menu category display and filtering
- Gallery layout and image optimization
- Testimonial carousel implementation
- Contact form styling
- Responsive design adjustments

**Key Files:**
- `src/pages/HomePage.tsx`
- `src/components/Navbar.tsx`
- `src/components/Footer.tsx`

### `feature/auth-flow`
**Focus:** Authentication and user management

**Includes:**
- Sign-up form validation
- Sign-in flow improvements
- Password reset functionality
- Role-based access control
- User profile management
- Session persistence

**Key Files:**
- `src/context/AuthContext.tsx`
- `src/pages/AuthPage.tsx`

### `feature/local-hosting`
**Focus:** Local development environment and Supabase fallback

**Includes:**
- Supabase client configuration
- Environment variable handling
- Mock Supabase for offline development
- Vite development server setup
- Production build optimization
- Error handling and graceful degradation

**Key Files:**
- `src/lib/supabase.ts`
- `vite.config.ts`
- `.env.example`

## Development Workflow

### Running the dev server
```bash
npm run dev
```
Access the app at `http://localhost:5173/software_project/`

### Switching branches
```bash
git checkout <branch-name>
```

### Creating a new branch
```bash
git checkout -b feature/your-feature-name
```

### Committing changes
```bash
git add .
git commit -m "Descriptive commit message"
git push origin <branch-name>
```

### Merging to main
```bash
git checkout main
git merge <branch-name>
git push origin main
```

## Tailwind CSS Configuration

Custom color palette defined in `tailwind.config.js`:
- `ink` — Dark text/backgrounds
- `cream` — Light backgrounds
- `gold` — Accent color
- `wine` — Secondary accent

## ESLint & Code Quality

Run ESLint to check code:
```bash
npm run lint
```

Type check TypeScript:
```bash
npm run typecheck
```

## Troubleshooting

### White screen on load
**Cause:** Missing Supabase environment variables
**Solution:** The app includes a fallback for missing credentials. Add `.env` file with valid Supabase credentials or run without them for demo mode.

### Port already in use
**Solution:** Change the Vite port in `vite.config.ts` or kill the process using port 5173.

### Git push authentication fails
**Solution:** Ensure you have GitHub SSH key configured or use GitHub CLI authentication:
```bash
gh auth login
```

## Notes

If you want to switch this project to SSH authentication for GitHub, update the remote URL to an SSH URL and configure your SSH keys.

For more information on Supabase, visit: https://supabase.com/docs

