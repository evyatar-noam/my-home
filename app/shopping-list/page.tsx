'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

interface ShoppingItem {
  id: string;
  item_name: string;
  category: string;
  priority: 'low' | 'medium' | 'high';
  is_purchased: boolean;
  notes: string;
}

export default function ShoppingListPage() {
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [loading, setLoading] = useState(true);

  // טופס
  const [itemName, setItemName] = useState('');
  const [category, setCategory] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    fetchItems();
  }, []);

  async function fetchItems() {
    setLoading(true);
    const { data, error } = await supabase
      .from('shopping_list')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setItems(data);
    }
    setLoading(false);
  }

  async function addItem(e: React.FormEvent) {
    e.preventDefault();
    if (!itemName.trim()) return;

    const { error } = await supabase.from('shopping_list').insert([
      {
        item_name: itemName,
        category,
        priority,
        notes,
      },
    ]);

    if (!error) {
      setItemName('');
      setCategory('');
      setPriority('medium');
      setNotes('');
      fetchItems();
    }
  }

  async function togglePurchased(id: string, currentStatus: boolean) {
    const { error } = await supabase
      .from('shopping_list')
      .update({ is_purchased: !currentStatus })
      .eq('id', id);

    if (!error) {
      fetchItems();
    }
  }

  async function deleteItem(id: string) {
    const { error } = await supabase
      .from('shopping_list')
      .delete()
      .eq('id', id);

    if (!error) {
      fetchItems();
    }
  }

  return (
    <main className="max-w-4xl mx-auto p-6 dir-rtl text-right">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">רשימת ציוד חסר לבית</h1>
        <Link href="/" className="text-blue-600 hover:underline">
          → חזרה לדף הבית
        </Link>
      </div>

      {/* טופס הוספה */}
      <form onSubmit={addItem} className="bg-white p-4 rounded shadow mb-8 border border-gray-200">
        <h2 className="text-xl font-semibold mb-4">הוספת פריט חסר</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            type="text"
            placeholder="שם המוצר (למשל: מגהץ קיטור)"
            value={itemName}
            onChange={(e) => setItemName(e.target.value)}
            className="border p-2 rounded w-full"
            required
          />
          <input
            type="text"
            placeholder="קטגוריה (למשל: חשמל, מטבח)"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="border p-2 rounded w-full"
          />
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value as any)}
            className="border p-2 rounded w-full bg-white"
          >
            <option value="low">עדיפות נמוכה</option>
            <option value="medium">עדיפות בינונית</option>
            <option value="high">עדיפות גבוהה</option>
          </select>
          <input
            type="text"
            placeholder="הערות / קישור"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="border p-2 rounded w-full"
          />
        </div>
        <button
          type="submit"
          className="mt-4 bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 font-bold"
        >
          הוסף לרשימה
        </button>
      </form>

      {/* טבלת פריטים */}
      {loading ? (
        <p>טוען נתונים...</p>
      ) : (
        <div className="bg-white rounded shadow overflow-x-auto border border-gray-200">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="bg-gray-100 border-b">
                <th className="p-3">סטטוס</th>
                <th className="p-3">שם המוצר</th>
                <th className="p-3">קטגוריה</th>
                <th className="p-3">עדיפות</th>
                <th className="p-3">הערות</th>
                <th className="p-3">פעולות</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-4 text-center text-gray-500">
                    אין פריטים ברשימה עדיין.
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr
                    key={item.id}
                    className={`border-b ${
                      item.is_purchased ? 'bg-green-50 line-through text-gray-500' : ''
                    }`}
                  >
                    <td className="p-3">
                      <input
                        type="checkbox"
                        checked={item.is_purchased}
                        onChange={() => togglePurchased(item.id, item.is_purchased)}
                        className="w-5 h-5"
                      />
                    </td>
                    <td className="p-3 font-semibold">{item.item_name}</td>
                    <td className="p-3">{item.category || '-'}</td>
                    <td className="p-3">
                      {item.priority === 'high' && '🔴 גבוהה'}
                      {item.priority === 'medium' && '🟡 בינונית'}
                      {item.priority === 'low' && '🟢 נמוכה'}
                    </td>
                    <td className="p-3">{item.notes || '-'}</td>
                    <td className="p-3">
                      <button
                        onClick={() => deleteItem(item.id)}
                        className="text-red-600 hover:underline text-sm font-semibold"
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