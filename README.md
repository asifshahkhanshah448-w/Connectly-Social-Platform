# Connectly (CONNECT) – Professional Full-Stack Social Media Platform

**CodeAlpha Full Stack Developer Internship – Task 2**

CONNECT is a minimal, modern, production-grade social media platform built for engineers, creators, and professionals. Designed with an intentional visual system (clean off-white backgrounds, charcoal typography, and subtle sage-green accents), CONNECT delivers a genuine full-stack experience powered by **HTML5, CSS3, Vanilla JavaScript (ES6+), Node.js, Express, and MongoDB (Atlas / Mongoose)**.

---

## 🌟 Key Features

### 1. User Authentication & Security
- **JWT Authentication:** Stateful token-based authentication using HTTP Bearer headers.
- **bcrypt Password Hashing:** Passwords hashed with 10 salt rounds; plain-text passwords never stored or logged.
- **Strict Data Sanitization:** Passwords and internal fields stripped from all API outputs.
- **Input Validation:** Email syntax checks, username regex (`^[a-zA-Z0-9_]+$`), and password minimum lengths.
- **Duplicate Prevention:** MongoDB unique indexes preventing duplicate emails and usernames.
- **Brute Force Protection:** In-memory sliding-window rate limiting on sensitive auth endpoints.
- **HTTP Security:** Helmet security headers and CORS protection.

### 2. User Profiles
- **Comprehensive Profile View:** Full name, unique username, bio, join date, total posts count, followers count, and following count.
- **Self vs Other Profiles:** Interactive "Edit Profile" modal for post authors and instant "Follow / Following" button for other users.
- **Profile Updates:** Real-time updating of full name, biography, and profile picture avatar.
- **Followers & Following Subviews:** Dedicated tabs listing relationship connections with instant follow controls.

### 3. Dynamic Post System
- **Chronological Feed:** Live posts ordered by newest first with timestamp format (`just now`, `5m ago`, `2h ago`).
- **Post Composer:** Responsive composer with character counter (1000 character limit) and image attachment support (file picker or image URL).
- **Ownership Verification:** Only post authors can edit or delete their posts; unauthorized edits/deletions are rejected with HTTP 403 Forbidden.
- **Infinite / Paginated Loading:** Supports `?page=1&limit=10` with load more controls.

### 4. Interactive Like System
- **Single-Click Toggle:** Like and unlike posts seamlessly.
- **Optimistic UI:** Interface updates immediately with heart highlight and live count increments.
- **Duplicate Like Prevention:** Backed by MongoDB array unique checking per authenticated user.

### 5. Nested Comment System
- **Post Comments:** Expandable comments drawer on each post card.
- **Validation:** Enforces non-empty comments (max 500 characters).
- **Real-Time Counters:** Post cards immediately update their comment counter upon addition or deletion.
- **Comment Ownership:** Users can delete their own comments with automatic count reconciliation.

### 6. Follow & Discovery System
- **Follow / Unfollow:** Relationship management with compound unique index `{ follower: 1, following: 1 }`.
- **Self-Follow Prevention:** System blocks users from following themselves both in API and UI.
- **User Discovery (`explore.html`):** Real-time debounced search by name or username with direct follow/unfollow buttons.
- **Right Sidebar Widget:** Instant "Who to Follow" recommendations for active community engagement.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | HTML5, CSS3 (Custom Responsive Design System), Vanilla JavaScript (ES6+) |
| **Backend** | Node.js (v20+), Express.js REST API |
| **Database** | MongoDB Atlas, Mongoose ODM (with embedded MongoDB Memory Server fallback for development) |
| **Authentication** | JSON Web Tokens (`jsonwebtoken`), `bcryptjs` |
| **Security** | `helmet`, `cors`, in-memory rate limiting |

---

## 📁 Project Architecture

```
/
├── backend/
│   ├── config/
│   │   ├── db.js             # Mongoose connection & MongoDB Atlas configuration
│   │   └── seed.js           # Automated initial community seeder
│   ├── controllers/
│   │   ├── authController.js    # Register, login, me
│   │   ├── userController.js    # Profiles, directory search, follow/unfollow
│   │   ├── postController.js    # Post CRUD, pagination, like toggle
│   │   └── commentController.js # Comment add, delete, list
│   ├── middleware/
│   │   ├── auth.js           # JWT verification and route guard
│   │   ├── errorHandler.js   # Centralized HTTP error handler
│   │   └── rateLimiter.js    # Sliding window rate limiter for auth
│   ├── models/
│   │   ├── User.js           # User schema with bcrypt password hashing
│   │   ├── Post.js           # Post schema with author ref & likes array
│   │   ├── Comment.js        # Comment schema with post & author refs
│   │   └── Follow.js         # Follow schema with compound unique index
│   ├── routes/
│   │   ├── authRoutes.js     # /api/auth
│   │   ├── userRoutes.js     # /api/users
│   │   ├── postRoutes.js     # /api/posts
│   │   └── commentRoutes.js  # /api/comments
│   └── server.js             # Express application entry & middleware chain
├── public/
│   ├── css/
│   │   └── style.css         # Minimal sage-green design system & responsive rules
│   ├── js/
│   │   ├── api.js            # Fetch client, JWT interceptor, toast system
│   │   ├── auth.js           # Session manager & navigation state
│   │   ├── feed.js           # Home feed, post composer, like & comment UI
│   │   ├── profile.js        # Profile views, edit profile modal, user tabs
│   │   └── explore.js        # Member discovery and instant search
│   ├── images/
│   │   ├── logo.svg          # CONNECT brand emblem
│   │   └── default-avatar.svg
│   ├── index.html            # Home feed
│   ├── login.html            # User login & 1-click test accounts
│   ├── register.html         # User registration
│   ├── profile.html          # User profile
│   └── explore.html          # Community search
├── server.js                 # Root Node server runner
├── .env.example              # Environment variables template
├── .gitignore
├── metadata.json
└── package.json
```

---

## ⚙️ Environment Variables

Create a `.env` file in the project root based on `.env.example`:

```env
PORT=3000
NODE_ENV=production

# MongoDB Atlas Connection String
# (If omitted, the app starts an embedded MongoDB daemon for seamless local development)
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/connect_platform?retryWrites=true&w=majority

# JWT Authentication
JWT_SECRET=your_super_secret_jwt_key_here_min_32_chars
JWT_EXPIRES_IN=7d

# Application URLs
FRONTEND_URL=http://localhost:3000
API_BASE_URL=http://localhost:3000/api
```

---

## 🚀 Installation & Local Development

### Prerequisites
- Node.js version 18.0.0 or higher
- npm (Node Package Manager)

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Configure Environment
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
*(Optional)* Add your MongoDB Atlas connection URI to `MONGODB_URI`. If left unconfigured, CONNECT will automatically launch an in-process MongoDB instance with seeded community data.

### Step 3: Run the Development Server
```bash
npm run dev
```
Open your browser and navigate to `http://localhost:3000`.

---

## 📖 REST API Documentation

### Authentication Routes (`/api/auth`)
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/api/auth/register` | Register new user account | No |
| `POST` | `/api/auth/login` | Login with username/email & password | No |
| `GET` | `/api/auth/me` | Retrieve currently authenticated user | Yes |

### User Routes (`/api/users`)
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/users` | List or search users (`?search=query&limit=20`) | Optional |
| `GET` | `/api/users/:username` | Get profile by username with counts & status | Optional |
| `PUT` | `/api/users/profile` | Update own name, bio, and avatar | Yes |
| `POST` | `/api/users/:id/follow` | Follow a user by ID | Yes |
| `DELETE` | `/api/users/:id/follow` | Unfollow a user by ID | Yes |
| `GET` | `/api/users/:id/followers` | List followers of user :id | Optional |
| `GET` | `/api/users/:id/following` | List users followed by user :id | Optional |

### Post Routes (`/api/posts`)
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/posts` | Feed posts (`?page=1&limit=10&username=...`) | Optional |
| `GET` | `/api/posts/:id` | Get single post by ID | Optional |
| `POST` | `/api/posts` | Create new post | Yes |
| `PUT` | `/api/posts/:id` | Edit own post (ownership enforced) | Yes |
| `DELETE` | `/api/posts/:id` | Delete own post (ownership enforced) | Yes |
| `POST` | `/api/posts/:id/like` | Toggle like/unlike on post | Yes |
| `GET` | `/api/posts/:id/comments` | Get all comments for post | Optional |
| `POST` | `/api/posts/:id/comments` | Add comment to post | Yes |

### Comment Routes (`/api/comments`)
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `DELETE` | `/api/comments/:id` | Delete own comment (ownership enforced) | Yes |

### Health Route
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Service and MongoDB connection status |

---

## 🧪 Demo Test Credentials

To immediately evaluate without manually registering, the following pre-seeded test accounts are available:

| Full Name | Username | Email | Password |
|---|---|---|---|
| **Alex Rivera** | `alexrivera` | `alex@example.com` | `Password123!` |
| **Elena Vance** | `elenavance` | `elena@example.com` | `Password123!` |
| **Marcus Chen** | `marcuschen` | `marcus@example.com` | `Password123!` |
| **Sophia Patel** | `sophiapatel` | `sophia@example.com` | `Password123!` |

*(The login screen also features 1-click test buttons that automatically populate credentials.)*

---

## 🚢 Deployment

### Deploying to Vercel (Recommended)
1. Push your repository to **GitHub**.
2. Go to [Vercel Dashboard](https://vercel.com) and click **"Add New Project"** -> **"Import"** your GitHub repository.
3. In **Project Settings** -> **Environment Variables**, configure:
   - `MONGODB_URI`: Your MongoDB Atlas connection string (`mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/connect_platform?retryWrites=true&w=majority`)
   - `JWT_SECRET`: A secure random secret string (min 32 characters)
   - `JWT_EXPIRES_IN`: `7d`
   - `NODE_ENV`: `production`
4. Deploy! Vercel automatically runs `vercel.json` rewrites, executes `/api/index.js` as serverless functions, and serves all frontend pages from `/public`.

### Render / Railway / Cloud Run / VPS
1. Set the build command to `npm install`.
2. Set the start command to `node server.js`.
3. Provide `MONGODB_URI` pointing to your MongoDB Atlas cluster.
4. Set `JWT_SECRET` to a secure random string.
5. Port defaults to `3000` or `process.env.PORT`.

---

## 📄 License
Created for CodeAlpha Full Stack Developer Internship – Task 2.
