# StockSense

Odoo Hackathon 2026 — modular Inventory Management System.

## Stack
- Frontend: React + Vite
- Backend: Node.js + Express
- Database: SQLite (better-sqlite3)
- Icons: lucide-react

## Run
### Backend
```bash
cd backend
npm install
npm run dev
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173

Demo account:
- Email: demo@stocksense.local
- Password: demo123

## Core flow
Supplier → Receive Goods → Stock Increases → Move/Store Stock → Customer Order → Deliver Goods → Stock Decreases → Adjust Damaged/Missing Stock → Stock Ledger

## Distinctive UX
- Visual warehouse control room
- Inventory movement events
- Product inventory DNA
- Timeline / ledger view
- Transfer visualization
