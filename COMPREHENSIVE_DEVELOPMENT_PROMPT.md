# 🚀 DEVELOPMENT SESSION INITIALIZATION

You are tasked with building a **Pakistan Gaming Marketplace** - a P2P platform for trading digital gaming assets. This is a **systematic 60-phase development approach** where each phase must be completed and manually tested before proceeding to the next.

## ⚠️ CRITICAL RULES:
1. **COMPLETE ONLY ONE PHASE AT A TIME**
2. **WAIT FOR MANUAL TEST CONFIRMATION** before proceeding
3. **DO NOT SKIP ANY PHASE** - each builds on the previous
4. **ASK FOR CONFIRMATION** after each phase completion
5. **USE TODOWRITE TOOL** to track all phases and mark progress

---

## 📋 PROJECT CONTEXT

**Tech Stack:**
- Frontend: Next.js 14, TailwindCSS, Shadcn/UI, Zustand, TanStack Query, Socket.io-client
- Backend: Node.js, Fastify, PostgreSQL, Prisma, Redis, Socket.io, Bull Queue  
- Deployment: Vercel (Frontend), Railway (Backend)
- File Storage: Cloudinary
- Payments: JazzCash/Easypaisa APIs

**Core Features:**
- User authentication (simple signup: username, email, password)
- Game/Category browsing (hierarchical: Games → Categories → Listings)
- P2P marketplace with escrow system
- Real-time chat for buyer-seller communication  
- Commission system (5-15% based on category)
- Review/Rating system
- Admin panel for management
- Mobile-first responsive design

**Database Schema Overview:**
```sql
-- Core tables needed:
users, games, categories, listings, orders, messages, reviews, 
transactions, withdrawals, user_limits, blacklist
```

---

# 🎯 60-PHASE DEVELOPMENT PLAN

## PHASE 1: Project Structure Setup
**Task:** Create the complete folder structure for both frontend and backend
**Files to create:**
```
marketplace/
├── frontend/ (Next.js app)
├── backend/ (Fastify app)  
├── shared/ (shared types)
└── README.md
```

**Deliverables:**
- Root `marketplace/` folder
- `frontend/` with Next.js 14 initialized (`npx create-next-app@latest frontend --typescript --tailwind --eslint --app`)
- `backend/` with basic Node.js structure and package.json
- `shared/` folder for TypeScript types
- Root README.md with project overview

**Manual Test (1 min):**
1. Verify folder structure exists as specified
2. Run `cd frontend && npm run dev` - should start Next.js on localhost:3000
3. Run `cd backend && npm init -y` - should create package.json
4. Check that all folders are present and accessible

**Success Criteria:** ✅ Folder structure created, Next.js runs without errors

---

## PHASE 2: Backend Dependencies Installation
**Task:** Install all required backend dependencies and setup basic server

**Dependencies to install:**
```bash
npm install fastify @fastify/cors @fastify/jwt @fastify/multipart
npm install prisma @prisma/client bcryptjs
npm install redis ioredis bull
npm install socket.io
npm install zod
npm install --save-dev @types/node @types/bcryptjs typescript ts-node nodemon
```

**Deliverables:**
- Complete package.json with all dependencies
- Basic server.ts with Fastify setup
- TypeScript configuration (tsconfig.json)
- Development scripts in package.json

**Manual Test (90 seconds):**
1. Run `npm install` in backend folder - should complete without errors
2. Create basic server.ts file with Fastify hello world
3. Run `npm run dev` - server should start on specified port
4. Visit http://localhost:8000 - should see "Hello World" response

**Success Criteria:** ✅ All dependencies installed, basic server runs successfully

---

## PHASE 3: Database Setup & Prisma Configuration  
**Task:** Setup PostgreSQL connection and initialize Prisma

**Deliverables:**
- Database connection (local PostgreSQL or Neon.tech)
- Prisma schema file initialization
- Environment variables setup
- Database connection test

**Manual Test (2 min):**
1. Create `.env` file with DATABASE_URL
2. Run `npx prisma init` - should create prisma folder and schema
3. Run `npx prisma db push` - should connect to database successfully
4. Run `npx prisma studio` - should open Prisma studio in browser

**Success Criteria:** ✅ Database connected, Prisma initialized and accessible

---

## PHASE 4: Core Database Schema - Users Table
**Task:** Create the users table with all required fields

**Schema to implement:**
```prisma
model User {
  id            String    @id @default(cuid())
  username      String    @unique
  email         String    @unique  
  passwordHash  String
  role          UserRole  @default(USER)
  verified      Boolean   @default(false)
  balance       Decimal   @default(0) @db.Decimal(10,2)
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
}

enum UserRole {
  USER
  ADMIN
  MODERATOR
  SUPPORT
}
```

**Deliverables:**
- Updated prisma/schema.prisma
- Migration files created
- Database updated with users table

**Manual Test (1 min):**
1. Run `npx prisma db push` - should update database
2. Run `npx prisma studio` - verify users table exists with all fields
3. Manually create a test user record in Prisma studio
4. Verify the test user appears in the table

**Success Criteria:** ✅ Users table created with correct schema, test record inserted

---

## PHASE 5: Core Database Schema - Games & Categories
**Task:** Create games and categories tables with relationship

**Schema to implement:**
```prisma
model Game {
  id           String     @id @default(cuid())
  name         String
  slug         String     @unique
  imageUrl     String?
  platformTypes String[] // ["PC", "Mobile", "Console"]
  orderIndex   Int        @default(0)
  active       Boolean    @default(true)
  categories   Category[]
  listings     Listing[]
  createdAt    DateTime   @default(now())
}

model Category {
  id             String   @id @default(cuid())
  gameId         String
  name           String
  slug           String
  commissionRate Decimal  @default(10) @db.Decimal(5,2)
  fieldsConfig   Json?    // Dynamic field configuration
  active         Boolean  @default(true)
  game           Game     @relation(fields: [gameId], references: [id])
  listings       Listing[]
  
  @@unique([gameId, slug])
}
```

**Manual Test (2 min):**
1. Run `npx prisma db push` - should create both tables
2. In Prisma studio, create a test game: "Call of Duty", slug: "call-of-duty"
3. Create a category for this game: "Accounts", slug: "accounts", commissionRate: 10
4. Verify the relationship works - category should show linked game

**Success Criteria:** ✅ Games and categories tables created, relationships working

---

## PHASE 6: Listings & Orders Schema
**Task:** Create listings and orders tables for the marketplace core

**Schema to implement:**
```prisma
model Listing {
  id           String      @id @default(cuid())
  sellerId     String
  gameId       String
  categoryId   String
  title        String
  price        Decimal     @db.Decimal(10,2)
  description  String      @db.Text
  deliveryType DeliveryType @default(MANUAL)
  stockType    StockType   @default(LIMITED)
  quantity     Int?
  images       String[]    // Array of image URLs
  customFields Json?       // Dynamic fields based on category
  boostedAt    DateTime?
  hidden       Boolean     @default(false)
  active       Boolean     @default(true)
  createdAt    DateTime    @default(now())
  
  seller       User        @relation("UserListings", fields: [sellerId], references: [id])
  game         Game        @relation(fields: [gameId], references: [id])
  category     Category    @relation(fields: [categoryId], references: [id])
  orders       Order[]
}

model Order {
  id              String      @id @default(cuid())
  listingId       String
  buyerId         String
  sellerId        String
  amount          Decimal     @db.Decimal(10,2)
  commission      Decimal     @db.Decimal(10,2)
  status          OrderStatus @default(PENDING)
  paymentMethod   String?
  escrowReleaseAt DateTime?
  createdAt       DateTime    @default(now())
  
  listing         Listing     @relation(fields: [listingId], references: [id])
  buyer           User        @relation("BuyerOrders", fields: [buyerId], references: [id])
  seller          User        @relation("SellerOrders", fields: [sellerId], references: [id])
  messages        Message[]
  reviews         Review[]
}

enum DeliveryType {
  INSTANT
  MANUAL
}

enum StockType {
  LIMITED
  UNLIMITED
}

enum OrderStatus {
  PENDING
  PAID
  DELIVERED
  COMPLETED
  CANCELLED
  DISPUTED
}
```

**Manual Test (2 min):**
1. Run `npx prisma db push` - should create listings and orders tables
2. Create a test listing in Prisma studio for the existing game/category
3. Create a test order for this listing
4. Verify all relationships work and foreign keys are properly connected

**Success Criteria:** ✅ Listings and orders tables created with proper relationships

---

## PHASE 7: Chat & Communication Schema  
**Task:** Create messages, reviews and transaction tables

**Schema to implement:**
```prisma
model Message {
  id                  String    @id @default(cuid())
  orderId             String
  senderId            String
  receiverId          String
  content             String    @db.Text
  type                MessageType @default(TEXT)
  attachmentUrl       String?
  isAutomatedDelivery Boolean   @default(false)
  readAt              DateTime?
  createdAt           DateTime  @default(now())
  
  order               Order     @relation(fields: [orderId], references: [id])
  sender              User      @relation("SentMessages", fields: [senderId], references: [id])
  receiver            User      @relation("ReceivedMessages", fields: [receiverId], references: [id])
}

model Review {
  id        String   @id @default(cuid())
  orderId   String   @unique
  buyerId   String
  sellerId  String
  rating    Int      // 1-5 stars
  comment   String   @db.Text
  createdAt DateTime @default(now())
  
  order     Order    @relation(fields: [orderId], references: [id])
  buyer     User     @relation("BuyerReviews", fields: [buyerId], references: [id])
  seller    User     @relation("SellerReviews", fields: [sellerId], references: [id])
}

model Transaction {
  id            String            @id @default(cuid())
  userId        String
  orderId       String?
  type          TransactionType
  amount        Decimal           @db.Decimal(10,2)
  status        TransactionStatus @default(PENDING)
  paymentMethod String?
  referenceId   String?
  createdAt     DateTime          @default(now())
  
  user          User              @relation(fields: [userId], references: [id])
  order         Order?            @relation(fields: [orderId], references: [id])
}

enum MessageType {
  TEXT
  IMAGE
  SYSTEM
}

enum TransactionType {
  DEPOSIT
  WITHDRAWAL
  PURCHASE
  SALE
  COMMISSION
  REFUND
}

enum TransactionStatus {
  PENDING
  COMPLETED
  FAILED
  CANCELLED
}
```

**Manual Test (90 seconds):**
1. Run `npx prisma db push` - should create all remaining tables
2. Create test message between two users for existing order
3. Create test review for the order
4. Create test transaction records
5. Verify all relationships and foreign keys work correctly

**Success Criteria:** ✅ All communication and transaction tables created successfully

---

## PHASE 8: Backend Authentication API - Registration
**Task:** Create user registration endpoint with validation

**Deliverables:**
- POST /api/auth/register endpoint
- Password hashing with bcrypt
- Input validation with Zod
- Duplicate email/username handling

**API Endpoint:**
```typescript
POST /api/auth/register
Body: {
  username: string,
  email: string, 
  password: string
}
Response: {
  success: boolean,
  user?: { id, username, email, role, createdAt },
  error?: string
}
```

**Manual Test (2 min):**
1. Start backend server (`npm run dev`)
2. Use Postman/curl to test registration:
   ```bash
   curl -X POST http://localhost:8000/api/auth/register \
     -H "Content-Type: application/json" \
     -d '{"username":"testuser","email":"test@email.com","password":"password123"}'
   ```
3. Should return success with user data
4. Test duplicate email - should return error
5. Check database - user should be created

**Success Criteria:** ✅ Registration endpoint works, validates input, prevents duplicates

---

## PHASE 9: Backend Authentication API - Login & JWT
**Task:** Create login endpoint with JWT token generation

**Deliverables:**
- POST /api/auth/login endpoint  
- Password verification
- JWT token generation
- Token includes user ID and role

**API Endpoint:**
```typescript
POST /api/auth/login
Body: {
  email: string,
  password: string
}
Response: {
  success: boolean,
  token?: string,
  user?: { id, username, email, role },
  error?: string
}
```

**Manual Test (90 seconds):**
1. Test login with correct credentials:
   ```bash
   curl -X POST http://localhost:8000/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"test@email.com","password":"password123"}'
   ```
2. Should return JWT token and user data
3. Test wrong password - should return error
4. Verify JWT token is valid (decode using jwt.io)

**Success Criteria:** ✅ Login works, JWT tokens generated, invalid credentials rejected

---

## PHASE 10: JWT Authentication Middleware
**Task:** Create middleware to protect routes and extract user info

**Deliverables:**
- Authentication middleware function
- Token verification and user extraction
- Protected route decorator/hook
- GET /api/auth/me endpoint for token validation

**Manual Test (90 seconds):**
1. Create protected endpoint GET /api/auth/me
2. Test without token - should return 401:
   ```bash
   curl http://localhost:8000/api/auth/me
   ```
3. Test with valid token - should return user info:
   ```bash
   curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:8000/api/auth/me
   ```
4. Test with invalid token - should return 401

**Success Criteria:** ✅ Authentication middleware works, protects routes correctly

---

## PHASE 11: Games CRUD API
**Task:** Create complete CRUD operations for games management

**Deliverables:**
- GET /api/games - List all active games
- GET /api/games/:slug - Get single game with categories
- POST /api/admin/games - Create game (admin only)
- PUT /api/admin/games/:id - Update game (admin only)
- DELETE /api/admin/games/:id - Delete/deactivate game (admin only)

**Manual Test (2 min):**
1. Create a test game via admin endpoint (you'll need admin token)
2. Test GET /api/games - should return list including new game
3. Test GET /api/games/test-game-slug - should return specific game
4. Update the game via PUT endpoint
5. Verify changes reflected in GET requests

**Success Criteria:** ✅ All CRUD operations work, admin protection in place

---

## PHASE 12: Categories CRUD API  
**Task:** Create CRUD operations for categories within games

**Deliverables:**
- GET /api/games/:gameSlug/categories - List categories for game
- POST /api/admin/games/:gameId/categories - Create category
- PUT /api/admin/categories/:id - Update category
- DELETE /api/admin/categories/:id - Delete category

**Manual Test (2 min):**
1. Create categories for existing test game
2. Test listing categories for the game
3. Update a category's commission rate
4. Verify category appears in game's category list
5. Test deleting a category

**Success Criteria:** ✅ Category CRUD complete, properly linked to games

---

## PHASE 13: Frontend Dependencies & Setup
**Task:** Install frontend dependencies and configure tools

**Dependencies to install:**
```bash
npm install @tanstack/react-query zustand
npm install @hookform/resolvers react-hook-form zod
npm install socket.io-client
npm install lucide-react @radix-ui/react-slot
npm install clsx tailwind-merge
npm install next-themes
```

**Setup Shadcn/UI:**
```bash
npx shadcn-ui@latest init
npx shadcn-ui@latest add button input label card form
```

**Manual Test (2 min):**
1. Run `npm install` - should complete without errors
2. Run `npm run dev` - Next.js should start successfully  
3. Add a Shadcn button to homepage - should render correctly
4. Verify TailwindCSS classes are working
5. Check that TypeScript compilation works

**Success Criteria:** ✅ All dependencies installed, Shadcn/UI working, dev server runs

---

## PHASE 14: Frontend API Client Setup
**Task:** Create API client with TanStack Query configuration

**Deliverables:**
- API client helper functions
- TanStack Query configuration
- Environment variables for API URL
- Base hooks for authentication

**Files to create:**
- `lib/api/client.ts` - Axios/fetch client
- `lib/api/auth.ts` - Auth API calls
- `providers/QueryProvider.tsx` - TanStack Query setup
- `hooks/useAuth.ts` - Authentication hook

**Manual Test (90 seconds):**
1. Create test API call to backend `/api/games`
2. Verify API client can reach backend server
3. Test authentication flow with fake credentials
4. Check that QueryClient is properly configured
5. Verify environment variables are loaded

**Success Criteria:** ✅ API client configured, can communicate with backend

---

## PHASE 15: Authentication Pages - Login
**Task:** Create login page with form validation

**Deliverables:**  
- `/login` page with form
- Form validation using React Hook Form + Zod
- API integration for login
- JWT token storage (localStorage/cookies)
- Redirect after successful login

**Manual Test (2 min):**
1. Visit /login page - should show login form
2. Submit empty form - should show validation errors
3. Submit valid credentials - should login and redirect
4. Check that token is stored in localStorage
5. Verify user is logged in (show different UI state)

**Success Criteria:** ✅ Login page works, form validation, successful authentication

---

## PHASE 16: Authentication Pages - Register  
**Task:** Create registration page with validation

**Deliverables:**
- `/register` page with form
- Username/email/password validation
- API integration for registration
- Automatic login after registration
- Link between login and register pages

**Manual Test (2 min):**
1. Visit /register page - should show registration form
2. Test form validation (empty fields, invalid email, etc.)
3. Submit valid registration - should create account
4. Verify automatic login after registration
5. Test duplicate username/email errors

**Success Criteria:** ✅ Registration page complete, validation works, account creation successful

---

## PHASE 17: Protected Route Setup
**Task:** Create authentication guard and protected route wrapper

**Deliverables:**
- Route protection component/HOC
- Automatic redirect to login for unauthenticated users
- User state management with Zustand
- Persistent login across page refreshes

**Manual Test (90 seconds):**
1. Create a protected page (e.g., /dashboard)
2. Visit while logged out - should redirect to login
3. Login and visit protected page - should show content
4. Refresh page while logged in - should remain logged in
5. Logout - should redirect to public area

**Success Criteria:** ✅ Route protection working, auth state persistent

---

## PHASE 18: Homepage Layout & Games Grid
**Task:** Create homepage with games listing

**Deliverables:**
- Homepage layout with header/navigation
- Games grid display
- Responsive design (mobile-first)
- Loading states
- Search functionality

**Manual Test (2 min):**
1. Visit homepage - should show games grid
2. Test responsive design (resize browser)
3. Search for games - should filter results
4. Click on game - should navigate to game page
5. Verify loading states appear during API calls

**Success Criteria:** ✅ Homepage displays games, search works, responsive design

---

## PHASE 19: Game Detail Page
**Task:** Create individual game page with categories

**Deliverables:**
- `/game/[slug]` dynamic route
- Game information display
- Categories list for the game
- Category click navigation
- Breadcrumb navigation

**Manual Test (90 seconds):**
1. Click game from homepage - should show game detail page
2. Verify game info displays correctly
3. Click category - should navigate to category listings
4. Test breadcrumb navigation
5. Test direct URL access to game page

**Success Criteria:** ✅ Game pages work, categories display, navigation functional

---

## PHASE 20: Listings CRUD API Backend
**Task:** Create complete CRUD API for listings management

**Deliverables:**
- GET /api/games/:gameSlug/:categorySlug/listings - List category listings
- GET /api/listings/:id - Get single listing
- POST /api/listings - Create listing (auth required)
- PUT /api/listings/:id - Update listing (owner only)
- DELETE /api/listings/:id - Delete listing (owner only)
- Pagination support
- Filtering and sorting

**Manual Test (2 min):**
1. Create test listing via API
2. Test listing in category API call
3. Update listing details
4. Test owner-only restrictions (try editing someone else's listing)
5. Delete listing and verify it's removed

**Success Criteria:** ✅ Listings CRUD complete, proper authorization, pagination works

---

## PHASE 21: Category Listings Page
**Task:** Create category page showing all listings

**Deliverables:**
- `/game/[gameSlug]/[categorySlug]` page
- Listings grid with pagination
- Filtering options (online sellers, instant delivery)
- Sorting options (price, rating, etc.)
- Search within category

**Manual Test (2 min):**
1. Navigate to category page - should show listings
2. Test pagination - should load more listings
3. Use filters - should filter results appropriately
4. Change sorting - should reorder listings
5. Search within category - should show matching results

**Success Criteria:** ✅ Category pages display listings, filters and sorting work

---

## PHASE 22: Listing Detail Page
**Task:** Create individual listing page with all details

**Deliverables:**
- `/listing/[id]` page
- Complete listing information
- Seller information and ratings
- Image gallery
- "Buy Now" and "Message Seller" buttons
- Related listings

**Manual Test (90 seconds):**
1. Click listing from category page
2. Verify all listing details display
3. Check seller info and ratings
4. Test image gallery navigation
5. Verify "Buy" and "Message" buttons are present

**Success Criteria:** ✅ Listing detail pages complete, all information displays correctly

---

## PHASE 23: User Dashboard Layout
**Task:** Create user dashboard with navigation

**Deliverables:**
- `/dashboard` protected route
- Dashboard navigation menu
- User profile summary
- Quick stats (active listings, orders, etc.)
- Mobile-friendly navigation

**Manual Test (90 seconds):**
1. Login and visit /dashboard
2. Verify dashboard layout displays
3. Check navigation menu works
4. Test mobile responsive design
5. Verify user info displays correctly

**Success Criteria:** ✅ Dashboard layout complete, navigation works, responsive

---

## PHASE 24: Create Listing Page
**Task:** Create page for users to create new listings

**Deliverables:**
- `/dashboard/listings/create` page
- Game and category selection
- Dynamic form fields based on category
- Image upload functionality
- Form validation and submission

**Manual Test (2 min):**
1. Navigate to create listing page
2. Select game and category
3. Fill form with test data
4. Upload test image
5. Submit form - should create listing successfully

**Success Criteria:** ✅ Listing creation works, form validation, image upload functional

---

## PHASE 25: My Listings Management
**Task:** Create page to manage user's existing listings

**Deliverables:**
- `/dashboard/listings` page
- List user's active listings
- Edit/delete/pause listing actions
- Boost listing functionality
- Copy listing feature

**Manual Test (2 min):**
1. Visit my listings page
2. Should show previously created listings
3. Test edit listing functionality
4. Test pause/unpause listing
5. Test boost listing feature

**Success Criteria:** ✅ Listing management complete, all actions functional

---

## PHASE 26: Basic Order Creation API
**Task:** Create API for order creation and management

**Deliverables:**
- POST /api/orders - Create order from listing
- GET /api/orders - List user orders (buyer/seller)
- GET /api/orders/:id - Get single order details
- PUT /api/orders/:id/status - Update order status

**Manual Test (2 min):**
1. Create order via API for existing listing
2. Test order listing for buyer and seller
3. Test single order details endpoint
4. Update order status and verify changes
5. Check that order appears in both buyer/seller lists

**Success Criteria:** ✅ Order API complete, buyer/seller can view orders

---

## PHASE 27: Order Management Pages
**Task:** Create frontend pages for order management

**Deliverables:**
- `/dashboard/orders` page (buyer/seller tabs)
- Order status display
- Order details view
- Basic chat interface placeholder
- Order actions (confirm delivery, etc.)

**Manual Test (90 seconds):**
1. Visit orders page - should show user's orders
2. Switch between buyer/seller tabs
3. Click order - should show order details
4. Test order status updates
5. Verify different order states display correctly

**Success Criteria:** ✅ Order management UI complete, status updates work

---

## PHASE 28: File Upload System - Backend
**Task:** Create file upload API with Cloudinary integration

**Deliverables:**
- POST /api/upload - File upload endpoint
- Cloudinary configuration
- Image processing and optimization
- File size and type validation
- Secure upload (auth required)

**Manual Test (90 seconds):**
1. Test image upload via API with auth token
2. Should return Cloudinary URL
3. Test file size limits
4. Test invalid file types
5. Verify uploaded images accessible via returned URL

**Success Criteria:** ✅ File upload works, images stored on Cloudinary, validation functional

---

## PHASE 29: File Upload System - Frontend
**Task:** Create file upload components for frontend

**Deliverables:**
- Reusable image upload component
- Drag & drop functionality
- Image preview
- Progress indicators
- Multiple image support

**Manual Test (90 seconds):**
1. Test drag and drop image upload
2. Verify image preview appears
3. Test multiple image selection
4. Check progress indicator during upload
5. Verify uploaded images display correctly

**Success Criteria:** ✅ Image upload component works, good UX, multiple images supported

---

## PHASE 30: Basic Chat System - Database & API
**Task:** Create chat API for buyer-seller communication

**Deliverables:**
- POST /api/messages - Send message
- GET /api/messages/:orderId - Get order messages  
- Message validation and sanitization
- Image sharing support
- Message history storage

**Manual Test (2 min):**
1. Send test message via API for existing order
2. Retrieve messages for order
3. Test image message sending
4. Verify messages stored in database
5. Test message validation (empty content, etc.)

**Success Criteria:** ✅ Chat API functional, messages stored, image support works

---

## PHASE 31: Basic Chat Interface
**Task:** Create basic chat UI for order communication

**Deliverables:**
- Chat component with message list
- Message input with send button
- Message bubbles (sent/received styling)
- Image message display
- Auto-scroll to latest messages

**Manual Test (2 min):**
1. Open chat for existing order
2. Send text message - should appear in chat
3. Send image message - should display image
4. Verify sent/received messages have different styling
5. Test auto-scroll functionality

**Success Criteria:** ✅ Basic chat UI works, messages send/receive, images display

---

## PHASE 32: Redis Setup & Session Management
**Task:** Setup Redis for session management and caching

**Deliverables:**
- Redis connection setup
- Session storage in Redis
- Cache configuration for API responses
- Redis connection monitoring

**Manual Test (90 seconds):**
1. Verify Redis connection in backend logs
2. Login and check session stored in Redis
3. Test API response caching
4. Verify session persistence across server restarts
5. Check Redis monitoring dashboard

**Success Criteria:** ✅ Redis connected, sessions working, caching functional

---

## PHASE 33: Socket.io Setup - Backend
**Task:** Setup Socket.io server for real-time features

**Deliverables:**
- Socket.io server configuration
- Authentication middleware for sockets
- Room management for order chats
- Connection/disconnection handling

**Manual Test (90 seconds):**
1. Start backend - should show Socket.io initialization
2. Connect to socket from browser console
3. Test authentication with valid JWT
4. Test joining/leaving chat rooms
5. Verify connection status in server logs

**Success Criteria:** ✅ Socket.io server running, authentication working, room management functional

---

## PHASE 34: Socket.io Setup - Frontend
**Task:** Setup Socket.io client for real-time messaging

**Deliverables:**
- Socket.io client configuration
- Authentication token passing
- Connection state management
- Auto-reconnection handling

**Manual Test (90 seconds):**
1. Login and verify socket connection establishes
2. Check connection state in browser dev tools
3. Test reconnection after network interruption
4. Verify authentication token sent correctly
5. Test connection across different browser tabs

**Success Criteria:** ✅ Socket client connected, auth working, reconnection functional

---

## PHASE 35: Real-time Chat Implementation
**Task:** Implement real-time messaging in chat interface

**Deliverables:**
- Real-time message sending/receiving
- Join/leave chat rooms for orders
- Message delivery confirmation
- Online/offline status indicators

**Manual Test (2 min):**
1. Open chat in two browser tabs (different users)
2. Send message from one tab - should appear instantly in other
3. Test joining chat for different orders
4. Check online/offline indicators
5. Verify message delivery confirmations

**Success Criteria:** ✅ Real-time chat working, messages sync instantly, status indicators correct

---

## PHASE 36: Payment Gateway Integration - JazzCash
**Task:** Integrate JazzCash payment gateway

**Deliverables:**
- JazzCash API integration
- Payment initiation endpoint
- Payment verification webhook
- Transaction status updates

**Manual Test (2 min):** ⚠️ **Requires JazzCash sandbox credentials**
1. Initiate test payment via API
2. Complete payment in JazzCash sandbox
3. Verify webhook receives payment confirmation  
4. Check transaction status updated in database
5. Test payment failure scenarios

**Success Criteria:** ✅ JazzCash integration complete, payments processing, webhooks working

---

## PHASE 37: Payment Gateway Integration - Easypaisa
**Task:** Integrate Easypaisa payment gateway

**Deliverables:**
- Easypaisa API integration
- Payment flow implementation
- Webhook handling
- Error handling and retries

**Manual Test (2 min):** ⚠️ **Requires Easypaisa sandbox credentials**
1. Test Easypaisa payment flow
2. Verify payment confirmation
3. Test webhook processing
4. Check transaction records
5. Test error scenarios (insufficient funds, etc.)

**Success Criteria:** ✅ Easypaisa integration complete, both payment gateways functional

---

## PHASE 38: Escrow System Implementation
**Task:** Implement escrow system for secure transactions

**Deliverables:**
- Escrow account management
- Payment hold and release logic
- Buyer confirmation system
- Dispute handling preparation

**Manual Test (2 min):**
1. Create order and make payment
2. Verify funds held in escrow (not released to seller)
3. Test buyer confirmation of delivery
4. Check funds released to seller after confirmation
5. Test dispute scenario (funds remain held)

**Success Criteria:** ✅ Escrow system functional, payments secure, confirmation system works

---

## PHASE 39: Transaction History System
**Task:** Create comprehensive transaction tracking

**Deliverables:**
- Transaction recording for all money movements
- User balance calculations
- Transaction history API
- Balance updates in real-time

**Manual Test (90 seconds):**
1. Make test transaction - should appear in history
2. Check user balance updates correctly
3. Test different transaction types (purchase, sale, withdrawal)
4. Verify transaction details accuracy
5. Test balance calculations

**Success Criteria:** ✅ Transaction tracking complete, balances accurate, history comprehensive

---

## PHASE 40: Withdrawal System - Backend
**Task:** Create withdrawal request and processing system

**Deliverables:**
- POST /api/withdrawals - Create withdrawal request
- GET /api/withdrawals - List user withdrawals
- Admin approval workflow
- Integration with payment gateways for disbursement

**Manual Test (90 seconds):**
1. Create withdrawal request via API
2. Verify request appears in admin panel
3. Test withdrawal approval process
4. Check balance deducted correctly
5. Test withdrawal limits and validation

**Success Criteria:** ✅ Withdrawal system functional, admin approval working, validations in place

---

## PHASE 41: Withdrawal System - Frontend
**Task:** Create withdrawal request interface

**Deliverables:**
- `/dashboard/funds` page
- Balance display
- Withdrawal request form
- Withdrawal history
- Status tracking

**Manual Test (2 min):**
1. Visit funds page - should show current balance
2. Create withdrawal request
3. Verify request appears in history
4. Check status updates
5. Test withdrawal form validation

**Success Criteria:** ✅ Withdrawal UI complete, form functional, history displays correctly

---

## PHASE 42: Review & Rating System - Backend
**Task:** Create review and rating API

**Deliverables:**
- POST /api/reviews - Create review (buyers only)
- GET /api/users/:id/reviews - Get user reviews
- Rating calculations and aggregation
- Review moderation preparation

**Manual Test (90 seconds):**
1. Create review via API for completed order
2. Verify review appears in seller's profile
3. Test rating calculations (average)
4. Test review restrictions (buyers only, one per order)
5. Check review data integrity

**Success Criteria:** ✅ Review system functional, ratings calculated correctly, restrictions enforced

---

## PHASE 43: Review & Rating System - Frontend
**Task:** Create review interface and displays

**Deliverables:**
- Review creation form after order completion
- Review displays on seller profiles
- Star rating components
- Review listing and pagination

**Manual Test (90 seconds):**
1. Complete order and submit review
2. Check review appears on seller profile
3. Verify star ratings display correctly
4. Test review listing and pagination
5. Check anonymous buyer display

**Success Criteria:** ✅ Review UI complete, ratings display correctly, user experience good

---

## PHASE 44: Admin Panel - Authentication & Layout
**Task:** Create admin panel foundation

**Deliverables:**
- Admin authentication (role-based)
- Admin panel layout and navigation
- Role hierarchy implementation
- Admin dashboard basic structure

**Manual Test (90 seconds):**
1. Login with admin account
2. Access admin panel (should work)
3. Try accessing with regular user (should be denied)
4. Test admin navigation menu
5. Verify role-based restrictions

**Success Criteria:** ✅ Admin panel accessible, role restrictions working, navigation functional

---

## PHASE 45: Admin Panel - User Management
**Task:** Create user management interface

**Deliverables:**
- User listing with search and filters
- User detail pages
- Ban/suspend functionality
- User verification system

**Manual Test (2 min):**
1. View user list in admin panel
2. Search for specific users
3. View user details
4. Test ban/suspend functionality
5. Test user verification process

**Success Criteria:** ✅ User management complete, all actions functional, search working

---

## PHASE 46: Admin Panel - Order Management
**Task:** Create order management and dispute handling

**Deliverables:**
- Order listing and filtering
- Order detail pages
- Dispute resolution tools
- Payment release controls

**Manual Test (2 min):**
1. View all orders in admin panel
2. Filter orders by status
3. View order details and chat history
4. Test manual payment release
5. Test dispute resolution workflow

**Success Criteria:** ✅ Order management functional, dispute tools working, payment controls active

---

## PHASE 47: Admin Panel - Analytics Dashboard
**Task:** Create analytics and reporting dashboard

**Deliverables:**
- Revenue metrics dashboard
- User analytics
- Popular games/categories reports
- Transaction volume charts

**Manual Test (90 seconds):**
1. View analytics dashboard
2. Check revenue metrics display
3. Verify user growth charts
4. Test popular items reports
5. Check transaction volume data

**Success Criteria:** ✅ Analytics dashboard functional, all metrics displaying, charts working

---

## PHASE 48: Search & Filter System Enhancement
**Task:** Implement advanced search and filtering

**Deliverables:**
- Global search across listings
- Advanced filter options
- Search result relevance scoring
- Filter persistence in URLs

**Manual Test (2 min):**
1. Test global search functionality
2. Use multiple filters simultaneously
3. Check search result relevance
4. Verify filter state preserved in URLs
5. Test search performance with large datasets

**Success Criteria:** ✅ Search enhanced, filters comprehensive, performance good, URLs preserve state

---

## PHASE 49: Performance Optimization - Backend
**Task:** Optimize backend performance and caching

**Deliverables:**
- Database query optimization
- Redis caching for frequently accessed data
- API response compression
- Connection pooling

**Manual Test (90 seconds):**
1. Test API response times (should be < 200ms)
2. Verify caching working (second requests faster)
3. Check database query performance
4. Test with multiple concurrent requests
5. Monitor server resource usage

**Success Criteria:** ✅ API performance improved, caching effective, server stable under load

---

## PHASE 50: Performance Optimization - Frontend
**Task:** Optimize frontend performance

**Deliverables:**
- Image lazy loading
- Code splitting and dynamic imports
- Service worker for offline support
- Bundle size optimization

**Manual Test (90 seconds):**
1. Test page load times (should be < 2s)
2. Verify images load lazily
3. Check bundle sizes are reasonable
4. Test offline functionality
5. Check Core Web Vitals scores

**Success Criteria:** ✅ Frontend performance optimized, load times good, offline support working

---

## PHASE 51: Security Implementation - Input Validation
**Task:** Implement comprehensive input validation and sanitization

**Deliverables:**
- Request validation middleware
- XSS prevention
- SQL injection prevention
- Rate limiting

**Manual Test (2 min):**
1. Test XSS attempts in forms (should be blocked)
2. Test SQL injection attempts (should be prevented)
3. Test rate limiting (excessive requests blocked)
4. Verify input sanitization working
5. Test with malicious payloads

**Success Criteria:** ✅ Security measures active, malicious inputs blocked, rate limiting functional

---

## PHASE 52: Security Implementation - Authentication Security
**Task:** Enhance authentication and session security

**Deliverables:**
- Password complexity requirements
- Session timeout implementation
- Brute force protection
- Account lockout mechanisms

**Manual Test (2 min):**
1. Test weak password rejection
2. Test session timeout (after inactivity)
3. Test account lockout after failed attempts
4. Test password reset security
5. Verify JWT token expiration

**Success Criteria:** ✅ Authentication secure, brute force protection working, sessions timeout correctly

---

## PHASE 53: Mobile Responsiveness Polish
**Task:** Perfect mobile user experience

**Deliverables:**
- Touch-friendly interface elements
- Mobile navigation improvements
- PWA manifest and service worker
- Mobile-specific optimizations

**Manual Test (2 min):**
1. Test entire app on mobile device/emulator
2. Verify touch targets are adequate (44px+)
3. Test PWA installation
4. Check mobile navigation works smoothly
5. Test mobile-specific features

**Success Criteria:** ✅ Mobile experience excellent, PWA installable, navigation smooth

---

## PHASE 54: Notification System
**Task:** Implement user notification system

**Deliverables:**
- In-app notification system
- Email notifications for key events
- Push notification infrastructure
- Notification preferences

**Manual Test (90 seconds):**
1. Trigger notification events (new message, order status)
2. Verify in-app notifications appear
3. Check email notifications sent
4. Test notification preferences
5. Test notification history

**Success Criteria:** ✅ Notifications working, email delivery functional, preferences respected

---

## PHASE 55: Error Handling & Logging
**Task:** Implement comprehensive error handling and logging

**Deliverables:**
- Global error handlers
- Structured logging system
- Error reporting and monitoring
- User-friendly error messages

**Manual Test (90 seconds):**
1. Trigger various error scenarios
2. Check errors logged properly
3. Verify user-friendly error messages
4. Test error reporting system
5. Check application recovery from errors

**Success Criteria:** ✅ Error handling comprehensive, logging detailed, user experience maintained during errors

---

## PHASE 56: SEO & Meta Tags
**Task:** Implement SEO optimization

**Deliverables:**
- Dynamic meta tags for all pages
- Structured data markup
- XML sitemap generation
- Open Graph tags

**Manual Test (90 seconds):**
1. Check meta tags on various pages
2. Test social media sharing (Open Graph)
3. Validate structured data
4. Check sitemap generation
5. Test search engine indexing

**Success Criteria:** ✅ SEO implementation complete, meta tags dynamic, structured data valid

---

## PHASE 57: Backup & Recovery System
**Task:** Implement data backup and recovery procedures

**Deliverables:**
- Automated database backups
- File storage backups
- Recovery procedures documentation
- Backup verification system

**Manual Test (90 seconds):**
1. Verify automated backups running
2. Test backup restoration process
3. Check backup file integrity
4. Test recovery procedures
5. Verify backup scheduling

**Success Criteria:** ✅ Backup system functional, recovery tested, data protection ensured

---

## PHASE 58: Load Testing & Stress Testing
**Task:** Test application under load

**Deliverables:**
- Load testing scenarios
- Performance benchmarking
- Scalability assessment
- Performance monitoring setup

**Manual Test (2 min):** ⚠️ **Requires load testing tools**
1. Run load tests on API endpoints
2. Test concurrent user scenarios
3. Monitor database performance under load
4. Check memory and CPU usage
5. Verify application stability

**Success Criteria:** ✅ Application stable under load, performance metrics acceptable, monitoring active

---

## PHASE 59: Security Audit & Penetration Testing
**Task:** Conduct security assessment

**Deliverables:**
- Security vulnerability assessment
- Penetration testing results
- Security fixes implementation
- Security documentation

**Manual Test (2 min):**
1. Run security scanning tools
2. Test authentication vulnerabilities
3. Check for common security issues
4. Test file upload security
5. Verify payment security

**Success Criteria:** ✅ Security audit complete, vulnerabilities fixed, application secure

---

## PHASE 60: Final Testing & Production Deployment
**Task:** Final testing and production deployment

**Deliverables:**
- Complete end-to-end testing
- Production environment setup
- Domain configuration and SSL
- Go-live checklist completion
- Post-deployment monitoring

**Manual Test (5 min):**
1. Complete full user journey testing
2. Test all payment flows in production
3. Verify all features working correctly
4. Check SSL certificates and security
5. Monitor application performance post-deployment

**Success Criteria:** ✅ Application fully functional in production, all tests passing, monitoring active

---

# ⚠️ IMPORTANT PHASE EXECUTION RULES:

## Before Starting Each Phase:
1. Read the phase requirements completely
2. Update TodoWrite tool with current phase status
3. Ask if you need any clarifications

## During Phase Execution:
1. Work on ONLY the specified deliverables
2. Do not add extra features not mentioned
3. Focus on making the phase requirements work perfectly

## After Completing Each Phase:
1. Mark current phase as completed in TodoWrite
2. Present the deliverables clearly
3. Provide the exact manual test instructions
4. **STOP and wait for user confirmation of manual test results**
5. Do NOT proceed to next phase until user confirms "✅ Manual test passed"

## Phase Progression:
- Each phase builds on previous phases
- Never skip phases or combine multiple phases
- If a phase fails testing, fix issues before proceeding
- Maintain incremental development approach

---

