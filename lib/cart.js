import { createContext, useContext, useState } from "react";

const CartCtx = createContext(null);
// Panier : [{ product, supplier, qty }]
export function CartProvider({ children }) {
  const [items, setItems] = useState([]);
  const add = (product, supplier, qty) => setItems((cur) => {
    const ex = cur.find((x) => x.product.id === product.id);
    if (ex) return cur.map((x) => (x.product.id === product.id ? { ...x, qty: Math.min(30, x.qty + qty) } : x));
    return [...cur, { product, supplier, qty }];
  });
  const setQty = (productId, qty) => setItems((cur) => (qty <= 0 ? cur.filter((x) => x.product.id !== productId) : cur.map((x) => (x.product.id === productId ? { ...x, qty: Math.min(30, qty) } : x))));
  const clear = (supplierIds) => setItems((cur) => (supplierIds ? cur.filter((x) => !supplierIds.includes(x.supplier.id)) : []));
  const count = items.reduce((a, x) => a + x.qty, 0);
  return <CartCtx.Provider value={{ items, add, setQty, clear, count }}>{children}</CartCtx.Provider>;
}
export const useCart = () => useContext(CartCtx);
