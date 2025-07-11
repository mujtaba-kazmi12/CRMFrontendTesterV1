# Next.js CRM - Production-Grade CRM System

This is a modern, production-grade CRM system built with Next.js 15, React 18, and MongoDB. It features a clean, modular architecture designed for extensibility and easy maintenance.

> **Note**: This project has been migrated from React + Vite to Next.js. See `NEXTJS_MIGRATION.md` for migration details.

## Features

- **Authentication System**: Secure login, registration, and role-based access control
- **Dashboard**: Interactive analytics and quick access to key features
- **Posts Management**: Create, edit, and manage content with categories and tags
- **User Management**: Admin tools for managing users and permissions
- **Media Library**: Upload and manage images and other media files
- **Settings**: Comprehensive site configuration options
- **Import/Export**: Data portability with JSON and CSV support
- **Responsive Design**: Works on desktop, tablet, and mobile devices

## Getting Started

### Prerequisites

- Node.js 18.x or higher
- MongoDB (local or cloud instance)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/nextjs-crm.git
cd nextjs-crm
```

2. Install dependencies:
```bash
npm install
# or
pnpm install
```

3. Create a `.env.local` file in the root directory with the following variables:
```
# API Configuration
NEXT_PUBLIC_API_BASE_URL=http://localhost:5000/api

# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

4. Start the development server:
```bash
npm run dev
# or
pnpm dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

### Default Login Credentials

- **Admin User**:
  - Email: admin@example.com
  - Password: admin123

- **Editor User**:
  - Email: editor@example.com
  - Password: editor123

- **Regular User**:
  - Email: user@example.com
  - Password: user123

## Project Structure

```
nextjs-crm/
├── components/         # Reusable UI components
│   ├── auth/           # Authentication components
│   ├── import-export/  # Import/export functionality
│   ├── layout/         # Layout components
│   ├── media/          # Media management components
│   ├── posts/          # Post management components
│   ├── settings/       # Settings components
│   ├── ui/             # UI components (buttons, cards, etc.)
│   └── users/          # User management components
├── lib/                # Utility functions and libraries
│   ├── auth.tsx        # Authentication context and hooks
│   └── mongodb/        # MongoDB connection utilities
├── pages/              # Page components
│   └── Dashboard.tsx   # Main dashboard page
├── public/             # Static assets
├── src/                # Source code
│   ├── App.tsx         # Main application component
│   └── types/          # TypeScript type definitions
└── styles/             # CSS and styling
```

## Deployment

### Production Build

To create a production build:

```bash
npm run build
# or
pnpm build
```

### Deployment Options

#### Option 1: Traditional Hosting

1. Build the project
2. Deploy the `dist` directory to your web server

#### Option 2: Docker

A Dockerfile is included for containerized deployment:

```bash
# Build the Docker image
docker build -t nextjs-crm .

# Run the container
docker run -p 3000:3000 nextjs-crm
```

## Extending the CRM

### Adding New Features

The modular architecture makes it easy to add new features:

1. Create new components in the appropriate directory
2. Add new routes in `App.tsx`
3. Update the navigation in `DashboardLayout.tsx`

### Theming

The CRM is designed to support custom themes:

1. Modify the `tailwind.config.js` file to change colors and styling
2. Create custom theme components in a new `themes` directory
3. Import and use your custom theme components

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Built with [React](https://reactjs.org/)
- UI components from [shadcn/ui](https://ui.shadcn.com/)
- Icons from [Lucide](https://lucide.dev/)
- Charts from [Recharts](https://recharts.org/)
