# Sacred Heart Pharmacy PWA

## Overview

A mobile-first Progressive Web App for Sacred Heart Pharmacy in Victoria Layout, Bengaluru. Enables customers to order medicines online with prescription upload, real-time inventory browsing, and order tracking.

**Current State**: Production-ready MVP with full functionality

## Recent Changes

- **Dec 12, 2025**: Initial MVP build
  - Complete frontend with Home, Inventory, Cart, Checkout, Orders, Prescription Upload, and Admin pages
  - Backend API with authentication, orders, medicines, and prescriptions
  - Database seeded with 74+ common Indian medicines
  - PWA setup with service worker for offline support
  - Replit Auth integration for user authentication

## Architecture

### Tech Stack
- **Frontend**: React with TypeScript, Wouter routing, TanStack Query
- **Styling**: Tailwind CSS with medical blue theme, Shadcn UI components
- **Backend**: Express.js with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Replit Auth (OpenID Connect)
- **PWA**: Service worker for offline catalog access

### Project Structure
```
client/
├── src/
│   ├── components/     # Reusable UI components
│   ├── context/        # React context (CartContext)
│   ├── hooks/          # Custom hooks (useAuth, useCart)
│   ├── lib/            # Utilities (queryClient, authUtils)
│   ├── pages/          # Page components
│   └── App.tsx         # Main app with routing
│
server/
├── db.ts              # Database connection
├── index.ts           # Express server entry
├── replitAuth.ts      # Authentication setup
├── routes.ts          # API routes
├── seed.ts            # Database seeding
└── storage.ts         # Data access layer
│
shared/
└── schema.ts          # Drizzle schema & types
```

### Key Features
1. **Home Page**: Pharmacy branding, quick access to upload prescription, browse inventory, WhatsApp contact
2. **Inventory**: Searchable medicine catalog with filters, stock indicators, add to cart
3. **Cart**: Review items, quantity management, prescription requirement alerts
4. **Checkout**: Customer details, pickup/delivery options, order placement
5. **Orders**: Order history with status tracking
6. **Prescription Upload**: Camera/file upload with OCR medicine detection (simulated)
7. **Admin Dashboard**: Order management, stock updates, low stock alerts

### API Routes
- `GET /api/categories` - List medicine categories
- `GET /api/medicines` - List all medicines (with search query support)
- `GET /api/prescriptions` - User's prescriptions (auth required)
- `POST /api/prescriptions/upload` - Upload prescription image
- `GET /api/orders` - User's orders (auth required)
- `POST /api/orders` - Create new order
- `GET /api/admin/orders` - All orders (admin only)
- `PATCH /api/admin/orders/:id` - Update order status (admin only)
- `PATCH /api/admin/medicines/:id` - Update medicine stock/price (admin only)

### Database Schema
- **users**: User accounts (Replit Auth)
- **sessions**: Session storage
- **categories**: Medicine categories
- **medicines**: Medicine inventory
- **prescriptions**: Uploaded prescriptions
- **orders**: Customer orders
- **order_items**: Order line items

## User Preferences

- Medical blue/white color theme
- Mobile-first responsive design
- Clean, professional pharmacy aesthetic
- WhatsApp integration for pharmacist contact

## Store Information

- **Name**: Sacred Heart Pharmacy
- **Address**: 16, Campbell Rd, opposite to ST. PHILOMENA'S HOSPITAL, Austin Town, Victoria Layout, Bengaluru, Karnataka 560047
- **Phone**: +91 96860 36540 (WhatsApp enabled)
- **Hours**: 9 AM - 10 PM, 7 days a week

## Development Notes

- Run `npm run db:push` to sync database schema
- Seed data includes 74+ common Indian medicines
- To make a user admin, update `isAdmin` field in users table
- WhatsApp link uses wa.me format with pre-filled message
