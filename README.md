# ScreenForge

Visual FiveM loading screen builder with user accounts, project saving, and public gallery.

## Quick Start

**Windows:** Double-click `START.bat`

**Linux/Mac:**
```bash
cd server && npm install && node index.js
```

Open **http://localhost:3002**

The server auto-builds the frontend on first run — no separate steps needed.

## Setup

1. Create a MySQL database and run `server/schema.sql`
2. Copy `server/.env.example` to `server/.env` and fill in your DB credentials
3. Run `START.bat` (or `node index.js` in the server folder)

## Stack

- **Backend:** Node.js + Express + MySQL
- **Frontend:** React + Vite + Tailwind
- **Auth:** Email/password + JWT
