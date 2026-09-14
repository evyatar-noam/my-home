'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

interface GiftCard {
  id: string;
  company_name: string;
  initial_balance: number;
  current_balance: number;
  expiration_date: string;
  card_number: string;
  notes: string;
}

export default function GiftCardsPage() {
  const [cards, setCards] = useState<GiftCard[]>([]);
  const [loading, setLoading] = useState(true);

  // טופס
  const [companyName, setCompanyName] = useState('');
  const [initialBalance, setInitialBalance] = useState('');
  const [currentBalance, setCurrentBalance] = useState('');
  const [expirationDate, setExpirationDate] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    fetchCards();
  }, []);

  async function fetchCards() {
    setLoading(true);
    const { data, error } = await supabase
      .from('gift_cards')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setCards(data);
    }
    setLoading(false);
  }

  async function addCard(e: React.FormEvent) {
    e.preventDefault();
    if (!companyName.trim() || !initialBalance) return;

    const initVal = parseFloat(initialBalance);
    const currVal = currentBalance ? parseFloat(currentBalance) : initVal;

    const { error } = await supabase.from('gift_cards').insert([
      {
        company_name: companyName,
        initial_balance: initVal,
        current_balance: currVal,
        expiration_date: expirationDate || null,
        card_number: cardNumber,
        notes,
      },
    ]);

    if (!error) {
      setCompanyName('');
      setInitialBalance('');
      setCurrentBalance('');
      setExpirationDate('');
      setCardNumber('');
      setNotes('');
      fetchCards();
    }
  }

  async function updateBalance(id: string, newBalance: number) {
    const { error } = await supabase
      .from('gift_cards')
      .update({ current_balance: newBalance })
      .eq('id', id);

    if (!error) {
      fetchCards();
    }
  }

  async function deleteCard(id: string) {
    const { error } = await supabase
      .from('gift_cards')
      .delete()
      .eq('id', id);

    if (!error) {
      fetchCards();
    }
  }

  const totalBalance = cards.reduce((sum, card) => sum + Number(card.current_balance), 0);

  return (
    <main className="max-w-4xl mx-auto p-6 dir-rtl text-right">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">ניהול גיפטקארדים שוברים</h1>
          <p className="text-gray-600 mt-1">
            סה"כ יתרה זמינה בשוברים: <span className="font-bold text-green-600">₪{totalBalance}</span>
          </p>
        </div>
        <Link href="/" className="text-blue-600 hover:underline">
          → חזרה לדף הבית
        </Link>
      </div>

      {/* טופס הוספה */}
      <form onSubmit={addCard} className="bg-white p-4 rounded shadow mb-8 border border-gray-200">
        <h2 className="text-xl font-semibold mb-4">הוספת גיפטקארד / שובר חדש</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input
            type="text"
            placeholder="שם החברה / רשת (למשל: BuyMe)"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            className="border p-2 rounded w-full"
            required
          />
          <input
            type="number"
            placeholder="סכום מקורי (₪)"
            value={initialBalance}
            onChange={(e) => setInitialBalance(e.target.value)}
            className="border p-2 rounded w-full"
            required
          />
          <input
            type="number"
            placeholder="יתרה עדכנית (השאר ריק אם מלא)"
            value={currentBalance}
            onChange={(e) => setCurrentBalance(e.target.value)}
            className="border p-2 rounded w-full"
          />
          <input
            type="date"
            placeholder="תאריך תפוגה"
            value={expirationDate}
            onChange={(e) => setExpirationDate(e.target.value)}
            className="border p-2 rounded w-full"
          />
          <input
            type="text"
            placeholder="מספר כרטיס / קוד (לגיבוי)"
            value={cardNumber}
            onChange={(e) => setCardNumber(e.target.value)}
            className="border p-2 rounded w-full"
          />
          <input
            type="text"
            placeholder="הערות"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="border p-2 rounded w-full"
          />
        </div>
        <button
          type="submit"
          className="mt-4 bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 font-bold"
        >
          שמור גיפטקארד
        </button>
      </form>

      {/* טבלת כרטיסים */}
      {loading ? (
        <p>טוען נתונים...</p>
      ) : (
        <div className="bg-white rounded shadow overflow-x-auto border border-gray-200">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="bg-gray-100 border-b">
                <th className="p-3">חברה/רשת</th>
                <th className="p-3">סכום מקורי</th>
                <th className="p-3">יתרה נוכחית</th>
                <th className="p-3">תוקף</th>
                <th className="p-3">קוד / הערות</th>
                <th className="p-3">פעולות</th>
              </tr>
            </thead>
            <tbody>
              {cards.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-4 text-center text-gray-500">
                    אין גיפטקארדים ברשימה עדיין.
                  </td>
                </tr>
              ) : (
                cards.map((card) => (
                  <tr key={card.id} className="border-b">
                    <td className="p-3 font-semibold">{card.company_name}</td>
                    <td className="p-3">₪{card.initial_balance}</td>
                    <td className="p-3 font-bold text-green-700">₪{card.current_balance}</td>
                    <td className="p-3">{card.expiration_date || '-'}</td>
                    <td className="p-3 text-sm">
                      {card.card_number && <div>קוד: {card.card_number}</div>}
                      {card.notes && <div className="text-gray-500">{card.notes}</div>}
                      {!card.card_number && !card.notes && '-'}
                    </td>
                    <td className="p-3 flex gap-2">
                      <button
                        onClick={() => {
                          const updated = prompt('הכנס יתרה מעודכנת (₪):', String(card.current_balance));
                          if (updated !== null && !isNaN(parseFloat(updated))) {
                            updateBalance(card.id, parseFloat(updated));
                          }
                        }}
                        className="text-blue-600 hover:underline text-sm font-semibold"
                      >
                        עדכן יתרה
                      </button>
                      <button
                        onClick={() => deleteCard(card.id)}
                        className="text-red-600 hover:underline text-sm font-semibold mr-2"
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
      )}
    </main>
  );
}