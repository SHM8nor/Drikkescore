# Drikkescore - Blood Alcohol Content Tracker

A real-time drinking session tracker with blood alcohol content (BAC) calculation and leaderboards.

## Features

- User authentication and registration with BAC calculation profile
- Create and join drinking sessions using session codes
- Track drinks by volume (ml) and alcohol percentage
- Real-time BAC calculation using the Widmark formula
- Automatic BAC decay over time
- Live leaderboard showing rankings during sessions

## Tech Stack

- **Frontend**: React 19 + TypeScript + Vite
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Styling**: CSS (easily replaceable with Tailwind, etc.)
- **BAC Calculation**: Widmark Formula

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── auth/           # Login, Register components
│   ├── session/        # Session management components
│   ├── drinks/         # Drink entry components
│   └── leaderboard/    # Leaderboard display
├── pages/              # Page components
├── lib/                # Utility libraries (Supabase client)
├── utils/              # Helper functions (BAC calculator)
├── hooks/              # Custom React hooks
├── types/              # TypeScript type definitions
├── context/            # React context providers
└── styles/             # Global styles
```

## Getting Started

### Prerequisites

- Node.js 18+
- Supabase account and project

### Installation

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables in `.env`:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

3. Run database migrations (see `DATABASE_SCHEMA.md`)

4. Start the development server:
```bash
npm run dev
```

## Database Schema

See `DATABASE_SCHEMA.md` for complete database schema and SQL setup queries.

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
