import { useState, useEffect } from "react";
import { db } from "./firebase";
import { collection, onSnapshot, doc, updateDoc } from "firebase/firestore";

function Staff({ onBack }) {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "orders"), (snapshot) => {
      const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      setOrders(data.sort((a, b) => b.createdAt - a.createdAt));
    });
    return () => unsub();
  }, []);

  const updateStatus = async (id, status) => {
    await updateDoc(doc(db, "orders", id), { status });
  };

  const statusColor = (status) => {
    if (status === "待機中") return "#ff6b35";
    if (status === "調理中") return "#f0a500";
    if (status === "完成") return "#4caf50";
    return "#aaa";
  };

  return (
    <div style={{ maxWidth: "600px", margin: "0 auto", fontFamily: "sans-serif" }}>
      <div style={{ background: "#333", color: "white", padding: "16px", textAlign: "center" }}>
        <h1 style={{ margin: 0 }}>👨‍🍳 スタッフ管理画面</h1>
        <div style={{ fontSize: "12px", marginTop: "4px", cursor: "pointer", opacity: 0.7 }} onClick={onBack}>
          ← 生徒画面に戻る
        </div>
      </div>
      <div style={{ padding: "16px" }}>
        <h2>注文一覧（リアルタイム）</h2>
        {orders.length === 0 && <p style={{ color: "#888" }}>注文はまだありません</p>}
        {orders.map((order) => (
          <div key={order.id} style={{ border: "2px solid " + statusColor(order.status), borderRadius: "8px", padding: "16px", marginBottom: "16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
              <span style={{ fontSize: "24px", fontWeight: "bold" }}>番号 #{order.number}</span>
              <span style={{ background: statusColor(order.status), color: "white", padding: "4px 12px", borderRadius: "20px", fontSize: "14px" }}>
                {order.status}
              </span>
            </div>
            <div style={{ marginBottom: "8px" }}>
              {order.items && order.items.map((item, i) => (
                <div key={i} style={{ color: "#555" }}>{item.name} × {item.qty}</div>
              ))}
            </div>
            <div style={{ fontWeight: "bold", marginBottom: "12px" }}>合計：¥{order.total}</div>
            <div style={{ display: "flex", gap: "8px" }}>
              <button onClick={() => updateStatus(order.id, "調理中")} style={{ flex: 1, background: "#f0a500", color: "white", border: "none", borderRadius: "6px", padding: "8px", cursor: "pointer" }}>
                調理中
              </button>
              <button onClick={() => updateStatus(order.id, "完成")} style={{ flex: 1, background: "#4caf50", color: "white", border: "none", borderRadius: "6px", padding: "8px", cursor: "pointer" }}>
                完成
              </button>
              <button onClick={() => updateStatus(order.id, "受渡済")} style={{ flex: 1, background: "#aaa", color: "white", border: "none", borderRadius: "6px", padding: "8px", cursor: "pointer" }}>
                受渡済
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Staff;