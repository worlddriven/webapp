# Worlddriven Webapp

Modern React frontend for the Worlddriven admin interface, built with Vite and a proxy-only Express server.

## Architecture

This webapp follows a **proxy-only pattern**:

- **Frontend**: React 19 + Vite for fast development and modern UI
- **Backend Proxy**: Thin Express server that forwards API requests to worlddriven/core
- **Authentication**: Converts httpOnly cookies to Authorization headers for security
- **No Database**: All data and business logic lives in worlddriven/core backend

### Why This Pattern?

- **Security**: Authentication tokens stored in httpOnly cookies (not accessible to JavaScript)
- **Separation**: Frontend completely decoupled from backend business logic
- **Simplicity**: Webapp is just UI + proxy, no database or complex server logic
- **Flexibility**: Easy to swap backends or deploy frontend separately

## Technology Stack

### Frontend

- **React 19**: Latest React with modern features
- **Vite**: Lightning-fast build tool and dev server
- **React Router DOM**: Client-side routing
- **Styled Components**: Component-scoped CSS-in-JS
- **TypeScript**: Type checking via JSDoc (no transpilation)

### Backend

- **Express 5**: Minimal server for proxying requests
- **Vite Middleware**: Integrated dev server with HMR

### Code Quality

- **ESLint**: Linting with recommended React rules
- **Prettier**: Code formatting
- **TypeScript**: Type checking without compilation (JSDoc)

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Access to worlddriven/core backend API

### Installation

```bash
npm install
```

### Development

Start the development server with Vite HMR:

```bash
npm start
```

The webapp will be available at `http://localhost:3000` (or the port specified in `PORT` environment variable).

### Environment Variables

Create a `.env` file in the root directory:

```env
# Backend API URL
BACKEND_URL=http://localhost:8080

# Server port (default: 3000)
PORT=3000

# Node environment
NODE_ENV=development
```

## Available Scripts

### `npm start`

Runs the development server with Vite middleware and hot module replacement.

### `npm run build`

Builds the frontend for production to the `dist/` directory.

### `npm run lint`

Runs ESLint to check for code quality issues.

### `npm run fix`

Automatically formats code with Prettier, fixes ESLint issues, and type-checks with TypeScript.

### `npm run check`

Checks code formatting, linting, and types without making changes.

## Project Structure

```
webapp/
├── server/              # Express proxy server
│   ├── index.js        # Main server entry point
│   └── proxy.js        # API proxy with cookie→header conversion
├── src/                # React frontend source
│   ├── components/     # Reusable UI components
│   │   ├── Header.jsx
│   │   ├── Footer.jsx
│   │   └── Layout.jsx
│   ├── pages/          # Page components
│   │   └── Home/
│   ├── App.jsx         # Main app component with routing
│   └── main.jsx        # React entry point
├── public/             # Static assets
│   └── theme.css       # Global CSS variables and reset
├── index.html          # HTML template
├── vite.config.js      # Vite configuration
├── eslint.config.js    # ESLint configuration
├── tsconfig.json       # TypeScript/JSDoc configuration
└── package.json        # Dependencies and scripts
```

## How the Proxy Works

### Cookie to Authorization Header

The proxy server (`server/proxy.js`) converts httpOnly cookies to Authorization headers:

1. **Login Request**: User authenticates via `/api/auth/login`
   - Backend returns `sessionId` in response body
   - Proxy extracts `sessionId` and sets it as httpOnly cookie
   - Removes `sessionId` from response to prevent JavaScript access

2. **Authenticated Requests**: Subsequent API calls
   - Proxy extracts `sessionId` from httpOnly cookie
   - Converts to `Authorization: SESSION <sessionId>` header
   - Forwards request to backend with authorization

3. **Logout Request**: User logs out via `/api/auth/logout`
   - Proxy clears the httpOnly cookie

### Why httpOnly Cookies?

- **XSS Protection**: JavaScript cannot access httpOnly cookies
- **CSRF Protection**: Combined with sameSite=strict attribute
- **Automatic**: Browser handles cookie storage and sending

## Development Workflow

### Adding New Pages

1. Create page component in `src/pages/`
2. Add route in `src/App.jsx`
3. Optionally add navigation link in `src/components/Header.jsx`

Example:

```jsx
// src/pages/Repositories/index.jsx
function Repositories() {
  return <div>Repositories page</div>;
}

export default Repositories;

// src/App.jsx
import Repositories from './pages/Repositories';

<Route path="/repositories" element={<Repositories />} />;
```

### Adding New Components

Create components in `src/components/` and use styled-components for styling:

```jsx
import styled from 'styled-components';

const StyledButton = styled.button`
  background-color: var(--color-primary);
  color: white;
  padding: var(--spacing-md);
  border-radius: var(--radius-md);
`;

function Button({ children, ...props }) {
  return <StyledButton {...props}>{children}</StyledButton>;
}

export default Button;
```

### Type Checking with JSDoc

Use JSDoc comments for TypeScript type checking:

```javascript
/**
 * Fetches repositories from the API
 * @param {string} userId - The user ID
 * @returns {Promise<Array<{id: string, name: string}>>} Array of repositories
 */
async function fetchRepositories(userId) {
  // ...
}
```

## Production Deployment

### Build

```bash
npm run build
```

This creates an optimized production build in the `dist/` directory.

### Running Production Server

```bash
NODE_ENV=production npm start
```

The production server serves the built static files and proxies API requests.

### Environment Configuration

For production, ensure these environment variables are set:

```env
NODE_ENV=production
BACKEND_URL=https://api.worlddriven.org
PORT=3000
```

## Code Quality

### Linting

The project uses ESLint with React-specific rules:

```bash
npm run lint
```

### Formatting

Prettier is configured for consistent code formatting:

```bash
npx prettier --write .
```

### Type Checking

TypeScript compiler checks JSDoc types without transpilation:

```bash
npx tsc --noEmit
```

### All Checks

Run all quality checks at once:

```bash
npm run check
```

## Contributing

This project follows the Worlddriven philosophy of democratic development. Changes are proposed via pull requests and merged through time-based voting.

See the [worlddriven/documentation](https://github.com/worlddriven/documentation) repository for more information about the democratic development process.

## License

This project is part of the Worlddriven organization and follows the same license as the core project.
