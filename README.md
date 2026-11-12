# CONNECTLY — Minimalist Social Media Platform
### CodeAlpha Full Stack Internship — Task 2

![Connectly Banner](https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80)

Connectly is a full-stack, production-ready social media platform engineered from the ground up for thoughtful reflections, design curators, and creative thinkers. Built with an elegant sage green and off-white aesthetic, clean typography, secure JWT authentication, Mongoose database models, and a complete REST API architecture.

---

## 📑 Table of Contents
- [Project Overview](#project-overview)
- [Key Features](#key-features)
- [Technology Stack](#technology-stack)
- [Database Models](#database-models)
- [REST API Reference](#rest-api-reference)
- [Installation & Local Setup](#installation--local-setup)
- [Environment Variables](#environment-variables)
- [Testing Guide](#testing-guide)
- [Vercel Deployment Guide](#vercel-deployment-guide)
- [GitHub Submission Guide](#github-submission-guide)

---

## 🌟 Project Overview

Connectly satisfies 100% of the official requirements for **CodeAlpha Full Stack Internship Task 2**:
1. **User Profiles**: Unique usernames, avatars, bios, join dates, follower/following counts, user posts.
2. **Posts & Media**: Text posts with character tracking, image attachments, chronological home feed, edit and delete capabilities with ownership verification.
3. **Comments System**: Add comments, list comments chronologically with author avatars, delete own comments.
4. **Like & Unlike System**: Instant toggle, prevents duplicate likes, real-time counter updates.
5. **Follow & Unfollow System**: Connect with other creators, followers and following lists, prevent self-follows.
6. **Social Feeds**: Home chronological feed, following-only filter, trending feed (ranked by likes), live user search.
7. **Security**: Bcrypt password hashing (10 salt rounds), JSON Web Tokens (JWT), input validation, route authorization middleware.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | Next.js 15 App Router / HTML5, CSS3 (Sage & Off-White Design System), Tailwind CSS, Lucide React |
| **Backend** | Node.js, Express.js & Next.js API Route Handlers |
| **Database** | MongoDB Atlas, Mongoose ODM (with seamless in-memory fallback for instant preview) |
| **Auth & Security** | JWT (jsonwebtoken), bcryptjs, CORS, input sanitization |
| **Deployment** | Vercel Serverless / Cloud Run |

---

## 🗄️ Database Models

### 1. User Model (`models/User.js` & `models/User.ts`)
- `name`: String (Required, trimmed, max 60 chars)
- `username`: String (Required, unique, lowercase, alphanumeric + underscore, min 3, max 30)
- `email`: String (Required, unique, lowercase, validated regex)
- `password`: String (Required, hashed via bcrypt, min 6 chars)
- `profilePicture`: String (Default avatar URL)
- `bio`: String (Max 240 chars)
- `createdAt`: Date (Default: Date.now)

### 2. Post Model (`models/Post.js` & `models/Post.ts`)
- `author`: ObjectId (Ref: `User`, Required, indexed)
- `content`: String (Required, trimmed, max 2000 chars)
- `image`: String (Optional URL or base64 data)
- `likes`: Array of ObjectId (Refs to `User`)
- `createdAt`: Date (Default: Date.now, indexed)
- `updatedAt`: Date (Default: Date.now)

### 3. Comment Model (`models/Comment.js` & `models/Comment.ts`)
- `post`: ObjectId (Ref: `Post`, Required, indexed)
- `author`: ObjectId (Ref: `User`, Required, indexed)
- `content`: String (Required, trimmed, max 600 chars)
- `createdAt`: Date (Default: Date.now)

### 4. Follow Model (`models/Follow.js` & `models/Follow.ts`)
- `follower`: ObjectId (Ref: `User`, Required, indexed)
- `following`: ObjectId (Ref: `User`, Required, indexed)
- `createdAt`: Date (Default: Date.now)
- *Compound Unique Index*: `{ follower: 1, following: 1 }` prevents duplicate follows.

---

## 📡 REST API Reference

### Health
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/health` | Service health status and uptime | No |

### Authentication
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/api/auth/register` | Register new user account | No |
| `POST` | `/api/auth/login` | Authenticate user & return JWT token | No |
| `GET` | `/api/auth/me` | Fetch authenticated user data | Yes (Bearer) |

### Users & Profiles
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/users` | List users or search via `?q=query` | Optional |
| `GET` | `/api/users/:id` | Get user profile by ID or username | Optional |
| `PUT` | `/api/users/profile` | Update current user's profile | Yes (Bearer) |
| `GET` | `/api/users/:id/followers` | List followers of user | Optional |
| `GET` | `/api/users/:id/following` | List users followed by user | Optional |
| `POST` | `/api/users/:id/follow` | Follow a user | Yes (Bearer) |
| `DELETE` | `/api/users/:id/follow` | Unfollow a user | Yes (Bearer) |

### Posts
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/posts` | Get posts (`?sort=latest\|trending`, `?authorId=...`, `?followingOnly=true`) | Optional |
| `POST` | `/api/posts` | Create new post | Yes (Bearer) |
| `GET` | `/api/posts/:id` | Get single post details | Optional |
| `PUT` | `/api/posts/:id` | Edit own post | Yes (Owner) |
| `DELETE` | `/api/posts/:id` | Delete own post | Yes (Owner) |

### Likes
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/api/posts/:id/like` | Like a post | Yes (Bearer) |
| `DELETE` | `/api/posts/:id/like` | Unlike a post | Yes (Bearer) |

### Comments
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/posts/:id/comments` | Get all comments for a post | No |
| `POST` | `/api/posts/:id/comments` | Add comment to a post | Yes (Bearer) |
| `DELETE` | `/api/comments/:id` | Delete own comment | Yes (Owner) |

---

## 💻 Installation & Local Setup

### 1. Clone the repository
```bash
git clone https://github.com/your-username/connectly.git
cd connectly
```

### 2. Install dependencies
```bash
npm install
```

### 3. Setup environment variables
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```
Fill in your configuration:
```env
MONGODB_URI="mongodb+srv://<username>:<password>@cluster0.mongodb.net/connectly?retryWrites=true&w=majority"
JWT_SECRET="your_custom_jwt_secret_key"
PORT=3000
```

### 4. Run development server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 5. Running the Standalone Express Server
To run the Express server directly:
```bash
node server.js
```
The server will start on port `5000` with the static frontend served from `/public`.

---

## 🧪 Testing Guide

1. **Authentication Testing**:
   - Register a new account (`POST /api/auth/register`) with full name, unique username, email, and password.
   - Verify duplicate username or email is properly blocked.
   - Log in (`POST /api/auth/login`) and verify JWT token receipt.
   - Use the **1-Click Demo Account Switcher** in the UI to rapidly switch between test personas (`@elena_arch`, `@marcus_v`, `@sophia_code`, `@julian_t`).

2. **Social Feed & Post Testing**:
   - Compose a post with text and photo attachment.
   - Edit the post content via the three-dots menu.
   - Like and unlike posts to verify counter incrementation and duplicate like prevention.
   - Add comments and verify author timestamps.
   - Delete own comment and own post to verify ownership validation.

3. **Follow System Testing**:
   - Navigate to another user's profile and click "Follow".
   - Notice follower count increments immediately.
   - Switch feed tab to "Following" to see only followed authors.
   - Click the "Followers" or "Following" counter to inspect the full interactive connections modal.

---

## 🚀 Vercel Deployment Guide

1. Push your code to your GitHub repository.
2. Sign in to [Vercel](https://vercel.com) and click **"Add New Project"**.
3. Select your GitHub repository.
4. Add the following **Environment Variables** in the Vercel dashboard:
   - `MONGODB_URI`: Your MongoDB Atlas cluster connection string.
   - `JWT_SECRET`: A strong random string for signing tokens.
5. Click **Deploy**. Vercel will build the project and provide a production URL.

---

## 📦 GitHub Submission Guide

```bash
git init
git add .
git commit -m "feat: complete Connectly social media platform for CodeAlpha Task 2"
git branch -M main
git remote add origin https://github.com/your-username/connectly.git
git push -u origin main
```

---

## 📝 CodeAlpha Internship Submission Checklist
- [x] User registration & login with bcrypt password hashing
- [x] JWT authentication & protected routes
- [x] User profiles with editable bio, name, and avatar
- [x] Posts creation, editing, deletion & image attachment
- [x] Like and unlike system with duplicate prevention
- [x] Comments system with delete capability
- [x] Follow and unfollow system with follower/following counters
- [x] Search users by username or name
- [x] Feed tabs (Latest, Following, Trending)
- [x] Complete REST API endpoints matching specification
- [x] MongoDB Mongoose schemas with ObjectId references & indexes
- [x] Minimalist sage green & off-white responsive UI design
- [x] Vercel deployment configuration (`vercel.json`)
- [x] Comprehensive documentation (`README.md`)
