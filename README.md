# NestJS E-Commerce API

A production-ready e-commerce backend API built with NestJS, featuring comprehensive authentication, product management, order processing, real-time communication, and secure file handling.

## ✨ Key Features

### 🔐 Authentication & Authorization
- JWT-based authentication with refresh tokens
- Google OAuth 2.0 integration
- Role-based access control (Admin/User)
- Email verification with secure links
- Password reset with email confirmation
- OTP verification via SMS and email
- Session management and logout

### 🛒 E-Commerce Core
- **Product Management**: Full CRUD operations with categories, brands, and specifications
- **Shopping Cart**: Persistent cart with session management
- **Order Processing**: Complete order lifecycle from creation to fulfillment
- **Payment Integration**: Secure payments via Razorpay
- **Search & Filtering**: Advanced product search with multiple filters
- **Reviews & Ratings**: User review system with moderation

### 🚀 Advanced Features
- **Real-time Communication**: WebSocket-based chat and notifications
- **File Management**: Multi-provider support (Local, Cloudinary, Supabase)
- **Caching**: Redis-powered performance optimization
- **Rate Limiting**: API protection against abuse
- **Security**: CSRF protection, input validation, and sanitization
- **Monitoring**: Comprehensive logging and health checks

## 🛠 Technology Stack

| Component | Technology |
|-----------|------------|
| **Framework** | NestJS with TypeScript |
| **Database** | PostgreSQL + TypeORM |
| **Cache** | Redis |
| **Authentication** | JWT + Passport.js |
| **File Storage** | Local/Cloudinary/Supabase |
| **Payments** | Razorpay |
| **Documentation** | Swagger/OpenAPI |
| **Real-time** | WebSockets |
| **Validation** | class-validator |
| **Security** | Helmet, CORS, Rate Limiting |

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v16.0 or higher)
- **PostgreSQL** (v12 or higher)
- **Redis** (v6 or higher)
- **npm** or **yarn** package manager

## 🚀 Quick Start

### 1. Clone and Install

```bash
git clone <repository-url>
cd nestjs-ecommerce-api
npm install
```

### 2. Environment Setup

Create your environment file (`.env.local`, `.env.development`, or `.env.production`):

```env
# Database Configuration
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USERNAME=your_username
DATABASE_PASSWORD=your_password
DATABASE_NAME=ecommerce_db

# Authentication
JWT_SECRET=your_super_secret_jwt_key
JWT_EXPIRES_IN=1d
JWT_REFRESH_SECRET=your_refresh_secret
JWT_REFRESH_EXPIRES_IN=7d

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password

# File Storage
STORAGE_DRIVER=local # Options: local, cloudinary, supabase

# Google OAuth (Optional)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:3001/auth/google/callback

# Payment Gateway (Optional)
RAZORPAY_KEY_ID=your_razorpay_key
RAZORPAY_KEY_SECRET=your_razorpay_secret

# Email Configuration (Configure based on your provider)
SMTP_HOST=your_smtp_host
SMTP_PORT=587
SMTP_USERNAME=your_email
SMTP_PASSWORD=your_email_password

# Application Settings
PORT=3001
NODE_ENV=development
API_PREFIX=api
```

### 3. Start Services

Start Redis using Docker:
```bash
docker-compose up -d redis
```

Or install Redis locally following the [official guide](https://redis.io/download).

### 4. Database Setup

```bash
# Run database migrations
npm run migration:run

# (Optional) Seed initial data
npm run seed
```

### 5. Launch Application

```bash
# Development mode with hot reload
npm run start:dev

# Production mode
npm run build
npm run start:prod
```

Your API will be available at `http://localhost:3001`

## 📖 API Documentation

Access comprehensive API documentation:

- **Interactive Swagger UI**: `http://localhost:3001/api`
- **JSON Format**: `http://localhost:3001/api-json`
- **YAML Format**: `http://localhost:3001/api-yaml`

## 🏗 Project Architecture

```
src/
├── auth/                   # Authentication & JWT management
├── user/                   # User profile & management
├── admin/                  # Admin-specific functionality
├── products/               # Product CRUD & management
├── categories/             # Product categorization
├── brands/                 # Brand management
├── cart/                   # Shopping cart operations
├── order/                  # Order processing & tracking
├── payment/                # Payment integration
├── review/                 # Product reviews & ratings
├── search/                 # Search & filtering
├── file-upload/            # Multi-provider file handling
├── chat/                   # Real-time messaging
├── gateway/                # WebSocket gateway
├── otp/                    # OTP verification
├── email-verification-by-link/ # Email verification
├── password/               # Password reset functionality
├── login-using-google/     # Google OAuth integration
├── csrf/                   # CSRF protection
├── common/                 # Shared utilities & decorators
├── config/                 # Configuration modules
├── websockets/             # WebSocket services
├── app.module.ts           # Root application module
└── main.ts                 # Application bootstrap
```

## 🔧 Available Commands

### Development
```bash
npm run start:dev          # Start with hot reload
npm run start:debug        # Start in debug mode
npm run start              # Start normally
```

### Database
```bash
npm run migration:generate -- --name MigrationName
npm run migration:run      # Apply pending migrations
npm run migration:revert   # Rollback last migration
npm run seed              # Populate initial data
```

## 🔐 Authentication Guide

### JWT Token Usage
Include the JWT token in your request headers:

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Core Authentication Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/auth/register` | POST | User registration |
| `/auth/login` | POST | User login |
| `/auth/refresh` | POST | Refresh access token |
| `/auth/logout` | POST | User logout |
| `/auth/forgot-password` | POST | Request password reset |
| `/auth/reset-password` | POST | Reset password with token |
| `/auth/verify-email` | GET | Verify email address |
| `/auth/google` | GET | Google OAuth login |

### Role-Based Access

- **Public**: No authentication required
- **User**: Requires valid JWT token
- **Admin**: Requires admin role privileges

## 🛡 Security Features

### Built-in Protection
- **Rate Limiting**: 100 requests per 15 minutes per IP
- **CORS**: Configurable cross-origin policies
- **Helmet**: Security headers for common vulnerabilities
- **Input Validation**: Strict request validation using DTOs
- **SQL Injection**: Protected via TypeORM parameterized queries
- **XSS Protection**: Input sanitization and output encoding
- **CSRF Protection**: Token-based CSRF prevention

### Authentication Security
- **JWT Tokens**: Secure token generation and validation
- **Password Hashing**: bcrypt with salt rounds
- **Session Management**: Secure session handling
- **Refresh Tokens**: Automatic token refresh mechanism

## 📁 File Upload Configuration

### Supported Storage Providers

1. **Local Storage**
   ```env
   STORAGE_DRIVER=local
   UPLOAD_PATH=./uploads
   ```

2. **Cloudinary**
   ```env
   STORAGE_DRIVER=cloudinary
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   ```

3. **Supabase Storage**
   ```env
   STORAGE_DRIVER=supabase
   SUPABASE_URL=your_supabase_url
   SUPABASE_ANON_KEY=your_anon_key
   SUPABASE_BUCKET=your_bucket_name
   ```

## 🔄 Real-time Features

### WebSocket Events
- **User Connection**: `user:connected`
- **Chat Messages**: `chat:message`
- **Order Updates**: `order:status_changed`
- **Product Updates**: `product:updated`
- **Notifications**: `notification:new`

### Usage Example
```javascript
const socket = io('ws://localhost:3001');
socket.emit('chat:join_room', { roomId: 'room123' });
socket.on('chat:message', (data) => console.log('New message:', data));
```

## 🚀 Deployment

### Docker Deployment
```bash
# Build and run with Docker Compose
docker-compose up --build -d

# Or build individual container
docker build -t nestjs-ecommerce .
docker run -p 3001:3001 nestjs-ecommerce
```

### Manual Deployment

1. **Build the application**
   ```bash
   npm run build
   ```

2. **Set environment variables**
   ```bash
   export NODE_ENV=production
   export DATABASE_URL=your_production_db_url
   ```

3. **Run migrations**
   ```bash
   npm run migration:run
   ```

4. **Start the server**
   ```bash
   npm run start:prod
   ```

### Logging
The application uses structured logging with different levels:
- **Error**: Application errors and exceptions
- **Warn**: Warning messages and deprecated usage
- **Info**: General application information
- **Debug**: Detailed debug information (development only)

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Make your changes**
4. **Commit your changes**
   ```bash
   git commit -m 'feat: add amazing feature'
   ```
5. **Push to your branch**
   ```bash
   git push origin feature/amazing-feature
   ```
6. **Open a Pull Request**

### Commit Convention
We use [Conventional Commits](https://www.conventionalcommits.org/):
- `feat:` New features
- `fix:` Bug fixes
- `docs:` Documentation updates
- `style:` Code style changes
- `refactor:` Code refactoring
- `chore:` Maintenance tasks

## 🙏 Acknowledgments

- **NestJS Team** for the amazing framework
- **Contributors** who have helped improve this project
- **Community** for feedback and suggestions

---

**Made with ❤️ by the development team**

For more information, visit our [documentation](./docs) or check out the [API reference](http://localhost:3001/api).
