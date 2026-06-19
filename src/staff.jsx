import { useState, useEffect } from "react";
import { db } from "./firebase";
import { collection, query, orderBy, onSnapshot, doc, updateDoc, setDoc } from "firebase/firestore";

function Staff({ onBack, MENU }) {
  const [orders, setOrders] = useState([]);
  const [soldOutItems, setSoldOutItems] = useState([]); // 売り切れのIDリスト
  const [viewMode, setViewMode] = useState("orders"); // "orders" または "menu"

  // 注文一覧をリアルタイムに取得する
  useEffect(() => {
    const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setOrders(list);
    });
    return () => unsub();
  }, []);

  // 📢 売り切れ状態をリアルタイムに取得する
  useEffect(() => {
    const unsub = onSnapshot(doc(db, "settings", "menuStatus"), (docSnap) => {
      if (docSnap.exists()) {
        setSoldOutItems(docSnap.data().soldOut || []);
      }
    });
    return () => unsub();
  }, []);

  // 売り切れの切り替え関数
  const toggleSoldOut = async (itemId) => {
    let newSoldOut = [...soldOutItems];
    if (newSoldOut.includes(itemId)) {
      newSoldOut = newSoldOut.filter((id) => id !== itemId); // 解除
    } else {
      newSoldOut.push(itemId); // 追加
    }
    try {
      await setDoc(doc(db, "settings", "menuStatus"), { soldOut: newSoldOut });
    } catch (e) {
      alert("設定更新エラー: " + e.message);
    }
  };

  // 調理完了（呼び出し中）にする関数
  const handleCallOrder = async (id) => {
    try {
      await updateDoc(doc(db, "orders", id), { status: "呼び出し中" });
    } catch (e) {
      alert("更新エラー: " + e.message);
    }
  };

  // 調理中に戻す関数
  const handleBackToCooking = async (id) => {
    try {
      await updateDoc(doc(db, "orders", id), { status: "調理中" });
    } catch (e) {
      alert("更新エラー: " + e.message);
    }
  };

  const activeOrders = orders.filter(o => o.status === "調理中" || o.status === "呼び出し中");
  const completedOrders = orders.filter(o => o.status === "完了");
    return (
    <div style={{ maxWidth: "600px", margin: "0 auto", fontFamily: "sans-serif", background: "#f8f9fa", minHeight: "100vh", padding: "16px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", borderBottom: "2px solid #333", paddingBottom: "10px" }}>
        <h1 style={{ margin: 0, fontSize: "22px" }}>👨‍🍳 管理画面</h1>
        <button onClick={onBack} style={{ background: "#333", color: "white", border: "none", borderRadius: "4px", padding: "8px 16px", cursor: "pointer", fontWeight: "bold" }}>
          メニューへ戻る
        </button>
      </div>

      {/* 🔄 画面切り替えタブ */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
        <button 
          onClick={() => setViewMode("orders")} 
          style={{ flex: 1, padding: "12px", borderRadius: "8px", border: "none", background: viewMode === "orders" ? "#ff6b35" : "#eee", color: viewMode === "orders" ? "white" : "#333", fontWeight: "bold", cursor: "pointer" }}
        >
          📋 注文管理 ({activeOrders.length}件)
        </button>
        <button 
          onClick={() => setViewMode("menu")} 
          style={{ flex: 1, padding: "12px", borderRadius: "8px", border: "none", background: viewMode === "menu" ? "#ff6b35" : "#eee", color: viewMode === "menu" ? "white" : "#333", fontWeight: "bold", cursor: "pointer" }}
        >
          🚫 売り切れ設定
        </button>
      </div>

      {/* ーーー 注文管理モード ーーー */}
      {viewMode === "orders" && (
        <>
          <h2 style={{ fontSize: "18px", color: "#ff6b35", borderLeft: "4px solid #ff6b35", paddingLeft: "8px", marginBottom: "12px" }}>
            📢 現在の注文
          </h2>

          {activeOrders.length === 0 ? (
            <p style={{ color: "#888", textAlign: "center", padding: "20px" }}>現在、新しい注文はありません。</p>
          ) : (
            activeOrders.map((order) => {
              const isCalling = order.status === "呼び出し中";
              return (
                <div key={order.id} style={{ background: "white", borderRadius: "8px", padding: "16px", marginBottom: "12px", boxShadow: "0 2px 4px rgba(0,0,0,0.05)", border: isCalling ? "2px solid #ff6b35" : "1px solid #ddd" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                    <span style={{ fontSize: "24px", fontWeight: "bold", color: "#ff6b35" }}>#{order.number}</span>
                    <span style={{ background: isCalling ? "#ff6b35" : "#ccc", color: "white", padding: "4px 10px", borderRadius: "12px", fontSize: "12px", fontWeight: "bold" }}>
                      {order.status}
                    </span>
                  </div>

                  <div style={{ padding: "8px 0", borderTop: "1px dashed #eee", borderBottom: "1px dashed #eee", marginBottom: "12px" }}>
                    {order.items?.map((item, idx) => (
                      <div key={idx} style={{ display: "flex", justifyContent: "space-between", fontSize: "15px", margin: "4px 0" }}>
                        <span>📌 {item.name}</span>
                        <span style={{ fontWeight: "bold" }}>x {item.qty}</span>
                      </div>
                    ))}
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontWeight: "bold", color: "#555" }}>合計: ¥{order.total}</span>
                    {isCalling ? (
                      <button onClick={() => handleBackToCooking(order.id)} style={{ background: "#eee", color: "#666", border: "none", borderRadius: "6px", padding: "8px 12px", cursor: "pointer", fontSize: "13px" }}>
                        ↩ 調理中に戻す
                      </button>
                    ) : (
                      <button onClick={() => handleCallOrder(order.id)} style={{ background: "#ff6b35", color: "white", border: "none", borderRadius: "6px", padding: "10px 20px", cursor: "pointer", fontWeight: "bold", fontSize: "14px" }}>
                        ✅ 調理完了（呼び出す）
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}

          <h3 style={{ fontSize: "16px", color: "#666", marginTop: "32px", marginBottom: "12px" }}>✔️ 生徒が受け取り済みの履歴</h3>
          <div style={{ opacity: 0.6 }}>
            {completedOrders.slice(0, 5).map((order) => (
              <div key={order.id} style={{ background: "#e9ecef", borderRadius: "6px", padding: "10px 16px", marginBottom: "8px", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "14px" }}>
                <span>#{order.number} の受け取りが完了しました</span>
                <span style={{ color: "#2bc473", fontWeight: "bold" }}>完了</span>
              </div>
            ))}
          </div>
        </>
      )}

      {/* ーーー 売り切れ設定モード ーーー */}
      {viewMode === "menu" && (
        <>
          <h2 style={{ fontSize: "18px", color: "#333", borderLeft: "4px solid #333", paddingLeft: "8px", marginBottom: "12px" }}>
            🍳 メニューの販売状況・売切管理
          </h2>
          <p style={{ fontSize: "13px", color: "#666", marginBottom: "16px" }}>ボタンを押すと、生徒側の画面がリアルタイムに「売切」に変わります。</p>

          <div style={{ background: "white", borderRadius: "8px", padding: "8px 16px", boxShadow: "0 2px 4px rgba(0,0,0,0.05)" }}>
            {MENU.map((item) => {
              const isSoldOut = soldOutItems.includes(item.id);
              return (
                <div key={item.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: "1px solid #eee" }}>
                  <div>
                    <span style={{ marginRight: "8px" }}>{item.img}</span>
                    <span style={{ fontWeight: "bold", color: isSoldOut ? "#aaa" : "#333" }}>{item.name}</span>
                    <span style={{ fontSize: "12px", color: "#999", marginLeft: "8px" }}>({item.category})</span>
                  </div>
                  <button 
                    onClick={() => toggleSoldOut(item.id)} 
                    style={{ background: isSoldOut ? "#dc3545" : "#2bc473", color: "white", border: "none", borderRadius: "20px", padding: "6px 16px", fontWeight: "bold", cursor: "pointer", fontSize: "13px" }}
                  >
                    {isSoldOut ? "🔴 売切中" : "🟢 販売中"}
                  </button>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

export default Staff;