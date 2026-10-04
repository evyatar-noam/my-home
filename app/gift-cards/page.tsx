"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "../../lib/supabase";

interface GiftCard {
  id: number;
  company_name: string;
  initial_balance: number;
  current_balance: number;
  card_number: string | null;
  expiration_date: string | null;
  accepted_places?: string | null;
  notes: string | null;
  created_at?: string;
}

export default function GiftCardsPage() {
  const [cards, setCards] = useState<GiftCard[]>([]);
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");

  const [companyName, setCompanyName] = useState("");
  const [initialBalance, setInitialBalance] = useState("");
  const [currentBalance, setCurrentBalance] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [expirationDate, setExpirationDate] = useState("");
  const [acceptedPlaces, setAcceptedPlaces] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchCards();
  }, []);

  const fetchCards = async () => {
    const { data, error } = await supabase
      .from("gift_cards")
      .select("*")
      .order("id", { ascending: false });

    if (error) {
      console.error("שגיאה בטעינת גיפטקארדים:", error.message);
    } else if (data) {
      setCards(data);
    }
  };

  const handleAddCard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName || !initialBalance) return;

    setLoading(true);
    const initVal = parseFloat(initialBalance);
    const currVal = currentBalance ? parseFloat(currentBalance) : initVal;

    const { data, error } = await supabase
      .from("gift_cards")
      .insert([
        {
          company_name: companyName,
          initial_balance: initVal,
          current_balance: currVal,
          card_number: cardNumber || null,
          expiration_date: expirationDate || null,
          accepted_places: acceptedPlaces || null,
          notes: notes || null,
        },
      ])
      .select();

    if (error) {
      console.error("שגיאה בהוספת גיפטקארד:", error.message);
      alert("שגיאה בהוספה: " + error.message);
    } else if (data) {
      setCards([data[0], ...cards]);
      setCompanyName("");
      setInitialBalance("");
      setCurrentBalance("");
      setCardNumber("");
      setExpirationDate("");
      setAcceptedPlaces("");
      setNotes("");
    }
    setLoading(false);
  };

  const handleUpdateBalance = async (id: number, currentBal: number) => {
    const newBalanceStr = prompt("הכנס יתרה מעודכנת (₪):", currentBal.toString());
    if (newBalanceStr === null) return;

    const newBalance = parseFloat(newBalanceStr);
    if (isNaN(newBalance)) {
      alert("סכום לא תקין");
      return;
    }

    const { error } = await supabase
      .from("gift_cards")
      .update({ current_balance: newBalance })
      .eq("id", id);

    if (error) {
      console.error("שגיאה בעדכון יתרה:", error.message);
    } else {
      setCards(cards.map((c) => (c.id === id ? { ...c, current_balance: newBalance } : c)));
    }
  };

  const handleDeleteCard = async (id: number) => {
    if (!confirm("האם אתה בטוח שברצונך למחוק גיפטקארד זה?")) return;

    const { error } = await supabase.from("gift_cards").delete().eq("id", id);

    if (error) {
      console.error("שגיאה במחיקת גיפטקארד:", error.message);
    } else {
      setCards(cards.filter((c) => c.id !== id));
    }
  };

  const totalBalance = cards.reduce((sum, c) => sum + (c.current_balance || 0), 0);

  const renderAcceptedPlaces = (text: string | null | undefined) => {
    if (!text) return null;
    if (text.startsWith("http://") || text.startsWith("https://")) {
      return (
        <a
          href={text}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 font-medium text-xs bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-100 transition"
        >
          🔗 לרשתות מכבדות
        </a>
      );
    }
    return <span className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded-md">{text}</span>;
  };

  return (
    <main className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans dir-rtl" style={{ direction: "rtl" }}>
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* כותרת עליונה */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-800 flex items-center gap-2">
              💳 ניהול גיפטקארדים ושוברים
            </h1>
            <p className="text-slate-500 font-medium mt-1">
              סה"כ יתרה זמינה בשוברים:{" "}
              <span className="text-emerald-600 font-bold text-xl">₪{totalBalance}</span>
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* כפתור החלפת תצוגה */}
            <div className="bg-slate-100 p-1 rounded-xl flex items-center gap-1 border border-slate-200">
              <button
                onClick={() => setViewMode("grid")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  viewMode === "grid"
                    ? "bg-white text-slate-800 shadow-sm"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                🪟 כרטיסיות
              </button>
              <button
                onClick={() => setViewMode("table")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  viewMode === "table"
                    ? "bg-white text-slate-800 shadow-sm"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                📊 טבלה
              </button>
            </div>

            <Link
              href="/"
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-700 font-medium transition text-sm"
            >
              ← חזרה לדף הבית
            </Link>
          </div>
        </div>

        {/* טופס הוספה */}
        <form
          onSubmit={handleAddCard}
          className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4"
        >
          <h2 className="text-base font-bold text-slate-800 border-b pb-2">הוספת גיפטקארד / שובר חדש</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">שם החברה / רשת</label>
              <input
                type="text"
                placeholder="למשל: BuyMe / Fox Home"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full p-2.5 border border-slate-300 rounded-xl text-sm outline-none bg-slate-50 focus:bg-white text-slate-800"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">סכום מקורי (₪)</label>
              <input
                type="number"
                placeholder="סכום מקורי (₪)"
                value={initialBalance}
                onChange={(e) => setInitialBalance(e.target.value)}
                className="w-full p-2.5 border border-slate-300 rounded-xl text-sm outline-none bg-slate-50 focus:bg-white text-slate-800"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">יתרה עדכנית (אופציונלי)</label>
              <input
                type="number"
                placeholder="יתרה עדכנית"
                value={currentBalance}
                onChange={(e) => setCurrentBalance(e.target.value)}
                className="w-full p-2.5 border border-slate-300 rounded-xl text-sm outline-none bg-slate-50 focus:bg-white text-slate-800"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">תוקף</label>
              <input
                type="date"
                value={expirationDate}
                onChange={(e) => setExpirationDate(e.target.value)}
                className="w-full p-2.5 border border-slate-300 rounded-xl text-sm outline-none bg-slate-50 focus:bg-white text-slate-800"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">מספר כרטיס / קוד</label>
              <input
                type="text"
                placeholder="מספר כרטיס / קוד"
                value={cardNumber}
                onChange={(e) => setCardNumber(e.target.value)}
                className="w-full p-2.5 border border-slate-300 rounded-xl text-sm outline-none bg-slate-50 focus:bg-white text-slate-800"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">רשתות מכבדות / קישור</label>
              <input
                type="text"
                placeholder="הדבק קישור או רשימת רשתות"
                value={acceptedPlaces}
                onChange={(e) => setAcceptedPlaces(e.target.value)}
                className="w-full p-2.5 border border-slate-300 rounded-xl text-sm outline-none bg-slate-50 focus:bg-white text-slate-800"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <input
              type="text"
              placeholder="הערות נוספות"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="flex-1 p-2.5 border border-slate-300 rounded-xl text-sm outline-none bg-slate-50 focus:bg-white text-slate-800"
            />
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl transition shadow-md text-sm disabled:opacity-50"
            >
              {loading ? "שומר..." : "שמור גיפטקארד"}
            </button>
          </div>
        </form>

        {/* הצגת הנתונים: כרטיסיות או טבלה */}
        {cards.length === 0 ? (
          <div className="bg-white p-12 rounded-2xl text-center text-slate-400 border border-slate-200">
            אין עדיין גיפטקארדים במערכת.
          </div>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {cards.map((card) => (
              <div
                key={card.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 hover:shadow-md transition flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    <h3 className="text-lg font-bold text-slate-800">{card.company_name}</h3>
                    <span className="text-xs font-semibold px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-lg">
                      ₪{card.current_balance} יתרה
                    </span>
                  </div>

                  <div className="text-xs text-slate-500 space-y-1">
                    <div>סכום מקורי: ₪{card.initial_balance}</div>
                    {card.expiration_date && <div>תוקף: {card.expiration_date}</div>}
                    {card.card_number && (
                      <div className="font-mono bg-slate-100 p-1.5 rounded text-slate-700 break-all mt-1">
                        קוד: {card.card_number}
                      </div>
                    )}
                    {card.notes && <div className="text-slate-400 italic">{card.notes}</div>}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <div>{renderAcceptedPlaces(card.accepted_places)}</div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleUpdateBalance(card.id, card.current_balance)}
                      className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs rounded-lg font-medium transition"
                    >
                      עדכן יתרה
                    </button>
                    <button
                      onClick={() => handleDeleteCard(card.id)}
                      className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs rounded-lg font-medium transition"
                    >
                      מחק
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <table className="w-full text-right border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600">
                  <th className="p-4">חברה/רשת</th>
                  <th className="p-4">סכום מקורי</th>
                  <th className="p-4">יתרה נוכחית</th>
                  <th className="p-4">תוקף</th>
                  <th className="p-4">קוד / הערות</th>
                  <th className="p-4">רשתות מכבדות</th>
                  <th className="p-4 text-center">פעולות</th>
                </tr>
              </thead>
              <tbody>
                {cards.map((card) => (
                  <tr key={card.id} className="border-b border-slate-100 hover:bg-slate-50 transition">
                    <td className="p-4 font-semibold text-slate-800">{card.company_name}</td>
                    <td className="p-4 text-slate-600">₪{card.initial_balance}</td>
                    <td className="p-4 font-bold text-emerald-600">₪{card.current_balance}</td>
                    <td className="p-4 text-slate-500">{card.expiration_date || "-"}</td>
                    <td className="p-4 text-xs text-slate-600">
                      {card.card_number && <div><strong>קוד:</strong> {card.card_number}</div>}
                      {card.notes && <div className="text-slate-400">{card.notes}</div>}
                      {!card.card_number && !card.notes && "-"}
                    </td>
                    <td className="p-4">{renderAcceptedPlaces(card.accepted_places)}</td>
                    <td className="p-4 text-center flex justify-center items-center gap-2">
                      <button
                        onClick={() => handleUpdateBalance(card.id, card.current_balance)}
                        className="px-3 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs rounded-lg font-medium transition"
                      >
                        עדכן יתרה
                      </button>
                      <button
                        onClick={() => handleDeleteCard(card.id)}
                        className="px-3 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs rounded-lg font-medium transition"
                      >
                        מחק
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}