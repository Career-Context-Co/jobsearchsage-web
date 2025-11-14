# JobSearchSage

[![Nuxt UI](https://img.shields.io/badge/Made%20with-Nuxt%20UI-00DC82?logo=nuxt&labelColor=020420)](https://ui.nuxt.com)

JobSearchSage transforms job searching into a systematic, learnable skill by enabling professionals to build a structured Career Sage Profile once, then use it across their entire job search.

## Features

- **Career Sage Profile**: Build a comprehensive, structured profile once and reuse it everywhere
- **Dynamic Resume Generation**: Create role-optimized resumes tailored to each application
- **Application Pipeline Tracking**: Manage and track your job applications systematically
- **Smart Communication Templates**: Professional templates with intelligent prefills
- **Sage AI Coaching**: Conversational AI guidance throughout your job search journey

## Tech Stack

Built with modern web technologies:
- [Nuxt 4](https://nuxt.com) - Full-stack Vue framework with SSR
- [Nuxt UI](https://ui.nuxt.com) - Beautiful, accessible component library
- [TypeScript](https://www.typescriptlang.org/) - Type-safe development
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first styling
- [VueUse](https://vueuse.org/) - Vue composition utilities

## Setup

Make sure to install the dependencies:

```bash
pnpm install
```

## Development Server

Start the development server on `http://localhost:3000`:

```bash
pnpm dev
```

## Production

Build the application for production:

```bash
pnpm build
```

Locally preview production build:

```bash
pnpm preview
```

Check out the [deployment documentation](https://nuxt.com/docs/getting-started/deployment) for more information.

## Project Structure

```
app/
├── components/     # Auto-imported Vue components
├── composables/    # Reusable composition functions
├── layouts/        # Application layouts
├── pages/          # File-based routing
└── utils/          # Utility functions

server/
└── api/           # Backend API endpoints

openspec/          # OpenSpec-driven development
├── project.md     # Project conventions and context
├── specs/         # Current specifications
└── changes/       # Change proposals and archives
```

## Development Workflow

This project uses [OpenSpec](https://openspec.dev) for spec-driven development:

- **Creating Changes**: See `openspec/AGENTS.md` for workflow
- **Active Changes**: Run `openspec list`
- **View Specs**: Run `openspec list --specs`

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes following project conventions
4. Submit a pull request

## License

MIT License - see LICENSE file for details
