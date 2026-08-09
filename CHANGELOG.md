# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Comprehensive README.md with project structure, file documentation, and feature branch descriptions
- Enhanced .gitignore with organized sections for dependencies, build output, environment files, and IDE settings
- Three feature branches: `feature/homepage-ui`, `feature/auth-flow`, `feature/local-hosting`
- Supabase fallback handling to allow local development without configured environment variables
- Admin content editing toolbar for in-place site content updates
- Authentication context provider with role-based access control (admin, staff, guest)
- Custom React hooks for site data, reservations, and guest testimonials

### Changed
- Removed all Bolt.new metadata and configuration files
- Updated index.html to remove Bolt references and use project favicon
- Restructured project with clear separation of concerns (components, pages, hooks, context)

### Fixed
- White screen issue by implementing Supabase client fallback for missing environment variables
- GitHub authentication setup and initial repository configuration

## [0.0.1] - 2026-08-10

### Added
- Initial project setup with Vite, React 18, TypeScript, and Tailwind CSS
- Supabase integration with PostgreSQL database support
- Restaurant homepage with hero section, menu, gallery, events, and testimonials
- User authentication system with sign-in, sign-up, and password reset flows
- Reservation system with modal interface
- Admin dashboard for content management
- Local development environment with npm scripts and build pipeline
- Git workflow with main branch and feature branches
- GitHub repository initialization and remote configuration
- ESLint and TypeScript type checking configuration

### Features
- Responsive design with mobile-first approach
- Custom Tailwind CSS color palette (ink, cream, gold, wine)
- Dynamic icon rendering with Lucide React
- Content management directly from the admin interface
- Scroll reveal animations on homepage sections
- Guest testimonial submission system
- Event management and display
- Gallery with image optimization

## Development Notes

### Version Naming Convention
- **Major.Minor.Patch** format (e.g., 1.0.0)
- Increment MAJOR when making breaking changes
- Increment MINOR when adding new features
- Increment PATCH for bug fixes

### Recent Commits
- `c40245f` - Update README.md with comprehensive project documentation
- `a46126a` - Add branch-specific notes to README (feature/local-hosting)
- `727f70c` - Add branch-specific notes to README (feature/auth-flow)
- `d4e0860` - Add branch-specific notes to README (feature/homepage-ui)
- `d39aed6` - Remove Bolt configuration and update dependencies

### Deployment Status
- ✅ Local development environment ready
- ✅ Vite dev server running successfully
- ⏳ Production deployment pending (ready for Vercel, Netlify, or GitHub Pages)
