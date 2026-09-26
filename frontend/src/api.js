const API = "http://localhost:4000/api";

async function request(path, options={}) {
  const res = await fetch(API + path, {
    headers: {"Content-Type":"application/json"},
    ...options
  });
  const data = await res.json();
  if(!res.ok) throw new Error(data.error || "Request failed");
  return data;
}

export const api = {
  login: (body)=>request("/auth/login",{method:"POST",body:JSON.stringify(body)}),
  signup: (body)=>request("/auth/signup",{method:"POST",body:JSON.stringify(body)}),
  dashboard: ()=>request("/dashboard"),
  products: ()=>request("/products"),
  locations: ()=>request("/locations"),
  stock: () => request("/stock"),
  movements: ()=>request("/movements"),
  createProduct: (body)=>request("/products",{method:"POST",body:JSON.stringify(body)}),
  deleteProduct: (id) =>
  request(`/products/${id}`, {
    method: "DELETE"
  }),
  receipt: (body)=>request("/receipts",{method:"POST",body:JSON.stringify(body)}),
  delivery: (body)=>request("/deliveries",{method:"POST",body:JSON.stringify(body)}),
  transfer: (body)=>request("/transfers",{method:"POST",body:JSON.stringify(body)}),
  adjustment: (body)=>request("/adjustments",{method:"POST",body:JSON.stringify(body)})
  
};
