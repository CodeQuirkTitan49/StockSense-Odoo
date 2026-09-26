# StockSense

StockSense is a warehouse inventory management system built for the Odoo Hackathon.

It provides a centralized view of warehouse stock, product movement, receiving, deliveries, transfers, adjustments, and low-stock information through a simple warehouse-control-room style interface.

## 🚀 Features

- 🔐 User signup and login
- 🔑 Forgot-password flow with OTP-based password reset
- 📊 Inventory dashboard with key stock metrics
- 📦 Product and SKU management
- 🏭 Multi-location warehouse view
- 📥 Stock receiving
- 📤 Stock delivery
- 🔄 Internal stock transfers
- 🛠️ Physical stock adjustments
- 📉 Low-stock monitoring
- 🔎 Product and SKU-based inventory tracking
- 📝 Complete stock movement history
- 🗺️ Visual warehouse floor showing inventory locations
- ⚡ Real-time stock calculations after inventory operations

## 🏗️ Tech Stack

### Frontend
- React
- Vite
- JavaScript
- Lucide React

### Backend
- Node.js
- Express.js
- SQLite
- better-sqlite3

## 📁 Project Structure

```text
StockSense-Odoo/
│
├── backend/
│   ├── db.js
│   ├── server.js
│   ├── package.json
│   └── stocksense.db
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── api.js
│   │   └── ...
│   ├── package.json
│   └── ...
│
└── README.md
