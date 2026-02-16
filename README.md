# AdoptMe

A modern pet adoption platform built with SvelteKit, designed to connect pets with loving homes.

## Features

- **Pet Listings** - Browse and search for pets available for adoption
- **User Profiles** - Create accounts, manage pets, and track adoption history
- **Post Types** - General posts, adoption listings, and missing pet reports (lost/found)
- **Multi-language Support** - English and Spanish (i18n)
- **Dark Mode** - Full dark mode support across the app
- **Responsive Design** - Mobile-first, works on all devices
- **Real-time Interactions** - Vote, comment, save, and share posts
- **Contact Verification** - Email and phone verification for secure communication
- **Media Uploads** - Support for images and videos
- **SEO Optimized** - Meta tags and structured data for all pages

## Tech Stack

- **Framework**: [SvelteKit](https://kit.svelte.dev/) with Svelte 5 (Runes)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Animations**: [GSAP](https://greensock.com/gsap/)
- **API**: GraphQL
- **Database**: MongoDB with Mongoose
- **Icons**: [Lucide Svelte](https://lucide.dev/)
- **Rich Text**: TipTap Editor
- **Package Manager**: [Bun](https://bun.sh/)

## Getting Started

### Prerequisites

- [Bun](https://bun.sh/) (v1.0 or higher)
- [Docker](https://www.docker.com/) (for database)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/adoptme-app.git
cd adoptme-app
```

2. Install dependencies:
```bash
bun install
```

3. Start the database:
```bash
docker-compose -f docker-compose.dev.yml up -d
```

4. Seed the database (optional):
```bash
bun run seed
```

5. Start the development server:
```bash
bun run dev
```

The app will be available at `http://localhost:5173`

## Project Structure

```
src/
├── lib/
│   ├── components/     # Reusable Svelte components
│   │   ├── Modal.svelte
│   │   ├── MultiStepModal.svelte
│   │   ├── AddPetModal.svelte
│   │   ├── CreatePostModal.svelte
│   │   ├── PostCard.svelte
│   │   ├── Navbar.svelte
│   │   ├── Footer.svelte
│   │   └── ...
│   ├── i18n/           # Internationalization files
│   │   ├── index.ts
│   │   ├── en.json
│   │   └── es.json
│   ├── models/         # Mongoose models
│   │   ├── User.ts
│   │   ├── Pet.ts
│   │   ├── Post.ts
│   │   └── ...
│   ├── stores/         # Svelte stores
│   │   ├── auth.svelte.ts
│   │   ├── theme.svelte.ts
│   │   └── toast.svelte.ts
│   ├── graphql/        # GraphQL schema and resolvers
│   │   └── schema.ts
│   ├── utils/          # Utility functions
│   └── db.ts           # Database connection
├── routes/
│   ├── +page.svelte    # Home page
│   ├── +layout.svelte  # Root layout
│   ├── login/          # Authentication
│   ├── profile/        # User profile & settings
│   ├── post/[id]/      # Post detail page
│   ├── user/[id]/      # Public user profile
│   ├── about/          # About page
│   ├── contact/        # Contact page
│   ├── support/        # Support page
│   ├── terms/          # Terms of Service
│   └── privacy/        # Privacy Policy
└── app.css             # Global styles
```

## Key Features

### Modal System
The app uses a unified modal system with GSAP animations:
- `Modal.svelte` - Base modal with smooth open/close animations
- `MultiStepModal.svelte` - Multi-step wizard with progress indicators and step transitions

### Post Types
| Type | Description | Requirements |
|------|-------------|--------------|
| General Post | Share updates about your pets | Title, description |
| Adoption Post | List a pet for adoption | Pet selection, verified contact, location, media |
| Missing Pet | Report lost or found pets | Pet info, contact, location, images |

### Authentication
- Email/password registration with password strength requirements
- Terms of Service agreement required during registration
- Email and phone verification for contact methods
- JWT-based authentication

### Internationalization
Full support for English and Spanish with `svelte-i18n`:
```typescript
import { _ } from '$lib/i18n';

// Usage in components
{$_('common.save')}
{$_('auth.login')}
```

## Environment Variables

Create a `.env` file in the root directory:

```env
DATABASE_URL=mongodb://localhost:27017/adoptme
JWT_SECRET=your-secret-key
UPLOAD_DIR=./uploads
```

## Scripts

| Command | Description |
|---------|-------------|
| `bun run dev` | Start development server |
| `bun run build` | Build for production |
| `bun run preview` | Preview production build |
| `bun run seed` | Seed the database |
| `bun run lint` | Run linter |
| `bun run format` | Format code with Prettier |

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support, please visit our [Support Page](/support) or contact us at support@adoptme.com

---

Made with love for pets everywhere
