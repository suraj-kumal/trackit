# TrackIt Frontend

## 🚀 Tech Stack

-   Next.js 13+ (App Router)
-   TypeScript
-   Tailwind CSS
-   Shadcn UI Components
-   React

## 📂 Project Structure

```
frontend/
├── app/                    # Next.js App Router Directory
│   ├── components/         # App-specific components
│   ├── dashboard/         # Dashboard module
│   ├── inventory/         # Inventory management
│   ├── login/            # Authentication pages
│   ├── signup/           # User registration
│   ├── forgotpassword/   # Password recovery
│   ├── resetpassword/    # Password reset
│   └── verifyemail/      # Email verification
├── components/            # Shared UI components
│   └── ui/               # Shadcn UI components
└── lib/                  # Utility functions
```

## ⚙️ Prerequisites

-   Node.js 16.8.0 or later
-   pnpm (Package Manager)
-   Git

## 🛠️ Installation

1. **Clone the repository**

```bash
git clone <repository-url>
cd frontend
```

2. **Install dependencies**

```bash
pnpm install
```

3. **Set up environment variables**

```bash
cp .env.example .env.local
```

4. **Start development server**

```bash
pnpm dev
```

## 📱 Available Scripts

```bash
# Development
pnpm dev          # Start development server

# Production
pnpm build        # Build production bundle
pnpm start        # Start production server

# Utilities
pnpm lint         # Run ESLint
pnpm format       # Format code with Prettier
```

## 🔐 Authentication Pages

-   `/login` - User login
-   `/signup` - New user registration
-   `/forgotpassword` - Password recovery
-   `/resetpassword` - Password reset
-   `/verifyemail` - Email verification

## 📊 Main Features

-   **Dashboard**

    -   Analytics overview
    -   Data visualization with charts
    -   Real-time updates

-   **Inventory Management**

    -   Product tracking
    -   Stock management
    -   Inventory analytics

-   **Theme Support**
    -   Dark/Light mode toggle
    -   Responsive design
    -   Custom UI components

## 🎨 UI Components

All UI components are built using Shadcn UI:

-   Alert Dialog
-   Badge
-   Button
-   Card
-   Chart
-   Dialog
-   Dropdown Menu
-   Input
-   Label
-   Select
-   Table
-   Tabs

## 🔧 Configuration Files

-   `next.config.ts` - Next.js configuration
-   `tsconfig.json` - TypeScript configuration
-   `postcss.config.mjs` - PostCSS configuration
-   `components.json` - Shadcn UI configuration
-   `eslint.config.mjs` - ESLint configuration

## 📚 Development Guidelines

### Component Structure

```tsx
// Example component structure
import { FC } from 'react'

interface ComponentProps {
  // Props definition
}

const Component: FC<ComponentProps> = () => {
  return (
    // JSX
  )
}

export default Component
```

### Styling

-   Use Tailwind CSS for styling
-   Follow BEM naming convention for custom CSS
-   Maintain dark/light theme compatibility

## 🔄 State Management

-   React Context for theme/auth state
-   React Query for server state
-   Local state for component-level state

## 📱 Responsive Design

-   Mobile-first approach
-   Breakpoints:
    -   sm: 640px
    -   md: 768px
    -   lg: 1024px
    -   xl: 1280px

## 🧪 Testing

```bash
# Run tests
pnpm test

# Run tests with coverage
pnpm test:coverage
```

## 📦 Production Build

```bash
# Create production build
pnpm build

# Start production server
pnpm start
```

## 🐛 Common Issues

1. **Build Errors**

    - Clear `.next` folder
    - Delete `node_modules` and reinstall

2. **Type Errors**
    - Update TypeScript definitions
    - Check `tsconfig.json` settings

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Open pull request

## 📜 License

MIT License
