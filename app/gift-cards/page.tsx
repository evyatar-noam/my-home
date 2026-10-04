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
    if (!text) return <span className="text-gray-300">-</span>;
    if (text.startsWith("http://") || text.startsWith("https://")) {
      return (
        <a
          href={text}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:underline font-medium break-all"
        >
          🔗 לחץ לצפייה ברשתות
        </a>
      );
    }
    return <span className="text-gray-700 text-xs">{text}</span>;
  };

  return (
    <main className="min-h-screen bg-gray-50 p-6 font-sans dir-rtl" style={{ direction: "rtl" }}>
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
              💳 ניהול גיפטקארדים שוברים
            </h1>
            <p className="text-gray-500 font-semibold mt-1">
              סה"כ יתרה זמינה בשוברים:{" "}
              <span className="text-emerald-600 font-bold text-lg">₪{totalBalance}</span>
            </p>
          </div>
          <Link
            href="/"
            className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition"
          >
            ← חזרה לדף הבית
          </Link>
        </div>

        {/* טופס הוספת גיפטקארד */}
        <form
          onSubmit={handleAddCard}
          className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 mb-6 space-y-4"
        >
          <h2 className="text-lg font-bold text-gray-800 border-b pb-2">הוספת גיפטקארד / שובר חדש</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">שם החברה / רשת</label>
              <input
                type="text"
                placeholder="שם החברה / רשת (למשל: BuyMe)"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full p-2.5 border border-gray-300 rounded-xl text-sm outline-none text-gray-900 bg-white"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">סכום מקורי (₪)</label>
              <input
                type="number"
                placeholder="סכום מקורי (₪)"
                value={initialBalance}
                onChange={(e) => setInitialBalance(e.target.value)}
                className="w-full p-2.5 border border-gray-300 rounded-xl text-sm outline-none text-gray-900 bg-white"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">יתרה עדכנית (אופציונלי)</label>
              <input
                type="number"
                placeholder="יתרה עדכנית (השאר ריק אם מלא)"
                value={currentBalance}
                onChange={(e) => setCurrentBalance(e.target.value)}
                className="w-full p-2.5 border border-gray-300 rounded-xl text-sm outline-none text-gray-900 bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">תוקף</label>
              <input
                type="date"
                value={expirationDate}
                onChange={(e) => setExpirationDate(e.target.value)}
                className="w-full p-2.5 border border-gray-300 rounded-xl text-sm outline-none text-gray-900 bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">מספר כרטיס / קוד</label>
              <input
                type="text"
                placeholder="מספר כרטיס / קוד (לגיבוי)"
                value={cardNumber}
                onChange={(e) => setCardNumber(e.target.value)}
                className="w-full p-2.5 border border-gray-300 rounded-xl text-sm outline-none text-gray-900 bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">רשתות מכבדות / קישור</label>
              <input
                type="text"
                placeholder="הדבק קישור או רשימת רשתות"
                value={acceptedPlaces}
                onChange={(e) => setAcceptedPlaces(e.target.value)}
                className="w-full p-2.5 border border-gray-300 rounded-xl text-sm outline-none text-gray-900 bg-white"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <input
              type="text"
              placeholder="הערות נוספות"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="flex-1 p-2.5 border border-gray-300 rounded-xl text-sm outline-none text-gray-900 bg-white"
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

        {/* טבלת הגיפטקארדים */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-gray-600 text-sm">
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
              {cards.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-gray-400">
                    אין עדיין גיפטקארדים במערכת.
                  </td>
                </tr>
              ) : (
                cards.map((card) => (
                  <tr key={card.id} className="border-b border-gray-100 hover:bg-gray-50 transition">
                    <td className="p-4 font-semibold text-gray-800">{card.company_name}</td>
                    <td className="p-4 text-gray-600">₪{card.initial_balance}</td>
                    <td className="p-4 font-bold text-emerald-600">₪{card.current_balance}</td>
                    <td className="p-4 text-gray-500 text-sm">{card.expiration_date || "-"}</td>
                    <td className="p-4 text-xs text-gray-600">
                      {card.card_number && <div><strong>קוד:</strong> {card.card_number}</div>}
                      {card.notes && <div className="text-gray-500">{card.notes}</div>}
                      {!card.card_number && !card.notes && "-"}
                    </td>
                    <td className="p-4">{renderAcceptedPlaces(card.accepted_places)}</td>
                    <td className="p-4 text-center flex justify-center items-center gap-2">
                      <button
                        onClick={() => handleUpdateBalance(card.id, card.current_balance)}
                        className="px-3 py-1 bg-blue-100 hover:bg-blue-200 text-blue-800 text-xs rounded-lg font-medium transition"
                      >
                        עדכן יתרה
                      </button>
                      <button
                        onClick={() => handleDeleteCard(card.id)}
                        className="px-3 py-1 bg-red-100 hover:bg-red-200 text-red-800 text-xs rounded-lg font-medium transition"
                      >
                        מחק
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}