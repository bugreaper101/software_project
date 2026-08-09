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

- React 18
- TypeScript
- Vite
- Tailwind CSS
- Supabase
- ESLint

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

## Notes

If you want to switch this project to SSH authentication for GitHub, update the remote URL to an SSH URL and configure your SSH keys.


## Branch Note
This branch focuses on homepage UI improvements.

