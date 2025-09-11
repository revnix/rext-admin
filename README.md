# Wrext Admin

A modern Next.js application for generating, managing, and utilizing AI-powered topics for content creation. Features a TypeForm-like wizard experience for intuitive topic generation.

## 🚀 Features

- **TypeForm-Style Topic Builder**: Single-question-per-screen wizard flow
- **AI-Powered Topic Generation**: Generate relevant, targeted topics
- **Modern UI/UX**: Built with Radix UI and Tailwind CSS 4
- **Full TypeScript**: End-to-end type safety
- **Responsive Design**: Optimized for all screen sizes
- **Accessibility First**: WCAG 2.1 AA compliant

## 🛠️ Tech Stack

- **Framework**: Next.js 15 with App Router
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
cp .env.example .env.local
# Edit .env.local with your API keys

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## 🔧 Development

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run Biome linter
npm run format       # Format code with Biome
npm run type-check   # Check TypeScript types
npm run test         # Run test suite
```

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
3. **Audience**: Define your target audience
4. **Content Type**: Choose format (blog post, social media, etc.)
5. **Goals & Style**: Set purpose and tone
6. **Advanced Options**: Fine-tune with notes and topic count

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

- [Component Architecture](docs/component-architecture.md)
- [Accessibility Requirements](docs/accessibility-requirements.md)
- [TypeForm UX Specifications](docs/typeform-ux-specifications.md)
- [Animation Specifications](docs/animation-specifications.md)
- [Topic Questions Overview](topic-questions.md)

## 🔌 API Integration

The application integrates with a Python backend service for AI topic generation:

### Environment Variables
```bash
BACKEND_API_URL=your_backend_url
CONTENT_API_KEY=your_api_key
```

### API Endpoints
- `POST /api/topics/generate` - Generate topics
- `POST /api/topics/save` - Save topic to library
- `GET /api/topics` - Retrieve saved topics

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
