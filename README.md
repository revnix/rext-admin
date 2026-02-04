# Rext Admin

A modern Next.js application for generating, managing, and utilizing AI-powered content creation. Features a TypeForm-like wizard experience for intuitive topic generation.

## 🔒 Security Notice

**This application has been updated with comprehensive security measures (September 2024).**

Key security features implemented:
- **Server-side API proxy** prevents client-side key exposure
- **Rate limiting** protects against API abuse (60 req/min per IP)
- **Input validation & sanitization** blocks XSS attacks
- **Security headers** via middleware (CSP, HSTS, XSS protection)
- **Environment variable security** with proper isolation

📖 **Review the [Security Implementation Guide](docs/security-implementation.md) before deployment.**

## 🚀 Features

- **TypeForm-Style Topic Builder**: Single-question-per-screen wizard flow
- **AI-Powered Topic Generation**: Generate relevant, targeted topics
- **Modern UI/UX**: Built with Radix UI and Tailwind CSS 4
- **Full TypeScript**: End-to-end type safety
- **Responsive Design**: Optimized for all screen sizes
- **Accessibility First**: WCAG 2.1 AA compliant

## 🛠️ Tech Stack

- **Framework**: Next.js 16 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **UI Components**: Radix UI with shadcn/ui patterns
- **State Management**: Zustand (client) + TanStack Query (server)
- **Forms**: React Hook Form + Zod validation
- **Icons**: Lucide React
- **Testing**: Jest with Testing Library
- **Code Quality**: Biome (ESLint + Prettier replacement)

## 📦 Installation

```bash
# Clone the repository
git clone <repository-url>
cd wrext-admin

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
cp .env.local.example .env.local
# Edit .env.local with your actual API keys (see Environment Setup below)

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## 🔐 Environment Setup

### Required Environment Variables

This application requires proper environment variable configuration for security and functionality.

#### 1. Copy Example Files
```bash
# Copy public environment template
cp .env.example .env

# Copy private environment template
cp .env.local.example .env.local
```

#### 2. Configure API Keys in `.env.local`

⚠️ **IMPORTANT**: Add your actual API keys to `.env.local` (NOT `.env`)

```bash
# Required: Content API authentication
NEXT_PUBLIC_CONTENT_API_KEY=your_actual_content_api_key

# Required: Backend API URL
BACKEND_API_URL=http://127.0.0.1:2024

# Required: AI Provider API Keys
ANTHROPIC_API_KEY=your_anthropic_api_key    # Get from https://console.anthropic.com/
PERPLEXITY_API_KEY=your_perplexity_api_key  # Get from https://www.perplexity.ai/settings/api

# Optional: Additional AI providers (uncomment if needed)
# OPENAI_API_KEY=your_openai_api_key        # Get from https://platform.openai.com/api-keys
# GOOGLE_API_KEY=your_google_api_key        # Get from https://makersuite.google.com/app/apikey
```

#### 3. Security Best Practices

✅ **DO:**
- Keep `.env.local` private and never commit it to git
- Use `.env.local` for sensitive API keys (server-side only)
- Use `.env` for public configuration only

❌ **DON'T:**
- Never add sensitive keys to `.env` (it's tracked by git)
- Never use `NEXT_PUBLIC_` prefix for sensitive data
- Never share or expose API keys in client-side code

#### 4. Production Deployment

For production deployment (Vercel, Netlify, etc.):
1. Set environment variables in your hosting platform dashboard
2. Use the same variable names from `.env.local.example`
3. Never commit actual API keys to your repository

## 🔧 Development

### Available Scripts

#### Development
```bash
npm run dev              # Start development server with Turbopack
npm run build            # Build for production with Turbopack optimizations
npm run start            # Start production server
```

#### Code Quality
```bash
npm run lint             # Run Biome linting and type checking
npm run format           # Format code with Biome
npm run prepare          # Set up Git hooks (runs automatically)
```

#### Testing
```bash
npm run test             # Run Jest test suite
npm run test:watch       # Run tests in watch mode
npm run test:coverage    # Run tests with coverage report
npm run test:ci          # Run tests in CI mode (no watch, with coverage)
```

#### Security & Quality Checks
- **Biome**: Fast linting and formatting (replaces ESLint + Prettier)
- **TypeScript**: Strict mode enabled with comprehensive type checking
- **Husky**: Pre-commit hooks for automated quality checks
- **Jest**: Comprehensive test coverage with Testing Library

### Project Structure

```
wrext-admin/
├── app/                    # Next.js App Router pages
├── components/             # Reusable UI components
│   ├── ui/                # Base UI components (shadcn/ui)
│   └── topic-builder/     # Topic Builder specific components
├── lib/                   # Utility functions and configurations
├── types/                 # TypeScript type definitions
├── docs/                  # Documentation
└── __tests__/             # Test files
```

## 🎯 Topic Builder

The main feature is an AI-powered topic generator with a streamlined wizard:

### Wizard Flow
1. **Getting Started**: Choose your approach (topic-first or industry-first)
2. **Industry & Subject**: Select domain and specific topic (if applicable)
3. **Audience**: Define your target audience (optional)
4. **Goals**: Set content purpose
5. **Review & Generate**: Set topic count and generate topics

### Key Features
- Single question per screen for better focus
- Smooth transitions and animations
- Progress indication
- Smart conditional flow
- Mobile-optimized experience
- Full keyboard navigation
- Screen reader support

## 📚 Documentation

Detailed documentation is available in the `/docs` directory:

- **[Security Implementation Guide](docs/security-implementation.md)** 🔒
- [Component Architecture](docs/component-architecture.md)
- [Accessibility Requirements](docs/accessibility-requirements.md)
- [TypeForm UX Specifications](docs/typeform-ux-specifications.md)
- [Animation Specifications](docs/animation-specifications.md)
- [Topic Questions Overview](topic-questions.md)

## 🔌 API Integration

The application integrates with a Python backend service for AI topic generation:

### Environment Variables
```bash
# In .env.local (server-side only)
BACKEND_API_URL=http://127.0.0.1:2024
NEXT_PUBLIC_CONTENT_API_KEY=your_actual_api_key
ANTHROPIC_API_KEY=your_anthropic_key
PERPLEXITY_API_KEY=your_perplexity_key
```

### API Endpoints
- `POST /api/topics/generate` - Generate topics
- `POST /api/topics/save` - Save topic to library
- `GET /api/topics` - Retrieve saved topics

### Security Architecture

**Comprehensive Security Implementation (September 2024):**

1. **API Security**
   - All external API calls proxied through Next.js API routes
   - API keys stored server-side only (never exposed to client)
   - Request/response validation with comprehensive error handling

2. **Input Protection**
   - Zod schema validation for all inputs
   - XSS detection and content sanitization
   - Length limits and pattern validation
   - Malicious content blocking

3. **Rate Limiting**
   - IP-based rate limiting (60 req/min for API routes)
   - Automatic cleanup of expired entries
   - Configurable limits per endpoint type
   - Rate limit headers for client monitoring

4. **Security Headers**
   - Content Security Policy (CSP) via middleware
   - XSS protection and frame options
   - HSTS for production environments
   - Referrer policy and content-type protection

5. **Environment Security**
   - Strict separation of public/private variables
   - No client-side exposure of sensitive data
   - Environment variable validation on startup

📖 **Detailed Information**: See [Security Implementation Guide](docs/security-implementation.md)

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage
npm test -- --coverage
```

## 🎨 Styling

The project uses Tailwind CSS v4 with custom design tokens:

- Custom color palette optimized for accessibility
- Consistent spacing and typography scales
- Dark mode support (planned)
- Component-specific CSS utilities

## 🔍 Code Quality

- **TypeScript**: Strict mode enabled with comprehensive type checking
- **Biome**: Fast linting and formatting
- **Pre-commit hooks**: Automated code quality checks
- **Testing**: Comprehensive test coverage with Jest

## 📱 Browser Support

- Chrome (last 2 versions)
- Firefox (last 2 versions)
- Safari (last 2 versions)
- Edge (last 2 versions)

## 🚀 Deployment

The application is optimized for deployment on Vercel:

```bash
# Build for production
npm run build

# Test production build locally
npm start
```

### Deploy to Vercel
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-username/wrext-admin)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
