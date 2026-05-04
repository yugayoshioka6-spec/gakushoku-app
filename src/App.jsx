import { useState } from "react";
import Staff from "./staff";
import { db } from "./firebase";
import { collection, addDoc } from "firebase/firestore";

const MENU = [
  { id: 1, name: "日替わり定食", price: 450, desc: "本日の定食です" },
  { id: 2, name: "ラーメン", price: 380, desc: "醤油ベースのラーメン" },
  { id: 3, name: "カレーライス", price: 400, desc: "辛さ普通のカレー" },
  { id: 4, name: "うどん", price: 320, desc: "かけうどん" },
];

function App() {
  const [cart, setCart] = useState([]);
  const [page, setPage] = useState("menu");
  const [orderNumber, setOrderNumber] = useState(null);

  if (page === "staff") return <Staff onBack={() => setPage("menu")} />;

  const addToCart = (item) => {
    setCart((prev) => {
      const exists = prev.find((c) => c.id === item.id);
      if (exists) return prev.map((c) =>
        c.id === item.id ? { ...c, qty: c.qty + 1 } : c
      );
      return [...prev, { ...item, qty: 1 }];
    });
  };

  const total = cart.reduce((sum, c) => sum + c.price * c.qty, 0);

  const confirmOrder = async () => {
    const num = Math.floor(Math.random() * 90 + 10);
    await addDoc(collection(db, "orders"), {
      items: cart.map((c) => ({ name: c.name, qty: c.qty })),
      total: total,
      number: num,
      status: "待機中",
      createdAt: new Date(),
    });
    setOrderNumber(num);
    setPage("done");
  };

  if (page === "cart") return (
    <div style={{ maxWidth: "480px", margin: "0 auto", fontFamily: "sans-serif" }}>
      <div style={{ background: "#ff6b35", color: "white", padding: "16px", textAlign: "center" }}>
        <h1 style={{ margin: 0 }}>🛒 カート確認</h1>
      </div>
      <div style={{ padding: "16px" }}>
        {cart.map((c) => (
          <div key={c.id} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #eee" }}>
            <span>{c.name} × {c.qty}</span>
            <span>¥{c.price * c.qty}</span>
          </div>
        ))}
        <div style={{ fontWeight: "bold", fontSize: "18px", margin: "16px 0", textAlign: "right" }}>
          合計：¥{total}
        </div>
        <button onClick={confirmOrder} style={{ width: "100%", background: "#ff6b35", color: "white", border: "none", borderRadius: "8px", padding: "12px", fontSize: "16px", cursor: "pointer" }}>
          注文を確定する
        </button>
        <button onClick={() => setPage("menu")} style={{ width: "100%", marginTop: "8px", background: "#eee", border: "none", borderRadius: "8px", padding: "12px", fontSize: "16px", cursor: "pointer" }}>
          メニューに戻る
        </button>
      </div>
    </div>
  );

  if (page === "done") return (
    <div style={{ maxWidth: "480px", margin: "0 auto", fontFamily: "sans-serif", textAlign: "center", padding: "32px" }}>
      <div style={{ fontSize: "64px" }}>✅</div>
      <h2>注文完了！</h2>
      <p>食堂で番号をお知らせください</p>
      <div style={{ fontSize: "48px", fontWeight: "bold", color: "#ff6b35", margin: "16px 0" }}>
        #{orderNumber}
      </div>
      <p style={{ color: "#888" }}>合計：¥{total}</p>
      <button onClick={() => { setCart([]); setPage("menu"); }} style={{ marginTop: "16px", background: "#ff6b35", color: "white", border: "none", borderRadius: "8px", padding: "12px 24px", fontSize: "16px", cursor: "pointer" }}>
        最初に戻る
      </button>
    </div>
  );

  return (
    <div style={{ maxWidth: "480px", margin: "0 auto", fontFamily: "sans-serif" }}>
      <div style={{ background: "#ff6b35", color: "white", padding: "16px", textAlign: "center" }}>
        <h1 style={{ margin: 0 }}>🍱 学食注文アプリ</h1>
        <div style={{ fontSize: "12px", marginTop: "4px", cursor: "pointer", opacity: 0.7 }} onClick={() => setPage("staff")}>
          スタッフ画面
        </div>
      </div>
      <div style={{ padding: "16px" }}>
        <h2>本日のメニュー</h2>
        {MENU.map((item) => (
          <div key={item.id} style={{ border: "1px solid #ddd", borderRadius: "8px", padding: "12px", marginBottom: "12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontWeight: "bold" }}>{item.name}</div>
              <div style={{ color: "#888", fontSize: "14px" }}>{item.desc}</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ color: "#ff6b35", fontWeight: "bold" }}>¥{item.price}</div>
              <button onClick={() => addToCart(item)} style={{ marginTop: "4px", background: "#ff6b35", color: "white", border: "none", borderRadius: "4px", padding: "4px 12px", cursor: "pointer" }}>
                注文
              </button>
            </div>
          </div>
        ))}
        {cart.length > 0 && (
          <button onClick={() => setPage("cart")} style={{ width: "100%", background: "#333", color: "white", border: "none", borderRadius: "8px", padding: "12px", fontSize: "16px", cursor: "pointer" }}>
            🛒 カートを見る（{cart.reduce((s, c) => s + c.qty, 0)}点）¥{total}
          </button>
        )}
      </div>
    </div>
  );
}

export default App;