# ARPU Future Rise Life Foundation - NGO Website

A modern, responsive website for ARPU Future Rise Life Foundation built with Next.js 16, TypeScript, and Tailwind CSS. The platform supports donation management, referral tracking, and administrative functions.

## Features

- 🎯 **Modern Tech Stack**: Next.js 16 with App Router, TypeScript, Tailwind CSS
- 💳 **Payment Integration**: Razorpay payment gateway for secure donations
- 👥 **User Management**: Role-based authentication with NextAuth.js
- 📊 **Admin Dashboard**: Comprehensive donation and user management
- 🔗 **Referral System**: Hierarchical coordinator and sub-coordinator tracking
- 📱 **Mobile-First**: Responsive design with PWA capabilities
- 🔒 **Security**: Input validation, rate limiting, and secure headers

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB database
- Razorpay account for payment processing

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd arpufrl
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

4. Configure your environment variables in `.env.local`:
   - MongoDB connection string
   - NextAuth.js secret and URL
   - Razorpay API keys
   - Email configuration (optional)

5. Run the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Environment Variables

### Required Variables

- `MONGODB_URI`: MongoDB connection string
- `NEXTAUTH_SECRET`: Secret key for NextAuth.js (minimum 32 characters)
- `NEXTAUTH_URL`: Base URL of your application
- `RAZORPAY_KEY_ID`: Razorpay API key ID
- `RAZORPAY_KEY_SECRET`: Razorpay API key secret
- `RAZORPAY_WEBHOOK_SECRET`: Razorpay webhook secret

### Optional Variables

- `EMAIL_SERVER_HOST`: SMTP server host
- `EMAIL_SERVER_PORT`: SMTP server port
- `EMAIL_SERVER_USER`: SMTP username
- `EMAIL_SERVER_PASSWORD`: SMTP password
- `EMAIL_FROM`: Default sender email address

## Project Structure

```
├── app/                    # Next.js App Router pages
│   ├── (public)/          # Public-facing pages
│   ├── (auth)/            # Authentication pages
│   ├── dashboard/         # Protected dashboard pages
│   └── api/               # API routes
├── components/            # React components
│   ├── ui/               # Shadcn UI components
│   ├── common/           # Shared components
│   ├── forms/            # Form components
│   └── dashboard/        # Dashboard-specific components
├── lib/                  # Utility functions and configurations
├── models/               # Database models and schemas
└── public/               # Static assets
```

## Development

### Available Scripts

- `npm run dev`: Start development server
- `npm run build`: Build for production
- `npm run start`: Start production server
- `npm run lint`: Run ESLint

### Code Style

This project uses:
- ESLint for code linting
- TypeScript for type safety
- Tailwind CSS for styling
- Zod for runtime validation

## Deployment

### Environment Setup

1. Copy `.env.production.example` to configure production environment
2. Ensure all required environment variables are set
3. Configure MongoDB Atlas for production database
4. Set up Razorpay live keys for production payments

### Vercel Deployment

1. Connect your repository to Vercel
2. Configure environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions, please contact the development team or create an issue in the repository.
