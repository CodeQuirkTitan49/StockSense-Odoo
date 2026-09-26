import React, { useEffect, useMemo, useState } from "react";
import {
  Boxes, LayoutDashboard, ArrowDownToLine, ArrowUpFromLine, ArrowLeftRight,
  TriangleAlert, History, Warehouse, LogOut, Plus, Search, RefreshCw,
  X, CheckCircle2, Package, Activity, MapPin, ChevronRight, Truck,
  ClipboardCheck, Wrench, CircleDot
} from "lucide-react";
import { api } from "./api";

const NAV = [
  ["dashboard", "Control Room", LayoutDashboard],
  ["products", "Products", Boxes],
  ["receipts", "Receive Goods", ArrowDownToLine],
  ["deliveries", "Deliver Goods", ArrowUpFromLine],
  ["transfers", "Move Stock", ArrowLeftRight],
  ["adjustments", "Adjust Stock", TriangleAlert],
  ["history", "Stock Ledger", History],
  ["warehouse", "Warehouse Floor", Warehouse],
];

function App() {
  const [user, setUser] = useState(() =>
    JSON.parse(localStorage.getItem("stocksense_user") || "null")
  );

  if (!user) {
    return (
      <Auth
        onLogin={(u) => {
          localStorage.setItem("stocksense_user", JSON.stringify(u));
          setUser(u);
        }}
      />
    );
  }

  return (
    <Shell
      user={user}
      logout={() => {
        localStorage.removeItem("stocksense_user");
        setUser(null);
      }}
    />
  );
}

function Auth({ onLogin }) {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({
    name: "",
    email: "demo@stocksense.local",
    password: "Stock123",
  });
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [generatedOtp, setGeneratedOtp] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    try {
      const u = mode === "login"
        ? await api.login(form)
        : await api.signup(form);
      onLogin(u);
    } catch (err) {
      setError(err.message);
    }
  };

  const requestOtp = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    try {
      const result = await api.forgotPassword({ email: form.email });
      setGeneratedOtp(result.otp || "");
      setMode("reset");
      setMessage("OTP generated. Enter it below to reset your password.");
    } catch (err) {
      setError(err.message);
    }
  };

  const resetPassword = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      await api.resetPassword({
        email: form.email,
        otp,
        newPassword
      });

      setMode("login");
      setForm(x => ({ ...x, password: "" }));
      setOtp("");
      setNewPassword("");
      setConfirmPassword("");
      setGeneratedOtp("");
      setMessage("Password reset successfully. You can now log in.");
    } catch (err) {
      setError(err.message);
    }
  };

  const switchMode = (nextMode) => {
    setMode(nextMode);
    setError("");
    setMessage("");
    setOtp("");
    setNewPassword("");
    setConfirmPassword("");
    setGeneratedOtp("");
  };

  return (
    <div className="auth-screen">
      <div className="auth-panel">
        <div className="brand-lockup">
          <div className="brand-symbol"><Boxes size={23} /></div>
          <div><b>StockSense</b><span>WAREHOUSE OPERATIONS</span></div>
        </div>

        <div className="auth-copy">
          <p className="eyebrow">INVENTORY CONTROL SYSTEM</p>
          <h1>
            {mode === "forgot" ? "Reset your password."
              : mode === "reset" ? "Verify your identity."
              : "Know where every unit is."}
          </h1>
          <p>
            {mode === "forgot"
              ? "Enter your account email and we'll generate a one-time password."
              : mode === "reset"
              ? "Enter the OTP and choose a new password."
              : "Track stock from receiving to storage, dispatch and adjustment."}
          </p>
        </div>

        {mode === "forgot" ? (
          <form className="auth-form" onSubmit={requestOtp}>
            <label><span>Email</span>
              <input type="email" value={form.email}
                onChange={e => setForm({...form, email:e.target.value})}
                required />
            </label>
            {error && <div className="error-box">{error}</div>}
            {message && <div className="success-box">{message}</div>}
            <button className="btn btn-primary full">
              Generate OTP <ChevronRight size={16}/>
            </button>
            <button type="button" className="switch-auth"
              onClick={() => switchMode("login")}>
              ← Back to login
            </button>
          </form>
        ) : mode === "reset" ? (
          <form className="auth-form" onSubmit={resetPassword}>
            <label><span>Email</span>
              <input type="email" value={form.email}
                onChange={e => setForm({...form, email:e.target.value})}
                required />
            </label>
            <label><span>One-time password</span>
              <input inputMode="numeric" maxLength={6}
                value={otp}
                onChange={e => setOtp(e.target.value.replace(/\D/g, "").slice(0,6))}
                placeholder="6-digit OTP" required />
            </label>
            {generatedOtp && (
              <div className="success-box">
                Demo OTP: <strong>{generatedOtp}</strong>
              </div>
            )}
            <label><span>New password</span>
              <input type="password" minLength={6}
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                required />
            </label>
            <label><span>Confirm password</span>
              <input type="password" minLength={6}
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                required />
            </label>
            {error && <div className="error-box">{error}</div>}
            {message && <div className="success-box">{message}</div>}
            <button className="btn btn-primary full">
              Reset password <CheckCircle2 size={16}/>
            </button>
            <button type="button" className="switch-auth"
              onClick={() => switchMode("login")}>
              ← Back to login
            </button>
          </form>
        ) : (
          <>
            <form className="auth-form" onSubmit={submit}>
              {mode === "signup" && (
                <label><span>Name</span>
                  <input value={form.name}
                    onChange={e => setForm({...form,name:e.target.value})}
                    required />
                </label>
              )}
              <label><span>Email</span>
                <input type="email" value={form.email}
                  onChange={e => setForm({...form,email:e.target.value})}
                  required />
              </label>
              <label><span>Password</span>
                <input type="password" value={form.password}
                  onChange={e => setForm({...form,password:e.target.value})}
                  required />
              </label>
              {error && <div className="error-box">{error}</div>}
              {message && <div className="success-box">{message}</div>}
              <button className="btn btn-primary full">
                {mode === "login" ? "Open control room" : "Create account"}
                <ChevronRight size={16}/>
              </button>
            </form>

            {mode === "login" && (
              <button className="switch-auth"
                onClick={() => switchMode("forgot")}>
                Forgot password?
              </button>
            )}

            <button className="switch-auth"
              onClick={() => switchMode(mode === "login" ? "signup" : "login")}>
              {mode === "login" ? "Create a new account" : "Back to login"}
            </button>
          </>
        )}

        {mode === "login" && (
          <div className="demo-note">
            Demo account · demo@stocksense.local · Stock123
          </div>
        )}
      </div>

      <div className="auth-warehouse">
        <div className="auth-grid"/>
        <div className="auth-floor">
          <span>RECEIVING</span><i>→</i><span>RACK A</span><i>→</i>
          <span>RACK B</span><i>→</i><span>DISPATCH</span>
        </div>
        <div className="auth-status"><CircleDot size={13}/> LIVE WAREHOUSE MODEL</div>
      </div>
    </div>
  );
}

function Shell({ user, logout }) {
  const [page, setPage] = useState("dashboard");
  const [refresh, setRefresh] = useState(0);
  const [toast, setToast] = useState("");

  const notify = (message) => {
    setToast(message);
    setRefresh(x => x + 1);
    window.clearTimeout(window.__stocksenseToast);
    window.__stocksenseToast = window.setTimeout(() => setToast(""), 2600);
  };

  const title = NAV.find(n => n[0] === page)?.[1] || "Control Room";

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-symbol"><Boxes size={20}/></div>
          <div><b>StockSense</b><span>WAREHOUSE OS</span></div>
        </div>

        <div className="warehouse-selector fixed" aria-label="Active warehouse">
          <div className="warehouse-dot"><Warehouse size={15}/></div>
          <div><small>ACTIVE WAREHOUSE</small><strong>Main Warehouse</strong></div>
          <span className="warehouse-lock">MVP</span>
        </div>

        <nav className="nav">
          <p className="nav-label">OPERATIONS</p>
          {NAV.slice(0, 6).map(([id,label,Icon]) => (
            <button key={id} className={`nav-item ${page===id ? "active":""}`} onClick={()=>setPage(id)}>
              <Icon size={17}/><span>{label}</span>
            </button>
          ))}
          <p className="nav-label second">VISIBILITY</p>
          {NAV.slice(6).map(([id,label,Icon]) => (
            <button key={id} className={`nav-item ${page===id ? "active":""}`} onClick={()=>setPage(id)}>
              <Icon size={17}/><span>{label}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="user-chip">
            <div className="avatar">{user.name?.[0]?.toUpperCase() || "U"}</div>
            <div><strong>{user.name || "Operator"}</strong><small>{user.email}</small></div>
          </div>
          <button className="logout" onClick={logout}><LogOut size={16}/> Sign out</button>
        </div>
      </aside>

      <main className="workspace">
        <header className="app-header">
          <div>
            <p className="eyebrow">MAIN WAREHOUSE / OPERATIONS</p>
            <h2>{title}</h2>
          </div>
          <div className="header-actions">
            <span className="live-status"><i/> SYSTEM LIVE</span>
            <button className="icon-button" title="Refresh" onClick={()=>setRefresh(x=>x+1)}><RefreshCw size={17}/></button>
          </div>
        </header>

        <div className="page">
          {page==="dashboard" && <Dashboard go={setPage} refresh={refresh}/>}
          {page==="products" && <Products refresh={refresh} notify={notify}/>}
          {page==="receipts" && <OperationForm type="receipt" refresh={refresh} notify={notify}/>}
          {page==="deliveries" && <OperationForm type="delivery" refresh={refresh} notify={notify}/>}
          {page==="transfers" && <TransferForm refresh={refresh} notify={notify}/>}
          {page==="adjustments" && <AdjustmentForm refresh={refresh} notify={notify}/>}
          {page==="history" && <HistoryPage refresh={refresh}/>}
          {page==="warehouse" && <WarehousePage refresh={refresh} go={setPage}/>}
        </div>
      </main>

      {toast && <div className="toast"><CheckCircle2 size={17}/>{toast}</div>}
    </div>
  );
}

function Dashboard({ go, refresh }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api.dashboard().then(setData).catch(e=>setError(e.message));
  }, [refresh]);

  if (error) return <div className="error-box">{error}</div>;
  if (!data) return <Loading/>;

  const low = data.lowStock || [];
  const moves = data.movements || [];

  return (
    <div className="dashboard">
      <section className="dashboard-intro">
        <div>
          <p className="eyebrow">WAREHOUSE CONTROL ROOM</p>
          <h1>Inventory at a glance.</h1>
          <p>Physical locations, stock levels and the latest movement of goods.</p>
        </div>
        <button className="btn btn-dark" onClick={()=>go("warehouse")}><Warehouse size={16}/> Open floor</button>
      </section>

      <section className="metric-strip">
        <Metric label="TOTAL UNITS" value={Math.round(data.totalStock)} icon={Package}/>
        <Metric label="PRODUCTS" value={data.productCount} icon={Boxes}/>
        <Metric label="LOW STOCK" value={low.length} icon={TriangleAlert} alert={low.length>0}/>
        <Metric label="RECENT MOVEMENTS" value={moves.length} icon={Activity}/>
      </section>

      <section className="control-grid">
        <div className="panel floor-panel">
          <PanelHead eyebrow="LIVE FLOOR" title="Where inventory is now" action={<button className="text-action" onClick={()=>go("warehouse")}>Full floor <ChevronRight size={14}/></button>}/>
          <WarehouseFloor locations={data.locations || []} compact onMove={()=>go("transfers")}/>
          <div className="floor-key">
            <span><i className="key-green"/> healthy</span>
            <span><i className="key-amber"/> attention</span>
            <span><i className="key-red"/> critical</span>
          </div>
        </div>

        <div className="panel attention-panel">
          <PanelHead eyebrow="ACTION QUEUE" title="Needs attention"/>
          {low.length ? low.slice(0,5).map(p => (
            <div className="attention-row" key={p.id}>
              <div className="attention-icon"><TriangleAlert size={15}/></div>
              <div><strong>{p.name}</strong><small>{Math.round(p.total_stock)} {p.uom} · reorder at {p.reorder_level}</small></div>
              <button onClick={()=>go("receipts")}><Plus size={14}/> receive</button>
            </div>
          )) : <Empty text="No low-stock products."/>}
        </div>
      </section>

      <section className="panel activity-panel">
        <PanelHead eyebrow="MOVEMENT LEDGER" title="Latest warehouse activity" action={<button className="text-action" onClick={()=>go("history")}>Open ledger <ChevronRight size={14}/></button>}/>
        <div className="activity-list">
          {moves.slice(0,6).map(m=><Movement key={m.id} m={m}/>)}
          {!moves.length && <Empty text="No movements recorded yet."/>}
        </div>
      </section>
    </div>
  );
}

function Metric({label,value,icon:Icon,alert}) {
  return <div className="metric"><div className={`metric-icon ${alert?"alert":""}`}><Icon size={18}/></div><div><small>{label}</small><strong>{value}</strong></div></div>;
}

function PanelHead({eyebrow,title,action}) {
  return <div className="panel-head"><div><p className="eyebrow">{eyebrow}</p><h3>{title}</h3></div>{action}</div>;
}

function WarehouseFloor({locations=[],compact=false,onMove}) {
  const normalized = useMemo(() => {
    const find = name => locations.find(l => l.name.toLowerCase() === name.toLowerCase());
    return {
      receiving: find("Receiving Bay") || locations.find(l=>l.name.toLowerCase().includes("receiv")),
      rackA: find("Rack A"),
      rackB: find("Rack B"),
      dispatch: find("Dispatch")
    };
  }, [locations]);

  const Zone = ({data,kind,label}) => {
    if (!data) return <div className={`floor-zone ${kind} missing`}><small>{label}</small><b>—</b><span>not configured</span></div>;
    const stock=Number(data.stock)||0, capacity=Number(data.capacity)||1, pct=Math.min(100,(stock/capacity)*100);
    const state=pct>=85?"red":pct>=60?"amber":stock<=0?"red":"green";
    return <div className={`floor-zone ${kind} ${state}`}>
      <div className="zone-top"><span>{label}</span><MapPin size={12}/></div>
      <strong>{Math.round(stock)}</strong>
      <small>units stored</small>
      <div className="capacity"><i style={{width:`${pct}%`}}/></div>
      <span className="capacity-label">{Math.round(pct)}% capacity</span>
    </div>;
  };

  return (
    <div className={`warehouse-floor ${compact?"compact":""}`}>
      <div className="floor-wall top-wall"/>
      <div className="floor-label inbound">INBOUND</div>
      <div className="floor-label storage">STORAGE</div>
      <div className="floor-label outbound">OUTBOUND</div>

      <Zone data={normalized.receiving} kind="receiving" label="RECEIVING BAY"/>
      <div className="flow-arrow arrow-a">→</div>
      <Zone data={normalized.rackA} kind="rack-a" label="RACK A"/>
      <div className="flow-arrow arrow-b">↓</div>
      <Zone data={normalized.rackB} kind="rack-b" label="RACK B"/>
      <div className="flow-arrow arrow-c">↓</div>
      <Zone data={normalized.dispatch} kind="dispatch" label="DISPATCH"/>
      <div className="floor-aisle aisle-one"/>
      <div className="floor-aisle aisle-two"/>
      {onMove && <button className="floor-move" onClick={onMove}><ArrowLeftRight size={14}/> move stock</button>}
    </div>
  );
}

function Products({refresh,notify}) {
  const [products,setProducts]=useState([]),[q,setQ]=useState(""),[open,setOpen]=useState(false);
  const load=()=>api.products().then(setProducts);
  useEffect(()=>{load()},[refresh]);
  const filtered=products.filter(p=>(p.name+p.sku+p.category).toLowerCase().includes(q.toLowerCase()));

  return <>
    <div className="page-toolbar">
      <div><p className="eyebrow">INVENTORY MASTER</p><h1>Products</h1><p>Every SKU currently tracked by the warehouse.</p></div>
      <button className="btn btn-dark" onClick={()=>setOpen(true)}><Plus size={16}/> New product</button>
    </div>
    <div className="search-row"><div className="search-box"><Search size={16}/><input placeholder="Search name, SKU or category" value={q} onChange={e=>setQ(e.target.value)}/></div><span>{filtered.length} products</span></div>
    <div className="data-panel"><table><thead><tr><th>PRODUCT</th><th>SKU</th><th>CATEGORY</th><th>ON HAND</th><th>LOCATIONS</th><th>REORDER</th></tr></thead><tbody>
      {filtered.map(p=><tr key={p.id}><td><strong>{p.name}</strong><small>{p.uom}</small></td><td><code>{p.sku}</code></td><td>{p.category}</td><td><b>{Math.round(p.total_stock)}</b> {p.uom}</td><td>{p.locations||"—"}</td><td>{Number(p.total_stock)<=Number(p.reorder_level)?<span className="status critical">LOW</span>:<span className="status healthy">HEALTHY</span>}</td></tr>)}
    </tbody></table>{!filtered.length&&<Empty text="No matching products."/>}</div>
    {open&&<ProductModal close={()=>setOpen(false)} done={()=>{setOpen(false);load();notify("Product created")}}/>}
  </>;
}

function ProductModal({close,done}) {
  const [f,setF]=useState({name:"",sku:"",category:"Raw Material",uom:"pcs",reorder_level:10}),[err,setErr]=useState("");
  const submit=async e=>{e.preventDefault();setErr("");try{await api.createProduct(f);done()}catch(x){setErr(x.message)}};
  return <Modal title="Create product" close={close}><form className="form" onSubmit={submit}>
    <Field label="Product name"><input required value={f.name} onChange={e=>setF({...f,name:e.target.value})}/></Field>
    <div className="two"><Field label="SKU / code"><input required value={f.sku} onChange={e=>setF({...f,sku:e.target.value})}/></Field><Field label="Unit of measure"><input required value={f.uom} onChange={e=>setF({...f,uom:e.target.value})}/></Field></div>
    <div className="two"><Field label="Category"><input required value={f.category} onChange={e=>setF({...f,category:e.target.value})}/></Field><Field label="Reorder level"><input type="number" min="0" value={f.reorder_level} onChange={e=>setF({...f,reorder_level:e.target.value})}/></Field></div>
    {err&&<div className="error-box">{err}</div>}<button className="btn btn-dark full">Create product</button>
  </form></Modal>;
}

function getLocationStock(stockRows, productId, locationId) {
  if (!productId || !locationId) return 0;
  const row = stockRows.find(
    s =>
      String(s.product_id) === String(productId) &&
      String(s.location_id) === String(locationId)
  );
  return row ? Number(row.quantity) || 0 : 0;
}

function productStockLocations(stockRows, productId, locations, includeZero = false) {
  return locations.filter(location => {
    const qty = getLocationStock(stockRows, productId, location.id);
    return includeZero ? stockRows.some(
      s =>
        String(s.product_id) === String(productId) &&
        String(s.location_id) === String(location.id)
    ) : qty > 0;
  });
}

function locationLabel(location, stockRows, product) {
  if (!location) return "Select location";
  const qty = getLocationStock(stockRows, product?.id, location.id);
  return `${location.name} · ${Math.round(qty)} ${product?.uom || "units"}`;
}

function OperationForm({type,refresh,notify}) {
  const receipt = type === "receipt";
  const [products,setProducts] = useState([]);
  const [locations,setLocations] = useState([]);
  const [stock,setStock] = useState([]);
  const [f,setF] = useState({});
  const [err,setErr] = useState("");

  useEffect(() => {
    Promise.all([api.products(), api.locations(), api.stock()])
      .then(([p,l,s]) => {
        setProducts(p);
        setLocations(l);
        setStock(s);

        const firstProduct = p[0];
        const receiving = l.find(
          loc => loc.name.toLowerCase() === "receiving bay"
        );
        const stocked = firstProduct
          ? productStockLocations(s, firstProduct.id, l)[0]
          : null;

        setF(x => ({
          ...x,
          product_id: x.product_id || firstProduct?.id,
          location_id:
            x.location_id ||
            (receipt ? receiving?.id : stocked?.id)
        }));
      })
      .catch(e => setErr(e.message));
  }, [refresh, receipt]);

  const selectedProduct = products.find(
    p => String(p.id) === String(f.product_id)
  );

  const availableLocations = receipt
    ? locations.filter(
        l => l.name.toLowerCase() === "receiving bay"
      )
    : productStockLocations(stock, selectedProduct?.id, locations);

  const currentStock = getLocationStock(
    stock,
    selectedProduct?.id,
    f.location_id
  );

  const quantity = Number(f.quantity) || 0;
  const afterStock = receipt
    ? currentStock + quantity
    : currentStock - quantity;

  const insufficient = !receipt && quantity > currentStock;
  const unit = selectedProduct?.uom || "units";
  const locationName =
    locations.find(l => String(l.id) === String(f.location_id))?.name ||
    (receipt ? "Receiving Bay" : "Select a stocked location");

  const submit = async e => {
    e.preventDefault();
    setErr("");

    if (!f.product_id || !f.location_id) {
      setErr(
        receipt
          ? "Choose a product."
          : "Choose a product and a location that has stock."
      );
      return;
    }

    if (!receipt && currentStock <= 0) {
      setErr("This product has no recorded stock at the selected location.");
      return;
    }

    if (insufficient) {
      setErr(`Only ${currentStock} ${unit} are available at this location.`);
      return;
    }

    try {
      await api[receipt ? "receipt" : "delivery"]({
        ...f,
        quantity
      });

      notify(
        receipt
          ? "Goods received — stock increased"
          : "Delivery validated — stock decreased"
      );

      setF(x => ({ ...x, quantity: "" }));
    } catch (x) {
      setErr(x.message);
    }
  };

  const changeProduct = e => {
    const productId = e.target.value;
    const product = products.find(p => String(p.id) === String(productId));
    const validLocations = receipt
      ? locations.filter(
          l => l.name.toLowerCase() === "receiving bay"
        )
      : productStockLocations(stock, productId, locations);

    setF(x => ({
      ...x,
      product_id: productId,
      location_id: validLocations[0]?.id || ""
    }));
    setErr("");
  };

  return (
    <div className="operation-page">
      <div className="page-toolbar">
        <div>
          <p className="eyebrow">{receipt ? "INBOUND OPERATION" : "OUTBOUND OPERATION"}</p>
          <h1>{receipt ? "Receive goods" : "Deliver goods"}</h1>
          <p>
            {receipt
              ? "Register goods arriving from a supplier. They enter through the receiving bay."
              : "Remove goods from a location that actually has the selected product."}
          </p>
        </div>
      </div>

      <div className="operation-layout">
        <form className="data-panel operation-form form" onSubmit={submit}>
          <div className="operation-badge">
            {receipt ? <ArrowDownToLine/> : <ArrowUpFromLine/>}
            <span>{receipt ? "STOCK IN" : "STOCK OUT"}</span>
          </div>

          <Field label="Product">
            <select
              required
              value={f.product_id || ""}
              onChange={changeProduct}
            >
              {products.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name} · {p.sku}
                </option>
              ))}
            </select>
          </Field>

          <Field label={receipt ? "Supplier" : "Customer"}>
            <input
              value={f[receipt ? "supplier" : "customer"] || ""}
              onChange={e =>
                setF({
                  ...f,
                  [receipt ? "supplier" : "customer"]: e.target.value
                })
              }
              placeholder={receipt ? "Supplier name" : "Customer name"}
            />
          </Field>

          <Field label={receipt ? "Destination" : "Source location"}>
            <select
              required
              value={f.location_id || ""}
              onChange={e => setF({...f,location_id:e.target.value})}
            >
              {!availableLocations.length && (
                <option value="">
                  {receipt
                    ? "Receiving Bay not configured"
                    : "No recorded stock for this product"}
                </option>
              )}

              {availableLocations.map(l => (
                <option key={l.id} value={l.id}>
                  {locationLabel(l, stock, selectedProduct)}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Quantity">
            <input
              type="number"
              min="0.01"
              step="0.01"
              required
              value={f.quantity || ""}
              onChange={e => setF({...f,quantity:e.target.value})}
            />
          </Field>

          {err && <div className="error-box">{err}</div>}

          <button
            className={`btn ${receipt ? "btn-green" : "btn-red"} full`}
            disabled={!availableLocations.length || insufficient}
          >
            {receipt ? "Validate receipt" : "Validate delivery"}
            <CheckCircle2 size={16}/>
          </button>
        </form>

        <div className="operation-side">
          <div className="side-card live-preview-card">
            <p className="eyebrow">LIVE STOCK PREVIEW</p>
            <h3>{locationName}</h3>

            <div className="stock-preview-row">
              <span>Current</span>
              <strong>{Math.round(currentStock)} {unit}</strong>
            </div>

            <div className="stock-preview-row">
              <span>{receipt ? "Incoming" : "Outgoing"}</span>
              <strong className={receipt ? "positive" : "negative"}>
                {receipt ? "+" : "−"}{Math.round(quantity)} {unit}
              </strong>
            </div>

            <div className="stock-preview-after">
              <span>After validation</span>
              <strong>{Math.round(afterStock)} {unit}</strong>
            </div>

            {!receipt && (
              <small className={insufficient ? "preview-warning" : "preview-ok"}>
                {insufficient
                  ? `Not enough stock here — ${Math.round(currentStock)} available.`
                  : `${Math.round(currentStock)} ${unit} available to deliver.`}
              </small>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}

function TransferForm({refresh,notify}) {
  const [products,setProducts] = useState([]);
  const [locations,setLocations] = useState([]);
  const [stock,setStock] = useState([]);
  const [f,setF] = useState({});
  const [err,setErr] = useState("");

  useEffect(() => {
    Promise.all([api.products(),api.locations(),api.stock()])
      .then(([p,l,s]) => {
        setProducts(p);
        setLocations(l);
        setStock(s);

        const firstProduct = p[0];
        const source = firstProduct
          ? productStockLocations(s, firstProduct.id, l)[0]
          : null;
        const destination = l.find(loc => loc.id !== source?.id);

        setF(x => ({
          ...x,
          product_id: x.product_id || firstProduct?.id,
          from_location_id:
            x.from_location_id || source?.id || l[0]?.id,
          to_location_id:
            x.to_location_id || destination?.id || l[1]?.id
        }));
      })
      .catch(e => setErr(e.message));
  }, [refresh]);

  const selectedProduct = products.find(
    p => String(p.id) === String(f.product_id)
  );

  const fromStock = getLocationStock(
    stock,
    selectedProduct?.id,
    f.from_location_id
  );

  const toStock = getLocationStock(
    stock,
    selectedProduct?.id,
    f.to_location_id
  );

  const quantity = Number(f.quantity) || 0;
  const insufficient = quantity > fromStock;
  const sameLocation =
    String(f.from_location_id) === String(f.to_location_id);

  const fromName =
    locations.find(l => String(l.id) === String(f.from_location_id))?.name ||
    "From";

  const toName =
    locations.find(l => String(l.id) === String(f.to_location_id))?.name ||
    "To";

  const unit = selectedProduct?.uom || "units";

  const changeProduct = e => {
    const productId = e.target.value;
    const product = products.find(p => String(p.id) === String(productId));
    const stocked = productStockLocations(stock, productId, locations);
    const source = stocked[0];
    const destination = locations.find(
      l => String(l.id) !== String(source?.id)
    );

    setF(x => ({
      ...x,
      product_id: productId,
      from_location_id: source?.id || "",
      to_location_id: destination?.id || ""
    }));
    setErr("");
  };

  const submit = async e => {
    e.preventDefault();
    setErr("");

    if (!f.from_location_id || !f.to_location_id) {
      setErr("Choose a source and destination.");
      return;
    }

    if (sameLocation) {
      setErr("Choose two different locations.");
      return;
    }

    if (quantity <= 0) {
      setErr("Enter a positive quantity.");
      return;
    }

    if (insufficient) {
      setErr(`Only ${fromStock} ${unit} are available at ${fromName}.`);
      return;
    }

    try {
      await api.transfer({...f,quantity});
      notify("Stock moved — location quantities updated");
      setF(x => ({...x,quantity:""}));
    } catch(x) {
      setErr(x.message);
    }
  };

  return (
    <div className="operation-page">
      <div className="page-toolbar">
        <div>
          <p className="eyebrow">INTERNAL MOVEMENT</p>
          <h1>Move stock</h1>
          <p>Move units between physical locations without changing total stock.</p>
        </div>
      </div>

      <div className="transfer-layout">
        <form className="data-panel transfer-panel form" onSubmit={submit}>
          <Field label="Product">
            <select
              value={f.product_id || ""}
              onChange={changeProduct}
            >
              {products.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name} · {p.sku}
                </option>
              ))}
            </select>
          </Field>

          <div className="route">
            <Field label="FROM">
              <select
                value={f.from_location_id || ""}
                onChange={e =>
                  setF({...f,from_location_id:e.target.value})
                }
              >
                {locations.map(l => (
                  <option key={l.id} value={l.id}>
                    {locationLabel(l, stock, selectedProduct)}
                  </option>
                ))}
              </select>
            </Field>

            <div className="route-arrow"><ArrowRightIcon/></div>

            <Field label="TO">
              <select
                value={f.to_location_id || ""}
                onChange={e =>
                  setF({...f,to_location_id:e.target.value})
                }
              >
                {locations.map(l => (
                  <option key={l.id} value={l.id}>
                    {locationLabel(l, stock, selectedProduct)}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <Field label="Quantity">
            <input
              type="number"
              min="0.01"
              step="0.01"
              required
              value={f.quantity || ""}
              onChange={e => setF({...f,quantity:e.target.value})}
            />
          </Field>

          {err && <div className="error-box">{err}</div>}

          <button
            className="btn btn-dark full"
            disabled={insufficient || sameLocation}
          >
            Confirm transfer <ArrowLeftRight size={16}/>
          </button>
        </form>

        <div className="operation-side">
          <div className="side-card live-preview-card">
            <p className="eyebrow">LIVE LOCATION PREVIEW</p>

            <div className="transfer-preview">
              <div>
                <small>{fromName}</small>
                <strong>{Math.round(fromStock)} {unit}</strong>
                <span>
                  → {Math.round(fromStock - quantity)} after
                </span>
              </div>

              <ArrowLeftRight size={18}/>

              <div>
                <small>{toName}</small>
                <strong>{Math.round(toStock)} {unit}</strong>
                <span>
                  → {Math.round(toStock + quantity)} after
                </span>
              </div>
            </div>

            <div className="transfer-total">
              Warehouse total stays{" "}
              <strong>
                {Math.round(fromStock + toStock)} {unit}
              </strong>{" "}
              across these two locations.
            </div>

            {insufficient && (
              <small className="preview-warning">
                Not enough stock at the source location.
              </small>
            )}
          </div>

          
        </div>
      </div>
    </div>
  );
}

function ArrowRightIcon(){ return <ChevronRight size={23}/>; }

function AdjustmentForm({refresh,notify}) {
  const [products,setProducts] = useState([]);
  const [locations,setLocations] = useState([]);
  const [stock,setStock] = useState([]);
  const [f,setF] = useState({});
  const [current,setCurrent] = useState(0);
  const [err,setErr] = useState("");

  useEffect(() => {
    Promise.all([api.products(),api.locations(),api.stock()])
      .then(([p,l,s]) => {
        setProducts(p);
        setLocations(l);
        setStock(s);

        const firstProduct = p[0];
        const stocked = firstProduct
          ? productStockLocations(s, firstProduct.id, l)[0]
          : null;

        setF({
          product_id:firstProduct?.id,
          location_id:stocked?.id || l[0]?.id,
          counted_quantity:"",
          reason:"Damaged",
          notes:""
        });
      })
      .catch(e => setErr(e.message));
  }, [refresh]);

  useEffect(() => {
    const value = getLocationStock(
      stock,
      f.product_id,
      f.location_id
    );
    setCurrent(value);
  }, [f.product_id,f.location_id,stock]);

  const selectedProduct = products.find(
    p => String(p.id) === String(f.product_id)
  );

  const availableLocations = productStockLocations(
    stock,
    f.product_id,
    locations
  );

  const diff =
    (Number(f.counted_quantity) || 0) - Number(current);

  const locationName =
    locations.find(l => String(l.id) === String(f.location_id))?.name ||
    "Selected location";

  const unit = selectedProduct?.uom || "units";

  const changeProduct = e => {
    const productId = e.target.value;
    const stocked = productStockLocations(stock, productId, locations);

    setF(x => ({
      ...x,
      product_id:productId,
      location_id:stocked[0]?.id || ""
    }));
    setErr("");
  };

  const submit = async e => {
    e.preventDefault();
    setErr("");

    if (!f.product_id || !f.location_id) {
      setErr("Choose a product and a location with recorded stock.");
      return;
    }

    if (Number(f.counted_quantity) < 0) {
      setErr("Physical count cannot be negative.");
      return;
    }

    try {
      await api.adjustment({
        ...f,
        counted_quantity:Number(f.counted_quantity)
      });

      notify(
        `Adjustment applied at ${locationName}: ${
          diff >= 0 ? "+" : ""
        }${diff} ${unit}`
      );

      setF(x => ({
        ...x,
        counted_quantity:"",
        notes:""
      }));
    } catch(x) {
      setErr(x.message);
    }
  };

  return (
    <div className="operation-page">
      <div className="page-toolbar">
        <div>
          <p className="eyebrow">EXCEPTION HANDLING</p>
          <h1>Adjust stock</h1>
          <p>
            Compare the system quantity at one location with the physical
            count you actually found.
          </p>
        </div>
      </div>

      <form className="data-panel adjustment-panel form" onSubmit={submit}>
        <div className="compare">
          <div>
            <small>SYSTEM AT {locationName.toUpperCase()}</small>
            <strong>{Math.round(current)}</strong>
            <span>{unit}</span>
          </div>

          <div className={diff===0?"match":diff<0?"negative":"positive"}>
            {diff===0 ? "MATCH" : `${diff>0?"+":""}${diff} ${unit}`}
          </div>

          <div>
            <small>PHYSICAL COUNT</small>
            <input
              type="number"
              min="0"
              required
              value={f.counted_quantity || ""}
              onChange={e =>
                setF({...f,counted_quantity:e.target.value})
              }
            />
          </div>
        </div>

        <div className="two">
          <Field label="Product">
            <select
              value={f.product_id || ""}
              onChange={changeProduct}
            >
              {products.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name} · {p.sku}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Location">
            <select
              value={f.location_id || ""}
              onChange={e =>
                setF({...f,location_id:e.target.value})
              }
            >
              {!availableLocations.length && (
                <option value="">
                  No recorded stock for this product
                </option>
              )}

              {availableLocations.map(l => (
                <option key={l.id} value={l.id}>
                  {locationLabel(l,stock,selectedProduct)}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <Field label="Reason">
          <select
            value={f.reason}
            onChange={e=>setF({...f,reason:e.target.value})}
          >
            <option>Damaged</option>
            <option>Missing</option>
            <option>Counting error</option>
            <option>Other</option>
          </select>
        </Field>

        <Field label="Notes">
          <textarea
            value={f.notes}
            onChange={e=>setF({...f,notes:e.target.value})}
            placeholder="What happened? e.g. 3 units damaged during handling."
          />
        </Field>

        {err && <div className="error-box">{err}</div>}

        <button
          className="btn btn-dark full"
          disabled={!availableLocations.length}
        >
          Apply adjustment <ClipboardCheck size={16}/>
        </button>
      </form>
    </div>
  );
}

function HistoryPage({refresh}) {
  const [moves,setMoves]=useState([]),[q,setQ]=useState(""),[type,setType]=useState("ALL");
  useEffect(()=>{api.movements().then(setMoves)},[refresh]);
  const filtered=moves.filter(m=>(type==="ALL"||m.type===type)&&(m.product_name+m.type+(m.reason||"")+ (m.reference||"")).toLowerCase().includes(q.toLowerCase()));
  return <div><div className="page-toolbar"><div><p className="eyebrow">AUDIT TRAIL</p><h1>Stock ledger</h1><p>Every quantity change is recorded as a movement.</p></div></div>
    <div className="ledger-toolbar"><div className="search-box"><Search size={16}/><input placeholder="Search movements" value={q} onChange={e=>setQ(e.target.value)}/></div><select value={type} onChange={e=>setType(e.target.value)}><option>ALL</option><option>RECEIPT</option><option>DELIVERY</option><option>TRANSFER</option><option>ADJUSTMENT</option></select></div>
    <div className="ledger">{filtered.map((m,i)=><div className="ledger-row" key={m.id}><div className="ledger-time">{new Date(m.created_at).toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"})}<small>{new Date(m.created_at).toLocaleDateString()}</small></div><div className={`ledger-dot ${m.type.toLowerCase()}`}/><div className="ledger-card"><div className="ledger-top"><span className={`movement-tag ${m.type.toLowerCase()}`}>{m.type}</span><b className={m.quantity<0?"minus":""}>{m.quantity>0?"+":""}{m.quantity} {m.uom}</b></div><strong>{m.product_name}</strong><p>{m.type==="TRANSFER"?`${m.from_location} → ${m.to_location}`:m.reason||m.reference||"Warehouse movement"}</p></div></div>)}{!filtered.length&&<Empty text="No matching movements."/>}</div>
  </div>;
}

function WarehousePage({refresh,go}) {
  const [locs,setLocs]=useState([]);
  useEffect(()=>{api.locations().then(setLocs)},[refresh]);
  return <div><div className="page-toolbar"><div><p className="eyebrow">SPATIAL INVENTORY</p><h1>Warehouse floor</h1><p>A physical view of where inventory is stored inside Main Warehouse.</p></div><button className="btn btn-dark" onClick={()=>go("transfers")}><ArrowLeftRight size={16}/> Move stock</button></div>
    <div className="floor-full panel"><WarehouseFloor locations={locs} onMove={()=>go("transfers")}/><div className="floor-footer"><span><i className="key-green"/> Healthy</span><span><i className="key-amber"/> Attention</span><span><i className="key-red"/> Critical / empty</span><span className="floor-note">Flow follows receiving → storage → dispatch</span></div></div>
  </div>;
}

function Movement({m}) {
  const Icon=m.type==="RECEIPT"?ArrowDownToLine:m.type==="DELIVERY"?ArrowUpFromLine:m.type==="TRANSFER"?ArrowLeftRight:TriangleAlert;
  return <div className="movement-row"><div className={`movement-icon ${m.type.toLowerCase()}`}><Icon size={15}/></div><div><strong>{m.product_name}</strong><small>{m.type==="TRANSFER"?`${m.from_location} → ${m.to_location}`:m.reason||m.reference||m.type}</small></div><b className={m.quantity<0?"minus":""}>{m.quantity>0?"+":""}{m.quantity} {m.uom}</b></div>;
}

function Field({label,children}){return <label><span>{label}</span>{children}</label>}
function Modal({title,close,children}){return <div className="modal-backdrop"><div className="modal"><div className="modal-head"><h3>{title}</h3><button onClick={close}><X size={17}/></button></div>{children}</div></div>}
function Empty({text}){return <div className="empty">{text}</div>}
function Loading(){return <div className="loading"><RefreshCw className="spin"/> Loading warehouse data…</div>}

export default App;
