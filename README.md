# NestJS E-Commerce API

A comprehensive e-commerce backend API built with NestJS, featuring authentication, product management, order processing, real-time chat, and file uploads.

## 🚀 Features

### Core Features
- **User Authentication & Authorization**
  - JWT-based authentication
  - Google OAuth integration
  - Role-based access control (Admin/User)
  - Email verification with links
  - Password reset functionality
  - OTP verification via SMS/Email

### E-Commerce Functionality
- **Product Management**
  - CRUD operations for products
  - Categories and subcategories
  - Brand management
  - Product search and filtering
  - Tool specifications

- **Shopping Cart & Orders**
  - Shopping cart management
  - Order creation and tracking
  - Order status updates
  - Payment integration (Razorpay)

- **Reviews & Ratings**
  - Product reviews and ratings
  - Review management

### Additional Features
- **File Upload Support**
  - Local file storage
  - Cloudinary integration
  - Supabase storage integration
  - Video upload support

- **Real-time Communication**
  - WebSocket support
  - Real-time chat system
  - Notifications gateway

- **Security & Performance**
  - Rate limiting with Redis
  - CSRF protection
  - Request logging and monitoring
  - Caching with Redis
  - Input validation and sanitization

## 🛠️ Tech Stack

- **Framework**: NestJS
- **Database**: PostgreSQL with TypeORM
- **Cache**: Redis
- **Authentication**: JWT, Passport.js
- **File Storage**: Local/Cloudinary/Supabase
- **Payment**: Razorpay
- **Documentation**: Swagger/OpenAPI
- **Real-time**: WebSockets
- **Validation**: class-validator
- **Security**: Helmet, CORS

## 📋 Prerequisites

- Node.js (v16 or higher)
- PostgreSQL database
- Redis server
- npm or yarn package manager

## 🚀 Installation

1. **Clone the repository**
   \`\`\`bash
   git clone <repository-url>
   cd nestjs-ecommerce-api
   \`\`\`

2. **Install dependencies**
   \`\`\`bash
   npm install
   \`\`\`

3. **Environment Configuration**
   Create environment files based on your setup:
   - `.env.local` for local development
   - `.env.development` for development
   - `.env.production` for production

   Required environment variables:
   \`\`\`env
   # Database
   DATABASE_HOST=localhost
   DATABASE_PORT=5432
   DATABASE_USERNAME=your_username
   DATABASE_PASSWORD=your_password
   DATABASE_NAME=your_database

   # JWT
   JWT_SECRET=your_jwt_secret
   JWT_EXPIRES_IN=1d

   # Redis
   REDIS_HOST=localhost
   REDIS_PORT=6379

   # Storage
   STORAGE_DRIVER=local # or cloudinary/supabase

   # Google OAuth (optional)
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret

   # Razorpay (optional)
   RAZORPAY_KEY_ID=your_razorpay_key
   RAZORPAY_KEY_SECRET=your_razorpay_secret

   # Email/SMS Configuration
   # Add your email and SMS service configurations
   \`\`\`

4. **Start Redis (using Docker)**
   \`\`\`bash
   docker-compose up -d
   \`\`\`

5. **Database Setup**
   \`\`\`bash
   # Run database migrations
   npm run migration:run
   \`\`\`

## 🏃‍♂️ Running the Application

### Development
\`\`\`bash
npm run start:dev
\`\`\`

### Production
\`\`\`bash
npm run build
npm run start:prod
\`\`\`

The API will be available at `http://localhost:3001`

## 📚 API Documentation

Once the application is running, you can access the Swagger documentation at:
- **Swagger UI**: `http://localhost:3001/api`
- **JSON Documentation**: `http://localhost:3001/api-json`
- **YAML Documentation**: `http://localhost:3001/api-yaml`

## 🏗️ Project Structure

\`\`\`
src/
├── admin/              # Admin management
├── auth/               # Authentication & authorization
├── brands/             # Brand management
├── cart/               # Shopping cart functionality
├── categories/         # Product categories
├── chat/               # Real-time chat system
├── common/             # Shared utilities and services
├── config/             # Configuration files
├── csrf/               # CSRF protection
├── email-verification-by-link/  # Email verification
├── file-upload/        # File upload services
├── gateway/            # WebSocket gateway
├── login-using-google/ # Google OAuth
├── order/              # Order management
├── otp/                # OTP verification
├── password/           # Password management
├── payment/            # Payment processing
├── products/           # Product management
├── review/             # Product reviews
├── search/             # Search functionality
├── user/               # User management
├── websockets/         # WebSocket services
├── app.module.ts       # Main application module
└── main.ts             # Application entry point
\`\`\`

## 🔧 Available Scripts

\`\`\`bash
# Development
npm run start:dev      # Start in development mode
npm run start:debug    # Start in debug mode

# Production
npm run build          # Build the application
npm run start:prod     # Start in production mode

# Database
npm run migration:generate  # Generate new migration
npm run migration:run      # Run migrations
npm run migration:revert   # Revert last migration

# Testing
npm run test           # Run unit tests
npm run test:e2e       # Run end-to-end tests
npm run test:cov       # Run tests with coverage

# Linting
npm run lint           # Run ESLint
npm run format         # Format code with Prettier
\`\`\`

## 🔐 Authentication

The API uses JWT tokens for authentication. Include the token in the Authorization header:

\`\`\`
Authorization: Bearer <your-jwt-token>
\`\`\`

### Available Auth Endpoints:
- `POST /auth/register` - User registration
- `POST /auth/login` - User login
- `POST /auth/refresh-token` - Refresh JWT token
- `POST /auth/logout` - User logout
- `POST /auth/forgot-password` - Request password reset
- `POST /auth/reset-password` - Reset password

## 🛡️ Security Features

- **Rate Limiting**: 50 requests per minute per IP
- **CORS**: Configurable cross-origin resource sharing
- **Helmet**: Security headers
- **Input Validation**: Request validation using class-validator
- **JWT Guards**: Protected routes with JWT authentication
- **Role Guards**: Role-based access control

## 📁 File Upload

The application supports multiple storage drivers:

1. **Local Storage**: Files stored in `uploads/` directory
2. **Cloudinary**: Cloud-based image and video management
3. **Supabase**: Supabase storage integration

Configure the storage driver using the `STORAGE_DRIVER` environment variable.

## 🔄 Real-time Features

- **WebSocket Gateway**: Real-time communication
- **Chat System**: Real-time messaging
- **Notifications**: Real-time notifications

## 🚀 Deployment

### Using Docker
\`\`\`bash
# Build and run with Docker Compose
docker-compose up --build
\`\`\`

### Manual Deployment
1. Build the application: `npm run build`
2. Set production environment variables
3. Run database migrations: `npm run migration:run`
4. Start the application: `npm run start:prod`

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-feature`
3. Commit your changes: `git commit -am 'Add new feature'`
4. Push to the branch: `git push origin feature/new-feature`
5. Submit a pull request

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the API documentation at `/api`
- Review the logs for debugging information

## 🔧 Health Check

The application includes a health check endpoint:
- `GET /health` - Check application health status
