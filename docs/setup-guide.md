# Setup Guide

Complete guide to setting up MachineIQ for local development.

---

## Prerequisites

| Requirement | Version | Notes                        |
| ----------- | ------- | ---------------------------- |
| **Node.js** | 18+     | LTS recommended              |
| **npm**     | 9+      | Comes with Node.js           |
| **MongoDB** | 6+      | Running on `localhost:27017` |
| **Git**     | 2.x     | For version control          |

### Installing MongoDB

**macOS (Homebrew):**

```bash
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community
```

**Windows:**
Download from [mongodb.com/try/download/community](https://www.mongodb.com/try/download/community) and run as a service.

**Docker (any OS):**

```bash
docker run -d --name machineiq-mongo -p 27017:27017 mongo:7
```

---

## Installation

### 1. Clone the Repository

```bash
git clone <repo-url> machineiq
cd machineiq
```

### 2. Run Setup

```bash
./setup.sh
```

This will:

- Install backend dependencies (`backend/node_modules`)
- Install frontend dependencies (`frontend/node_modules`)
- Copy `backend/.env.example` → `backend/.env`
- Copy `frontend/.env.example` → `frontend/.env.local`

### 3. Configure Environment (Optional)

**Backend** (`backend/.env`):

```env
MONGODB_URI=mongodb://localhost:27017/machineiq
JWT_SECRET=change-this-to-a-strong-random-secret
JWT_EXPIRATION=8h
PORT=4051
CORS_ORIGIN=http://localhost:4050
```

**Frontend** (`frontend/.env.local`):

```env
NEXT_PUBLIC_API_URL=http://localhost:4051/api
NEXT_PUBLIC_SOCKET_URL=http://localhost:4051
```

### 4. Seed the Database

```bash
./seed.sh
```

Creates:

- 6 departments (Mechanical, Electrical, Controls, Procurement, Sales, Project Management)
- 7 users across all roles
- 1 sample customer (Acme Manufacturing)

### 5. Start Development Servers

```bash
./dev.sh
```

| Service     | URL                               |
| ----------- | --------------------------------- |
| Frontend    | http://localhost:4050             |
| Backend API | http://localhost:4051/api         |
| Socket.IO   | ws://localhost:4051/notifications |

**Default login:** `admin@machineiq.com` / `password123`

---

## Seed Users

| Email           | Role            | Department             |
| --------------- | --------------- | ---------------------- |
| admin@machineiq.com | Admin           | Project Management     |
| sarah@machineiq.com | Sales           | Sales                  |
| james@machineiq.com | Project Manager | Project Management     |
| anna@machineiq.com  | Engineer        | Mechanical Engineering |
| tom@machineiq.com   | Engineer        | Electrical Engineering |
| lisa@machineiq.com  | Procurement     | Procurement            |
| david@machineiq.com | Manager         | Project Management     |

All passwords: `password123`

---

## Shell Scripts Reference

| Script       | Command         | What It Does                           |
| ------------ | --------------- | -------------------------------------- |
| `./setup.sh` | `npm run setup` | Install deps + create env files        |
| `./seed.sh`  | `npm run seed`  | Populate MongoDB with initial data     |
| `./dev.sh`   | `npm run dev`   | Start both servers (Ctrl+C stops both) |
| `./build.sh` | `npm run build` | Production build                       |
| `./clean.sh` | `npm run clean` | Remove node_modules + build artifacts  |

---

## Troubleshooting

### MongoDB connection refused

Ensure MongoDB is running: `mongosh --eval "db.runCommand({ping:1})"`. If using Docker, check the container is up.

### Port already in use

Kill existing processes: `lsof -ti:4050 | xargs kill -9` or `lsof -ti:4051 | xargs kill -9`.

### Module not found errors

Run `./clean.sh` then `./setup.sh` to reinstall all dependencies.

### JWT errors after seed

Make sure `JWT_SECRET` in `backend/.env` matches across restarts. If you changed it, re-login.
