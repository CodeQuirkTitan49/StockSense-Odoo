import express from "express";
import cors from "cors";
import { db, hashPassword } from "./db.js";

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 4000;

// Temporary OTP storage for password reset.
// OTPs expire after 5 minutes.
const otpStore = new Map();

function allProducts() {
  return db.prepare(`
    SELECT p.*,
      COALESCE(SUM(s.quantity),0) AS total_stock,
      COALESCE(GROUP_CONCAT(l.name || ':' || ROUND(s.quantity,2), ' | '),'') AS locations
    FROM products p
    LEFT JOIN stock s ON s.product_id=p.id
    LEFT JOIN locations l ON l.id=s.location_id
    GROUP BY p.id ORDER BY p.name
  `).all();
}

app.get("/api/health", (_, res) => res.json({ ok: true }));

// ==================== AUTH ====================

app.post("/api/auth/signup", (req,res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password || password.length < 6)
    return res.status(400).json({
      error:"Name, email and password (6+ chars) are required."
    });

  try {
    const info = db.prepare(
      "INSERT INTO users(name,email,password_hash) VALUES(?,?,?)"
    ).run(
      name,
      email.toLowerCase(),
      hashPassword(password)
    );

    res.json({
      id: info.lastInsertRowid,
      name,
      email: email.toLowerCase()
    });
  } catch {
    res.status(409).json({
      error:"An account with that email already exists."
    });
  }
});

app.post("/api/auth/login", (req,res) => {
  const { email, password } = req.body;

  const user = db.prepare(
    "SELECT id,name,email,password_hash FROM users WHERE email=?"
  ).get((email||"").toLowerCase());

  if (!user || user.password_hash !== hashPassword(password||""))
    return res.status(401).json({
      error:"Invalid email or password."
    });

  res.json({
    id:user.id,
    name:user.name,
    email:user.email
  });
});

// ==================== OTP PASSWORD RESET ====================

app.post("/api/auth/forgot-password", (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({
      error: "Email is required."
    });
  }

  const normalizedEmail = email.toLowerCase();

  const user = db.prepare(
    "SELECT id FROM users WHERE email=?"
  ).get(normalizedEmail);

  if (!user) {
    return res.status(404).json({
      error: "No account found with that email."
    });
  }

  const otp = String(
    Math.floor(100000 + Math.random() * 900000)
  );

  otpStore.set(normalizedEmail, {
    otp,
    expiresAt: Date.now() + 5 * 60 * 1000
  });

  // Demo mode:
  // OTP is also returned in the response because
  // no email provider is configured for the MVP.
  console.log(`OTP for ${normalizedEmail}: ${otp}`);

  res.json({
    ok: true,
    message: "OTP generated successfully.",
    otp
  });
});

app.post("/api/auth/reset-password", (req, res) => {
  const { email, otp, newPassword } = req.body;

  if (!email || !otp || !newPassword) {
    return res.status(400).json({
      error: "Email, OTP and new password are required."
    });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({
      error: "Password must be at least 6 characters."
    });
  }

  const normalizedEmail = email.toLowerCase();

  const saved = otpStore.get(normalizedEmail);

  if (!saved) {
    return res.status(400).json({
      error: "No OTP request found. Please request a new OTP."
    });
  }

  if (Date.now() > saved.expiresAt) {
    otpStore.delete(normalizedEmail);

    return res.status(400).json({
      error: "OTP has expired. Please request a new one."
    });
  }

  if (String(otp) !== saved.otp) {
    return res.status(400).json({
      error: "Invalid OTP."
    });
  }

  db.prepare(
    "UPDATE users SET password_hash=? WHERE email=?"
  ).run(
    hashPassword(newPassword),
    normalizedEmail
  );

  otpStore.delete(normalizedEmail);

  res.json({
    ok: true,
    message: "Password reset successfully."
  });
});

// ==================== DASHBOARD ====================

app.get("/api/dashboard", (_,res) => {
  const products = allProducts();

  const movements = db.prepare(`
    SELECT m.*, p.name product_name, p.uom,
      fl.name from_location, tl.name to_location
    FROM movements m JOIN products p ON p.id=m.product_id
    LEFT JOIN locations fl ON fl.id=m.from_location_id
    LEFT JOIN locations tl ON tl.id=m.to_location_id
    ORDER BY datetime(m.created_at) DESC, m.id DESC LIMIT 12
  `).all();

  const lowStock = products.filter(
    p => p.total_stock <= p.reorder_level
  );

  const locations = db.prepare(`
    SELECT l.*, w.name warehouse_name,
      COALESCE(SUM(s.quantity),0) stock
    FROM locations l
    JOIN warehouses w ON w.id=l.warehouse_id
    LEFT JOIN stock s ON s.location_id=l.id
    GROUP BY l.id
  `).all();

  res.json({
    totalStock: products.reduce(
      (a,p)=>a+Number(p.total_stock),
      0
    ),
    productCount: products.length,
    lowStock,
    locations,
    movements
  });
});

// ==================== PRODUCTS ====================

app.get("/api/products", (_,res) =>
  res.json(allProducts())
);

app.post("/api/products", (req,res)=>{
  const {
    name,
    sku,
    category,
    uom,
    reorder_level=10
  } = req.body;

  if (!name || !sku || !category || !uom) {
    return res.status(400).json({
      error:"All product fields are required."
    });
  }

  try {
    const info=db.prepare(`
      INSERT INTO products(
        name,
        sku,
        category,
        uom,
        reorder_level
      )
      VALUES(?,?,?,?,?)
    `).run(
      name,
      sku,
      category,
      uom,
      Number(reorder_level)
    );

    res.json({
      id:info.lastInsertRowid
    });
  } catch {
    res.status(409).json({
      error:"SKU already exists."
    });
  }
});

// ==================== LOCATIONS ====================

app.get("/api/locations", (_,res)=>res.json(
  db.prepare(`
    SELECT l.*, w.name warehouse_name,
      COALESCE(SUM(s.quantity),0) stock
    FROM locations l
    JOIN warehouses w ON w.id=l.warehouse_id
    LEFT JOIN stock s ON s.location_id=l.id
    GROUP BY l.id
    ORDER BY l.id
  `).all()
));

// ==================== STOCK ====================

app.get("/api/stock", (_, res) => {
  const stock = db.prepare(`
    SELECT
      s.product_id,
      s.location_id,
      s.quantity,
      p.name AS product_name,
      p.sku,
      p.uom,
      p.category,
      p.reorder_level,
      l.name AS location_name,
      l.warehouse_id
    FROM stock s
    JOIN products p ON p.id = s.product_id
    JOIN locations l ON l.id = s.location_id
    ORDER BY p.name, l.id
  `).all();

  res.json(stock);
});

function ensureStock(productId, locationId) {
  db.prepare(`
    INSERT OR IGNORE INTO stock(
      product_id,
      location_id,
      quantity
    )
    VALUES(?,?,0)
  `).run(
    productId,
    locationId
  );
}

function changeStock(productId, locationId, delta) {
  ensureStock(productId, locationId);

  const current=db.prepare(`
    SELECT quantity
    FROM stock
    WHERE product_id=? AND location_id=?
  `).get(
    productId,
    locationId
  );

  const next =
    Number(current.quantity) +
    Number(delta);

  if(next < 0)
    throw new Error(
      "Insufficient stock at this location."
    );

  db.prepare(`
    UPDATE stock
    SET quantity=?
    WHERE product_id=? AND location_id=?
  `).run(
    next,
    productId,
    locationId
  );
}

function addMovement({
  productId,
  type,
  quantity,
  from_location_id=null,
  to_location_id=null,
  reason="",
  reference=""
}) {
  db.prepare(`
    INSERT INTO movements(
      product_id,
      type,
      quantity,
      from_location_id,
      to_location_id,
      reason,
      reference
    )
    VALUES(?,?,?,?,?,?,?)
  `).run(
    productId,
    type,
    quantity,
    from_location_id,
    to_location_id,
    reason,
    reference
  );
}

// ==================== RECEIPTS ====================

app.post("/api/receipts", (req,res)=>{
  const {
    product_id,
    location_id,
    quantity,
    supplier="Supplier",
    reference="Receipt"
  }=req.body;

  if(
    !product_id ||
    !location_id ||
    !quantity ||
    Number(quantity)<=0
  ) {
    return res.status(400).json({
      error:"Product, location and positive quantity are required."
    });
  }

  try {
    const tx=db.transaction(()=>{
      changeStock(
        product_id,
        location_id,
        Number(quantity)
      );

      addMovement({
        productId:product_id,
        type:"RECEIPT",
        quantity:Number(quantity),
        to_location_id:location_id,
        reason:`Received from ${supplier}`,
        reference
      });
    });

    tx();

    res.json({ok:true});
  } catch(e) {
    res.status(400).json({
      error:e.message
    });
  }
});

// ==================== DELIVERIES ====================

app.post("/api/deliveries", (req,res)=>{
  const {
    product_id,
    location_id,
    quantity,
    customer="Customer",
    reference="Delivery"
  }=req.body;

  if(
    !product_id ||
    !location_id ||
    !quantity ||
    Number(quantity)<=0
  ) {
    return res.status(400).json({
      error:"Product, location and positive quantity are required."
    });
  }

  try {
    const tx=db.transaction(()=>{
      changeStock(
        product_id,
        location_id,
        -Number(quantity)
      );

      addMovement({
        productId:product_id,
        type:"DELIVERY",
        quantity:Number(quantity),
        from_location_id:location_id,
        reason:`Delivered to ${customer}`,
        reference
      });
    });

    tx();

    res.json({ok:true});
  } catch(e) {
    res.status(400).json({
      error:e.message
    });
  }
});

// ==================== TRANSFERS ====================

app.post("/api/transfers", (req,res)=>{
  const {
    product_id,
    from_location_id,
    to_location_id,
    quantity
  }=req.body;

  if(
    !product_id ||
    !from_location_id ||
    !to_location_id ||
    !quantity ||
    Number(quantity)<=0
  ) {
    return res.status(400).json({
      error:"Product, source, destination and positive quantity are required."
    });
  }

  if(
    String(from_location_id) ===
    String(to_location_id)
  ) {
    return res.status(400).json({
      error:"Source and destination must be different."
    });
  }

  try {
    const tx=db.transaction(()=>{
      changeStock(
        product_id,
        from_location_id,
        -Number(quantity)
      );

      changeStock(
        product_id,
        to_location_id,
        Number(quantity)
      );

      addMovement({
        productId:product_id,
        type:"TRANSFER",
        quantity:Number(quantity),
        from_location_id,
        to_location_id
      });
    });

    tx();

    res.json({ok:true});
  } catch(e) {
    res.status(400).json({
      error:e.message
    });
  }
});

// ==================== ADJUSTMENTS ====================

app.post("/api/adjustments", (req,res)=>{
  const {
    product_id,
    location_id,
    counted_quantity,
    reason="Damaged",
    notes=""
  }=req.body;

  if(
    !product_id ||
    !location_id ||
    counted_quantity===undefined ||
    Number(counted_quantity)<0
  ) {
    return res.status(400).json({
      error:"Product, location and a valid physical count are required."
    });
  }

  try {
    const current =
      db.prepare(`
        SELECT quantity
        FROM stock
        WHERE product_id=? AND location_id=?
      `).get(
        product_id,
        location_id
      )?.quantity || 0;

    const difference =
      Number(counted_quantity) -
      Number(current);

    const tx=db.transaction(()=>{
      changeStock(
        product_id,
        location_id,
        difference
      );

      addMovement({
        productId:product_id,
        type:"ADJUSTMENT",
        quantity:difference,
        from_location_id:location_id,
        to_location_id:location_id,
        reason,
        reference:notes
      });
    });

    tx();

    res.json({
      ok:true,
      difference
    });
  } catch(e) {
    res.status(400).json({
      error:e.message
    });
  }
});

// ==================== MOVEMENT HISTORY ====================

app.get("/api/movements", (_,res)=>res.json(
  db.prepare(`
    SELECT m.*, p.name product_name, p.sku, p.uom,
      fl.name from_location,
      tl.name to_location
    FROM movements m
    JOIN products p ON p.id=m.product_id
    LEFT JOIN locations fl
      ON fl.id=m.from_location_id
    LEFT JOIN locations tl
      ON tl.id=m.to_location_id
    ORDER BY datetime(m.created_at) DESC,
      m.id DESC
  `).all()
));

// ==================== START SERVER ====================

app.listen(
  PORT,
  ()=>console.log(
    `StockSense API running on http://localhost:${PORT}`
  )
);