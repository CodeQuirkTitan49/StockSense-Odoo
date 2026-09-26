import { useEffect, useState } from "react";
import {
  Boxes, LayoutDashboard, ArrowDownToLine, ArrowUpFromLine, ArrowLeftRight,
  TriangleAlert, History, Warehouse, LogOut, Plus, Search, Package,
  MoveRight, RefreshCw, X, CheckCircle2, Truck, Activity
} from "lucide-react";
import { api } from "./api";

const nav = [
  ["dashboard","Control Room",LayoutDashboard],
  ["products","Products",Boxes],
  ["receipts","Receive Goods",ArrowDownToLine],
  ["deliveries","Deliver Goods",ArrowUpFromLine],
  ["transfers","Move Stock",ArrowLeftRight],
  ["adjustments","Adjust Stock",TriangleAlert],
  ["history","Stock Timeline",History],
  ["warehouse","Warehouse Map",Warehouse]
];

function App(){
  const [user,setUser]=useState(()=>JSON.parse(localStorage.getItem("stocksense_user")||"null"));
  if(!user) return <Auth onLogin={u=>{localStorage.setItem("stocksense_user",JSON.stringify(u));setUser(u)}}/>;

  return <Main user={user} logout={()=>{localStorage.removeItem("stocksense_user");setUser(null)}}/>;
}

function Auth({onLogin}){
  const [mode,setMode]=useState("login");
  const [form,setForm]=useState({name:"",email:"demo@stocksense.local",password:"demo123"});
  const [error,setError]=useState("");
  const submit=async e=>{
    e.preventDefault(); setError("");
    try { const u=mode==="login"?await api.login(form):await api.signup(form); onLogin(u); }
    catch(err){setError(err.message)}
  };
  return <div className="auth">
    <div className="auth-card">
      <div className="brand-mark"><Boxes size={26}/></div>
      <p className="eyebrow">INVENTORY CONTROL ROOM</p>
      <h1>Stock<span>Sense</span></h1>
      <p className="muted">See where inventory is, how it moved, and why it changed.</p>
      <form onSubmit={submit}>
        {mode==="signup" && <input placeholder="Your name" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} required/>}
        <input type="email" placeholder="Email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} required/>
        <input type="password" placeholder="Password" value={form.password} onChange={e=>setForm({...form,password:e.target.value})} required/>
        {error && <div className="error">{error}</div>}
        <button className="primary wide">{mode==="login"?"Enter Control Room":"Create Account"}</button>
      </form>
      <button className="link" onClick={()=>{setMode(mode==="login"?"signup":"login");setError("")}}>
        {mode==="login"?"Need an account? Sign up":"Already have an account? Log in"}
      </button>
      <small>Demo: demo@stocksense.local / demo123</small>
    </div>
  </div>
}

function Main({user,logout}){
  const [page,setPage]=useState("dashboard");
  const [refresh,setRefresh]=useState(0);
  const [toast,setToast]=useState("");
  const notify=m=>{setToast(m);setTimeout(()=>setToast(""),2500)};
  const go=(p)=>setPage(p);
  return <div className="app">
    <aside className="sidebar">
      <div className="logo"><div className="logo-icon"><Boxes size={19}/></div><div><b>StockSense</b><small>inventory OS</small></div></div>
      <div className="nav">
        {nav.map(([id,label,Icon])=><button key={id} className={page===id?"nav-item active":"nav-item"} onClick={()=>go(id)}><Icon size={18}/><span>{label}</span></button>)}
      </div>
      <div className="sidebar-bottom">
        <div className="user"><div className="avatar">{user.name?.[0]?.toUpperCase()}</div><div><b>{user.name}</b><small>{user.email}</small></div></div>
        <button className="nav-item" onClick={logout}><LogOut size={18}/><span>Logout</span></button>
      </div>
    </aside>
    <main className="main">
      <header className="topbar">
        <div><p className="eyebrow">MAIN WAREHOUSE · LIVE</p><h2>{nav.find(n=>n[0]===page)?.[1]}</h2></div>
        <button className="icon-btn" onClick={()=>setRefresh(x=>x+1)} title="Refresh"><RefreshCw size={18}/></button>
      </header>
      <div className="content">
        {page==="dashboard" && <Dashboard go={go} refresh={refresh}/>}
        {page==="products" && <Products refresh={refresh} notify={notify}/>}
        {page==="receipts" && <OperationForm type="receipt" refresh={refresh} notify={notify}/>}
        {page==="deliveries" && <OperationForm type="delivery" refresh={refresh} notify={notify}/>}
        {page==="transfers" && <TransferForm refresh={refresh} notify={notify}/>}
        {page==="adjustments" && <AdjustmentForm refresh={refresh} notify={notify}/>}
        {page==="history" && <HistoryPage refresh={refresh}/>}
        {page==="warehouse" && <WarehousePage refresh={refresh} go={go}/>}
      </div>
    </main>
    {toast && <div className="toast"><CheckCircle2 size={18}/>{toast}</div>}
  </div>
}

function Dashboard({go,refresh}){
  const [data,setData]=useState(null);
  useEffect(()=>{api.dashboard().then(setData).catch(console.error)},[refresh]);
  if(!data)return <Loading/>;
  return <>
    <div className="hero-grid">
      <section className="control-card">
        <div className="card-head"><div><span className="live-dot"/> LIVE WAREHOUSE</div><span>{new Date().toLocaleDateString()}</span></div>
        <WarehouseMini locations={data.locations}/>
        <div className="warehouse-caption"><span><b>Main Warehouse</b> · 5 active zones</span><button className="text-btn" onClick={()=>go("warehouse")}>Open map <MoveRight size={15}/></button></div>
      </section>
      <section className="story-card">
        <p className="eyebrow">INVENTORY STORY</p>
        <h3>Every number has a reason.</h3>
        <p>Follow stock from supplier arrival to its current location, then rewind the timeline to understand every change.</p>
        <button className="dark-btn" onClick={()=>go("history")}>Explore movement history <History size={16}/></button>
      </section>
    </div>
    <div className="kpis">
      <Kpi label="Units in warehouse" value={Math.round(data.totalStock)} icon={Package}/>
      <Kpi label="Products tracked" value={data.productCount} icon={Boxes}/>
      <Kpi label="Needs attention" value={data.lowStock.length} icon={TriangleAlert} danger={data.lowStock.length>0}/>
      <Kpi label="Movements today" value={data.movements.length} icon={Activity}/>
    </div>
    <div className="section-title"><div><p className="eyebrow">LIVE FEED</p><h3>What's happening now</h3></div><button className="text-btn" onClick={()=>go("history")}>View all <MoveRight size={15}/></button></div>
    <div className="feed">
      {data.movements.slice(0,6).map(m=><Movement key={m.id} m={m}/>)}
      {!data.movements.length&&<Empty text="No movements yet."/>}
    </div>
  </>
}

function WarehouseMini({locations}){
  return <div className="map">
    {locations.map(l=>{
      const pct=Math.min(100,(Number(l.stock)/Number(l.capacity))*100);
      return <div key={l.id} className={"zone "+(pct>85?"hot":pct<25?"empty":"")} style={{left:`${l.x}%`,top:`${l.y}%`}}>
        <div className="zone-name">{l.name}</div><strong>{Math.round(l.stock)}</strong><small>units</small>
        <div className="zone-bar"><i style={{width:`${pct}%`}}/></div>
      </div>
    })}
    <div className="flow-line line1"/><div className="flow-line line2"/>
  </div>
}

function Kpi({label,value,icon:Icon,danger}){return <div className="kpi"><div className={"kpi-icon "+(danger?"danger":"")}><Icon size={18}/></div><div><small>{label}</small><strong>{value}</strong></div></div>}

function Products({refresh,notify}){
  const [products,setProducts]=useState([]); const [q,setQ]=useState(""); const [open,setOpen]=useState(false);
  const load=()=>api.products().then(setProducts); useEffect(load,[refresh]);
  const filtered=products.filter(p=>(p.name+p.sku+p.category).toLowerCase().includes(q.toLowerCase()));
  return <><div className="toolbar"><div className="search"><Search size={17}/><input placeholder="Search SKU, product, category..." value={q} onChange={e=>setQ(e.target.value)}/></div><button className="primary" onClick={()=>setOpen(true)}><Plus size={17}/> New Product</button></div>
  <div className="table-card"><table><thead><tr><th>Product</th><th>SKU</th><th>Category</th><th>Stock</th><th>Locations</th><th>Reorder</th></tr></thead><tbody>
  {filtered.map(p=><tr key={p.id}><td><b>{p.name}</b><small>{p.uom}</small></td><td><code>{p.sku}</code></td><td>{p.category}</td><td><strong>{Math.round(p.total_stock)}</strong> {p.uom}</td><td>{p.locations||"—"}</td><td>{p.total_stock<=p.reorder_level?<span className="pill danger-pill">Low</span>:<span className="pill">Healthy</span>}</td></tr>)}</tbody></table></div>
  {open&&<ProductModal close={()=>setOpen(false)} done={()=>{setOpen(false);load();notify("Product created")}}/>}</>
}

function ProductModal({close,done}){
  const [f,setF]=useState({name:"",sku:"",category:"Raw Material",uom:"pcs",reorder_level:10}); const [err,setErr]=useState("");
  const submit=async e=>{e.preventDefault();try{await api.createProduct(f);done()}catch(x){setErr(x.message)}};
  return <Modal title="New Product" close={close}><form className="form" onSubmit={submit}><Field label="Product name"><input required value={f.name} onChange={e=>setF({...f,name:e.target.value})}/></Field><div className="two"><Field label="SKU"><input required value={f.sku} onChange={e=>setF({...f,sku:e.target.value})}/></Field><Field label="Unit"><input required value={f.uom} onChange={e=>setF({...f,uom:e.target.value})}/></Field></div><div className="two"><Field label="Category"><input required value={f.category} onChange={e=>setF({...f,category:e.target.value})}/></Field><Field label="Reorder level"><input type="number" min="0" value={f.reorder_level} onChange={e=>setF({...f,reorder_level:e.target.value})}/></Field></div>{err&&<div className="error">{err}</div>}<button className="primary wide">Create Product</button></form></Modal>
}

function OperationForm({type,refresh,notify}){
  const [products,setProducts]=useState([]),[locations,setLocations]=useState([]),[f,setF]=useState({}),[err,setErr]=useState("");
  useEffect(()=>{Promise.all([api.products(),api.locations()]).then(([p,l])=>{setProducts(p);setLocations(l);setF(x=>({...x,product_id:p[0]?.id,location_id:l[0]?.id}))})},[refresh]);
  const receipt=type==="receipt"; const submit=async e=>{e.preventDefault();setErr("");try{await api[receipt?"receipt":"delivery"]({...f,quantity:Number(f.quantity)});notify(receipt?"Goods received — stock increased":"Delivery validated — stock decreased");setF(x=>({...x,quantity:""}))}catch(x){setErr(x.message)}};
  return <div className="form-page"><div className="operation-intro"><div className={"op-icon "+(receipt?"in":"out")}>{receipt?<ArrowDownToLine/>:<ArrowUpFromLine/>}</div><div><p className="eyebrow">{receipt?"INBOUND OPERATION":"OUTBOUND OPERATION"}</p><h3>{receipt?"Receive goods":"Deliver goods"}</h3><p>{receipt?"Supplier → warehouse → stock increases.":"Customer order → dispatch → stock decreases."}</p></div></div>
  <div className="operation-grid"><form className="form card-form" onSubmit={submit}><Field label="Product"><select required value={f.product_id||""} onChange={e=>setF({...f,product_id:e.target.value})}>{products.map(p=><option key={p.id} value={p.id}>{p.name} · {p.sku}</option>)}</select></Field><Field label={receipt?"Supplier":"Customer"}><input value={f[receipt?"supplier":"customer"]||""} onChange={e=>setF({...f,[receipt?"supplier":"customer"]:e.target.value})} placeholder={receipt?"Supplier name":"Customer name"}/></Field><Field label={receipt?"Destination":"Source location"}><select required value={f.location_id||""} onChange={e=>setF({...f,location_id:e.target.value})}>{locations.map(l=><option key={l.id} value={l.id}>{l.name}</option>)}</select></Field><Field label="Quantity"><input type="number" min="0.01" step="0.01" required value={f.quantity||""} onChange={e=>setF({...f,quantity:e.target.value})}/></Field>{err&&<div className="error">{err}</div>}<button className={"primary wide "+(!receipt?"danger-btn":"")}>{receipt?"Validate Receipt":"Validate Delivery"}</button></form><div className="explain-card"><p className="eyebrow">WHAT WILL HAPPEN</p><div className="flow-step"><span>01</span><b>{receipt?"Supplier arrives":"Customer order"}</b></div><div className="flow-step"><span>02</span><b>{receipt?"Stock is received":"Items are picked & packed"}</b></div><div className="flow-step active"><span>03</span><b>{receipt?"Stock increases":"Stock decreases"}</b></div><div className="flow-step"><span>04</span><b>Movement enters ledger</b></div></div></div></div>
}

function TransferForm({refresh,notify}){
  const [products,setProducts]=useState([]),[locations,setLocations]=useState([]),[f,setF]=useState({}),[err,setErr]=useState("");
  useEffect(()=>{Promise.all([api.products(),api.locations()]).then(([p,l])=>{setProducts(p);setLocations(l);setF({product_id:p[0]?.id,from_location_id:l[0]?.id,to_location_id:l[1]?.id,quantity:""})})},[refresh]);
  const submit=async e=>{e.preventDefault();setErr("");try{await api.transfer({...f,quantity:Number(f.quantity)});notify("Stock moved — location quantities updated");setF(x=>({...x,quantity:""}))}catch(x){setErr(x.message)}};
  return <div className="form-page"><div className="operation-intro"><div className="op-icon transfer"><ArrowLeftRight/></div><div><p className="eyebrow">INTERNAL MOVEMENT</p><h3>Move stock</h3><p>The total stays the same. Only its location changes.</p></div></div><form className="transfer-form card-form form" onSubmit={submit}><Field label="Product"><select value={f.product_id||""} onChange={e=>setF({...f,product_id:e.target.value})}>{products.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></Field><div className="move-preview"><Field label="From"><select value={f.from_location_id||""} onChange={e=>setF({...f,from_location_id:e.target.value})}>{locations.map(l=><option key={l.id} value={l.id}>{l.name}</option>)}</select></Field><div className="arrow"><MoveRight/></div><Field label="To"><select value={f.to_location_id||""} onChange={e=>setF({...f,to_location_id:e.target.value})}>{locations.map(l=><option key={l.id} value={l.id}>{l.name}</option>)}</select></Field></div><Field label="Quantity"><input type="number" min="0.01" step="0.01" required value={f.quantity||""} onChange={e=>setF({...f,quantity:e.target.value})}/></Field>{err&&<div className="error">{err}</div>}<button className="primary wide">Confirm Transfer</button></form></div>
}

function AdjustmentForm({refresh,notify}){
  const [products,setProducts]=useState([]),[locations,setLocations]=useState([]),[f,setF]=useState({}),[current,setCurrent]=useState(0),[err,setErr]=useState("");
  useEffect(()=>{Promise.all([api.products(),api.locations()]).then(([p,l])=>{setProducts(p);setLocations(l);setF({product_id:p[0]?.id,location_id:l[0]?.id,counted_quantity:"",reason:"Damaged",notes:""});setCurrent(p[0]?.total_stock||0)})},[refresh]);
  useEffect(()=>{const p=products.find(x=>String(x.id)===String(f.product_id));setCurrent(p?.total_stock||0)},[f.product_id,products]);
  const diff=(Number(f.counted_quantity)||0)-Number(current);
  const submit=async e=>{e.preventDefault();setErr("");try{await api.adjustment(f);notify(`Adjustment applied: ${diff>=0?"+":""}${diff} units`);setF(x=>({...x,counted_quantity:"",notes:""}))}catch(x){setErr(x.message)}};
  return <div className="form-page"><div className="operation-intro"><div className="op-icon adjust"><TriangleAlert/></div><div><p className="eyebrow">EXCEPTION HANDLING</p><h3>Adjust stock</h3><p>Compare system stock with the physical count. The system calculates the difference.</p></div></div><form className="adjust-card card-form form" onSubmit={submit}><div className="count-compare"><div><small>SYSTEM EXPECTS</small><strong>{Math.round(current)}</strong></div><div className={diff===0?"equal":diff<0?"negative":"positive"}>{diff===0?"MATCH":`${diff>0?"+":""}${diff} units`}</div><div><small>PHYSICAL COUNT</small><input type="number" min="0" required value={f.counted_quantity||""} onChange={e=>setF({...f,counted_quantity:e.target.value})}/></div></div><div className="two"><Field label="Product"><select value={f.product_id||""} onChange={e=>setF({...f,product_id:e.target.value})}>{products.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></Field><Field label="Location"><select value={f.location_id||""} onChange={e=>setF({...f,location_id:e.target.value})}>{locations.map(l=><option key={l.id} value={l.id}>{l.name}</option>)}</select></Field></div><Field label="Reason"><select value={f.reason} onChange={e=>setF({...f,reason:e.target.value})}><option>Damaged</option><option>Missing</option><option>Counting error</option><option>Other</option></select></Field><Field label="Notes"><textarea value={f.notes} onChange={e=>setF({...f,notes:e.target.value})} placeholder="What happened?"/></Field>{err&&<div className="error">{err}</div>}<button className="primary wide">Apply Adjustment</button></form></div>
}

function HistoryPage({refresh}){
  const [moves,setMoves]=useState([]); const [q,setQ]=useState(""); useEffect(()=>{api.movements().then(setMoves)},[refresh]);
  const filtered=moves.filter(m=>(m.product_name+m.type+(m.reason||"")).toLowerCase().includes(q.toLowerCase()));
  return <><div className="toolbar"><div className="search"><Search size={17}/><input placeholder="Search the movement story..." value={q} onChange={e=>setQ(e.target.value)}/></div><div className="replay-badge">● LIVE LEDGER</div></div><div className="timeline">{filtered.map((m,i)=><div className="timeline-row" key={m.id}><div className="time">{new Date(m.created_at).toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"})}</div><div className="rail"><span className={"event-dot "+m.type.toLowerCase()}/>{i<filtered.length-1&&<i/>}</div><div className="event-card"><div className="event-top"><span className={"event-type "+m.type.toLowerCase()}>{m.type}</span><small>{new Date(m.created_at).toLocaleDateString()}</small></div><h4>{m.product_name} <span>{m.quantity>0?"+":""}{m.quantity} {m.uom}</span></h4><p>{m.type==="TRANSFER"?`${m.from_location} → ${m.to_location}`:m.reason||m.reference}</p></div></div>)}{!filtered.length&&<Empty text="No matching movements."/>}</div></>
}

function WarehousePage({refresh,go}){
  const [locs,setLocs]=useState([]);useEffect(()=>{api.locations().then(setLocs)},[refresh]);
  return <><div className="warehouse-header"><div><p className="eyebrow">SPATIAL INVENTORY</p><h3>Warehouse map</h3><p>Click through physical zones to understand where inventory lives.</p></div><button className="primary" onClick={()=>go("transfers")}><ArrowLeftRight size={16}/> Move stock</button></div><div className="big-map"><WarehouseMini locations={locs}/><div className="map-legend"><span><i className="green"/> Healthy</span><span><i className="yellow"/> Busy</span><span><i className="red"/> Critical</span></div></div></>
}

function Movement({m}){return <div className="movement"><div className={"movement-icon "+m.type.toLowerCase()}>{m.type==="RECEIPT"?<ArrowDownToLine/>:m.type==="DELIVERY"?<ArrowUpFromLine/>:m.type==="TRANSFER"?<ArrowLeftRight/>:<TriangleAlert/>}</div><div><b>{m.product_name}</b><p>{m.type==="TRANSFER"?`${m.from_location} → ${m.to_location}`:m.reason||m.reference}</p></div><strong className={m.quantity<0?"minus":""}>{m.quantity>0?"+":""}{m.quantity} {m.uom}</strong></div>}
function Field({label,children}){return <label><span>{label}</span>{children}</label>}
function Modal({title,close,children}){return <div className="modal-backdrop"><div className="modal"><div className="modal-head"><h3>{title}</h3><button onClick={close}><X/></button></div>{children}</div></div>}
function Empty({text}){return <div className="empty">{text}</div>}
function Loading(){return <div className="loading"><RefreshCw className="spin"/> Loading control room…</div>}

export default App;
