import { useState, useEffect } from "react";
import Staff from "./staff";
import { db } from "./firebase";
import { collection, addDoc, doc, onSnapshot, updateDoc } from "firebase/firestore";

// 🍱 実際の黒板メニュー
const MENU = [
  { id: 1, category: "ご飯もの", name: "週替わり定食", price: 500, desc: "今週のイチオシ定食！", img: "🍱", recommended: true },
  { id: 2, category: "ご飯もの", name: "幕ノ内弁当", price: 500, desc: "おかず色々、定番のお弁当", img: "🍱" },
  { id: 3, category: "ご飯もの", name: "カツカレー", price: 500, desc: "ボリューム満点！サクサクカツカレー", img: "🍛", recommended: true },
  { id: 4, category: "ご飯もの", name: "カレーライス", price: 450, desc: "定番の美味しいカレー", img: "🍛" },
  { id: 5, category: "ご飯もの", name: "500円丼", price: 500, desc: "大満足のどんぶりメニュー", img: "丼" },
  { id: 6, category: "ご飯もの", name: "450円丼", price: 450, desc: "お手頃価格のどんぶりメニュー", img: "丼" },
  { id: 7, category: "ご飯もの", name: "おにぎり", price: 150, desc: "手軽に食べられるおにぎり", img: "🍙" },
  
  { id: 8, category: "麺類", name: "ぶっかけうどん", price: 350, desc: "夏の定番！ツルッと美味しい", img: "🥢" },
  { id: 9, category: "麺類", name: "ちくわ天ぶっかけうどん", price: 400, desc: "サクサクちくわ天をトッピング！", img: "🥢" },
  { id: 10, category: "麺類", name: "鶏天ぶっかけうどん", price: 450, desc: "ジューシーな鶏天がのった豪華版", img: "🥢", recommended: true },
  { id: 11, category: "麺類", name: "全部のせぶっかけうどん", price: 500, desc: "トッピング全種類のせの贅沢うどん", img: "🥢" },
  
  { id: 12, category: "サイド", name: "ご飯、麺大盛り", price: 100, desc: "もっと食べたい方はこちら！", img: "🍚", recommended: true },
  { id: 13, category: "サイド", name: "定食のメインのみ", price: 250, desc: "おかずだけ追加したいときに！", img: "🍗" },
  { id: 14, category: "サイド", name: "からあげ（4コ）", price: 250, desc: "みんな大好きジューシー唐揚げ", img: "🍗" },
  { id: 15, category: "サイド", name: "総菜パン・菓子パン", price: 200, desc: "売店のおすすめパン", img: "🍞" },
  { id: 16, category: "サイド", name: "たこ焼き（6コ）", price: 150, desc: "あつあつトロトロのたこ焼き", img: "🐙" },
  { id: 17, category: "サイド", name: "コロッケ", price: 100, desc: "サクサク衣のポテトコロッケ", img: "🥔" },
  { id: 18, category: "サイド", name: "焼き菓子（クッキー・ロールケーキ）", price: 150, desc: "食後のデザートにどうぞ", img: "🍪" }
];

const CATEGORIES = ["すべて", "ご飯もの", "麺類", "サイド"];

function App() {
  const [cart, setCart] = useState([]);
  const [page, setPage] = useState("menu");
  const [selectedCategory, setSelectedCategory] = useState("すべて");
  const [currentOrderId, setCurrentOrderId] = useState(null);
  const [currentOrder, setCurrentOrder] = useState(null);
  const [soldOutItems, setSoldOutItems] = useState([]); // 売り切れ商品のIDリスト

  // 注文状態の監視
  useEffect(() => {
    if (!currentOrderId) return;
    const unsub = onSnapshot(doc(db, "orders", currentOrderId), (docSnap) => {
      if (docSnap.exists()) setCurrentOrder(docSnap.data());
    });
    return () => unsub();
  }, [currentOrderId]);

  // 📢 売り切れ状態をリアルタイムに監視する
  useEffect(() => {
    const unsub = onSnapshot(doc(db, "settings", "menuStatus"), (docSnap) => {
      if (docSnap.exists()) {
        setSoldOutItems(docSnap.data().soldOut || []);
      }
    });
    return () => unsub();
  }, []);

  if (page === "staff") return <Staff onBack={() => setPage("menu")} MENU={MENU} />;

  const addToCart = (item) => {
    if (soldOutItems.includes(item.id)) return; // 売り切れなら追加させない
    setCart((prev) => {
      const exists = prev.find((c) => c.id === item.id);
      if (exists) return prev.map((c) => c.id === item.id ? { ...c, qty: c.qty + 1 } : c);
      return [...prev, { ...item, qty: 1 }];
    });
  };

  const removeFromCart = (itemId) => {
    setCart((prev) => {
      const exists = prev.find((c) => c.id === itemId);
      if (exists && exists.qty === 1) return prev.filter((c) => c.id !== itemId);
      return prev.map((c) => c.id === itemId ? { ...c, qty: c.qty - 1 } : c);
    });
  };

  const total = cart.reduce((sum, c) => sum + (c.price * c.qty), 0);
  const totalQty = cart.reduce((sum, c) => sum + c.qty, 0);

  const confirmOrder = async () => {
    const num = Math.floor(Math.random() * 90 + 10);
    try {
      const docRef = await addDoc(collection(db, "orders"), {
        items: cart.map((c) => ({ name: c.name, qty: c.qty })),
        total: total,
        number: num,
        status: "調理中",
        createdAt: new Date(),
      });
      setCurrentOrderId(docRef.id);
      setPage("done");
    } catch (e) {
      alert("Firebase送信エラー: " + e.message);
    }
  };

  const handleReceived = async () => {
    try {
      await updateDoc(doc(db, "orders", currentOrderId), { status: "完了" });
      setCart([]);
      setCurrentOrderId(null);
      setCurrentOrder(null);
      setPage("menu");
    } catch (e) {
      alert("エラー: " + e.message);
    }
  };

  const filteredMenu = selectedCategory === "すべて" 
    ? MENU 
    : MENU.filter(item => item.category === selectedCategory);
      if (page === "cart") {
    return (
      <div style={{ maxWidth: "480px", margin: "0 auto", fontFamily: "sans-serif", background: "#f9f9f9", minHeight: "100vh" }}>
        <div style={{ background: "#ff6b35", color: "white", padding: "16px", textAlign: "center" }}>
          <h1 style={{ margin: 0, fontSize: "20px" }}>🛒 カート確認</h1>
        </div>
        <div style={{ padding: "16px" }}>
          {cart.map((c) => (
            <div key={c.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: "1px solid #eee" }}>
              <div>
                <span style={{ fontSize: "20px", marginRight: "8px" }}>{c.img}</span>
                <span style={{ fontWeight: "bold" }}>{c.name}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <button onClick={() => removeFromCart(c.id)} style={{ padding: "4px 10px", background: "#eee", border: "none", borderRadius: "4px", cursor: "pointer" }}>-</button>
                <span style={{ fontWeight: "bold" }}>{c.qty}</span>
                <button onClick={() => addToCart(c)} style={{ padding: "4px 10px", background: "#ff6b35", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}>+</button>
                <span style={{ fontWeight: "bold", marginLeft: "10px", minWidth: "60px", textAlign: "right" }}>¥{c.price * c.qty}</span>
              </div>
            </div>
          ))}
          <div style={{ fontWeight: "bold", fontSize: "22px", margin: "24px 0", textAlign: "right", color: "#ff6b35" }}>
            合計：¥{total}
          </div>
          <button onClick={confirmOrder} style={{ width: "100%", background: "#ff6b35", color: "white", border: "none", borderRadius: "24px", padding: "14px", fontSize: "18px", fontWeight: "bold", cursor: "pointer" }}>
            注文を確定する
          </button>
          <button onClick={() => setPage("menu")} style={{ width: "100%", marginTop: "12px", background: "#eee", border: "none", borderRadius: "24px", padding: "12px", fontSize: "16px", cursor: "pointer", color: "#555" }}>
            メニューに戻る
          </button>
        </div>
      </div>
    );
  }

  if (page === "done") {
    const isReady = currentOrder?.status === "呼び出し中";
    return (
      <div style={{ maxWidth: "480px", margin: "0 auto", fontFamily: "sans-serif", textAlign: "center", padding: "40px 16px", background: "#fff", minHeight: "100vh" }}>
        <div style={{ fontSize: "72px" }}>{isReady ? "🔔" : "⏳"}</div>
        <h2 style={{ color: isReady ? "#ff6b35" : "#2bc473", marginTop: "8px" }}>
          {isReady ? "料理ができました！" : "ただいま調理中..."}
        </h2>
        <p style={{ color: "#666" }}>
          {isReady ? "カウンターまで受け取りに来てください！" : "カウンターのモニターまたはこの画面でお待ちください"}
        </p>

        <div style={{ background: isReady ? "#fff0f0" : "#fff5f0", border: isReady ? "3px solid #ff6b35" : "2px dashed #ff6b35", borderRadius: "16px", padding: "24px", margin: "24px 0" }}>
          <span style={{ fontSize: "14px", color: "#ff6b35", fontWeight: "bold" }}>あなたの呼出番号</span>
          <div style={{ fontSize: "56px", fontWeight: "bold", color: "#ff6b35", margin: "8px 0" }}>
            #{currentOrder?.number || "ーー"}
          </div>
          <div style={{ background: isReady ? "#ff6b35" : "#ccc", color: "white", display: "inline-block", padding: "6px 16px", borderRadius: "12px", fontWeight: "bold", fontSize: "14px" }}>
            状態：{currentOrder?.status || "調理中"}
          </div>
        </div>

        {isReady ? (
          <button onClick={handleReceived} style={{ width: "100%", background: "#2bc473", color: "white", border: "none", borderRadius: "24px", padding: "16px", fontSize: "18px", fontWeight: "bold", cursor: "pointer", boxShadow: "0 4px 6px rgba(43,196,115,0.3)" }}>
            👍 商品を受け取りました
          </button>
        ) : (
          <button onClick={() => setPage("menu")} style={{ marginTop: "24px", background: "#333", color: "white", border: "none", borderRadius: "24px", padding: "14px 32px", fontSize: "16px", fontWeight: "bold", cursor: "pointer" }}>
            メニュー画面に戻る
          </button>
        )}
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "480px", margin: "0 auto", fontFamily: "sans-serif", background: "#f4f4f4", minHeight: "100vh", paddingBottom: "80px", position: "relative" }}>
      <div style={{ background: "linear-gradient(135deg, #ff6b35 0%, #ff8c42 100%)", color: "white", padding: "20px 16px", textAlign: "center", borderBottomLeftRadius: "16px", borderBottomRightRadius: "16px" }}>
        <h1 style={{ margin: 0, fontSize: "24px", letterSpacing: "1px" }}>🍱 学食注文アプリ</h1>
        <div style={{ fontSize: "12px", marginTop: "6px", cursor: "pointer", opacity: 0.8, textDecoration: "underline" }} onClick={() => setPage("staff")}>
          スタッフ専用画面はこちら
        </div>
      </div>

      {currentOrderId && (
        <div style={{ padding: "12px 12px 0 12px" }}>
          <button 
            onClick={() => setPage("done")}
            style={{ width: "100%", background: "#fff", border: "2px solid #ff6b35", color: "#ff6b35", borderRadius: "12px", padding: "12px", fontWeight: "bold", fontSize: "15px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", boxShadow: "0 4px 6px rgba(0,0,0,0.05)" }}
          >
            <span>⏳</span> 現在の注文状況を確認する（#{currentOrder?.number}）
          </button>
        </div>
      )}

      <div style={{ display: "flex", overflowX: "auto", padding: "12px 8px", gap: "8px" }}>
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            style={{
              padding: "8px 16px",
              borderRadius: "20px",
              border: "none",
              background: selectedCategory === cat ? "#ff6b35" : "#fff",
              color: selectedCategory === cat ? "#fff" : "#333",
              fontWeight: "bold",
              cursor: "pointer",
              whiteSpace: "nowrap"
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      <div style={{ padding: "0 12px" }}>
        {filteredMenu.map((item) => {
          const isSoldOut = soldOutItems.includes(item.id);
          return (
            <div key={item.id} style={{ background: "#fff", borderRadius: "12px", padding: "14px", marginBottom: "12px", display: "flex", justifyContent: "space-between", alignItems: "center", borderLeft: item.recommended ? "5px solid #ffbb00" : "none", opacity: isSoldOut ? 0.5 : 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{ fontSize: "36px", background: "#f9f9f9", width: "50px", height: "50px", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {item.img}
                </div>
                <div>
                  {item.recommended && !isSoldOut && <span style={{ background: "#ffbb00", color: "#fff", fontSize: "10px", padding: "2px 6px", borderRadius: "4px", fontWeight: "bold", marginRight: "4px" }}>おすすめ★</span>}
                  <div style={{ fontWeight: "bold", fontSize: "16px", marginTop: "2px" }}>{item.name}</div>
                  <div style={{ color: "#888", fontSize: "12px", marginTop: "2px" }}>{item.desc}</div>
                </div>
              </div>
              <div style={{ textAlign: "right", minWidth: "80px" }}>
                <div style={{ color: isSoldOut ? "#888" : "#ff6b35", fontWeight: "bold", fontSize: "18px" }}>¥{item.price}</div>
                <button 
                  disabled={isSoldOut}
                  onClick={() => addToCart(item)} 
                  style={{ marginTop: "6px", background: isSoldOut ? "#ccc" : "#ff6b35", color: "white", border: "none", borderRadius: "16px", padding: "6px 16px", fontWeight: "bold", cursor: isSoldOut ? "not-allowed" : "pointer", fontSize: "13px" }}
                >
                  {isSoldOut ? "売切" : "追加"}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {cart.length > 0 && (
        <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, display: "flex", justifyContent: "center", padding: "12px", background: "rgba(255,255,255,0.9)", borderTop: "1px solid #eee" }}>
          <button onClick={() => setPage("cart")} style={{ width: "100%", maxWidth: "450px", background: "#333", color: "white", border: "none", borderRadius: "24px", padding: "14px", fontSize: "16px", fontWeight: "bold", cursor: "pointer", display: "flex", justifyContent: "space-between", paddingLeft: "24px", paddingRight: "24px" }}>
            <span>🛒 カートを見る（{totalQty}点）</span>
            <span>¥{total} ＞</span>
          </button>
        </div>
      )}
    </div>
  );
}

export default App;