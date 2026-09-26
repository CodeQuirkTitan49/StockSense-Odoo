import Database from "better-sqlite3";
import crypto from "crypto";

const db = new Database("stocksense.db");
db.pragma("foreign_keys = ON");

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS warehouses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS locations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  warehouse_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  x INTEGER DEFAULT 0,
  y INTEGER DEFAULT 0,
  capacity INTEGER DEFAULT 100,
  FOREIGN KEY (warehouse_id) REFERENCES warehouses(id)
);

CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  sku TEXT UNIQUE NOT NULL,
  category TEXT NOT NULL,
  uom TEXT NOT NULL,
  reorder_level REAL DEFAULT 10,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS stock (
  product_id INTEGER NOT NULL,
  location_id INTEGER NOT NULL,
  quantity REAL DEFAULT 0,
  PRIMARY KEY(product_id, location_id),
  FOREIGN KEY(product_id) REFERENCES products(id),
  FOREIGN KEY(location_id) REFERENCES locations(id)
);

CREATE TABLE IF NOT EXISTS movements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER NOT NULL,
  type TEXT NOT NULL,
  quantity REAL NOT NULL,
  from_location_id INTEGER,
  to_location_id INTEGER,
  reason TEXT,
  reference TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(product_id) REFERENCES products(id)
);
`);

function hashPassword(password) {
  return crypto.createHash("sha256").update(password).digest("hex");
}

const user = db.prepare("SELECT id FROM users WHERE email=?").get("demo@stocksense.local");
if (!user) {
  db.prepare("INSERT INTO users(name,email,password_hash) VALUES(?,?,?)")
    .run("Demo Manager", "demo@stocksense.local", hashPassword("demo123"));
}

const wh = db.prepare("SELECT id FROM warehouses LIMIT 1").get();
if (!wh) {
  const w = db.prepare("INSERT INTO warehouses(name) VALUES(?)").run("Main Warehouse");
  const warehouseId = w.lastInsertRowid;
  const locations = [
    ["Receiving Bay", 8, 18, 120],
    ["Rack A", 30, 12, 100],
    ["Rack B", 55, 12, 100],
    ["Production", 78, 32, 90],
    ["Dispatch", 55, 58, 80]
  ];
  const insertLoc = db.prepare("INSERT INTO locations(warehouse_id,name,x,y,capacity) VALUES(?,?,?,?,?)");
  locations.forEach(l => insertLoc.run(warehouseId, ...l));

  const products = [
    ["Steel Rods", "STL-001", "Raw Material", "kg", 25],
    ["Office Chairs", "CHR-101", "Finished Goods", "pcs", 15],
    ["Bearings", "BRG-204", "Components", "pcs", 20]
  ];
  const insertP = db.prepare("INSERT INTO products(name,sku,category,uom,reorder_level) VALUES(?,?,?,?,?)");
  products.forEach(p => insertP.run(...p));

  const rackA = db.prepare("SELECT id FROM locations WHERE name='Rack A'").get().id;
  const rackB = db.prepare("SELECT id FROM locations WHERE name='Rack B'").get().id;
  const prod = db.prepare("SELECT id FROM products WHERE sku='STL-001'").get().id;
  const chairs = db.prepare("SELECT id FROM products WHERE sku='CHR-101'").get().id;
  const bearings = db.prepare("SELECT id FROM products WHERE sku='BRG-204'").get().id;

  const setStock = db.prepare("INSERT INTO stock(product_id,location_id,quantity) VALUES(?,?,?)");
  setStock.run(prod, rackA, 100);
  setStock.run(chairs, rackB, 42);
  setStock.run(bearings, rackB, 18);
}

export { db, hashPassword };
