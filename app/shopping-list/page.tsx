"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import Link from "next/link";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface Item {
  id: number;
  item_name: string;
  category: string;
  is_bought: boolean;
}

interface Category {
  id: number;
  name: string;
}

export default function ShoppingPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("כללי");
  const [newItemName, setNewItemName] = useState<string>("");
  const [newCatName, setNewCatName] = useState<string>("");
  const [filterCategory, setFilterCategory] = useState<string>("הכל");
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    // טעינת קטגוריות
    const { data: catData } = await supabase
      .from("shopping_categories")
      .select("*")
      .order("name", { ascending: true });

    if (catData) setCategories(catData);

    // טעינת פריטים
    const { data: itemData } = await supabase
      .from("shopping_list")
      .select("*")
      .order("id", { ascending: false });

    if (itemData) setItems(itemData);
    setLoading(false);
  }

  // הוספת פריט חדש
  async function handleAddItem(e: React.FormEvent) {
    e.preventDefault();
    if (!newItemName.trim()) return;

    const { data, error } = await supabase
      .from("shopping_list")
      .insert([{ item_name: newItemName.trim(), category: selectedCategory, is_bought: false }])
      .select();

    if (!error && data) {
      setItems([data[0], ...items]);
      setNewItemName("");
    }
  }

  // הוספת קטגוריה חדשה
  async function handleAddCategory(e: React.FormEvent) {
    e.preventDefault();
    if (!newCatName.trim()) return;

    const { data, error } = await supabase
      .from("shopping_categories")
      .insert([{ name: newCatName.trim() }])
      .select();

    if (!error && data) {
      setCategories([...categories, data[0]]);
      setSelectedCategory(data[0].name);
      setNewCatName("");
    }
  }

  // עדכון סטטוס נקנה/לא נקנה
  async function toggleBought(id: number, currentStatus: boolean) {
    const { error } = await supabase
      .from("shopping_list")
      .update({ is_bought: !currentStatus })
      .eq("id", id);

    if (!error) {
      setItems(items.map(item => item.id === id ? { ...item, is_bought: !currentStatus } : item));
    }
  }

  // מחיקת פריט לחלוטין מהמסד נתונים
  async function deleteItem(id: number) {
    const { error } = await supabase.from("shopping_list").delete().eq("id", id);
    if (!error) {
      setItems(items.filter(item => item.id !== id));
    }
  }

  // סינון פריטים לפי קטגוריה
  const filteredItems = items.filter(item => {
    if (filterCategory === "הכל") return true;
    return item.category === filterCategory;
  });

  return (
    <div className="min-h-screen bg-white text-gray-900 p-4 md:p-8" dir="rtl">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* כותרת וכפתור חזרה */}
        <div className="flex justify-between items-center border-b pb-4">
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
            🛒 ציוד חסר לבית
          </h1>
          <Link href="/" className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition">
            ← חזרה לבית
          </Link>
        </div>

        {/* טופס הוספת פריט */}
        <form onSubmit={handleAddItem} className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-3">
          <h2 className="font-semibold text-lg">הוספת ציוד חדש</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input
              type="text"
              placeholder="שם המוצר/הציוד..."
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              className="p-2.5 border rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="p-2.5 border rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {categories.length === 0 ? (
                <option value="כללי">כללי</option>
              ) : (
                categories.map((cat) => (
                  <option key={cat.id} value={cat.name}>
                    {cat.name}
                  </option>
                ))
              )}
            </select>
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium p-2.5 rounded-lg transition"
            >
              + הוסף לרשימה
            </button>
          </div>
        </form>

        {/* טופס הוספת קטגוריה חדשה */}
        <form onSubmit={handleAddCategory} className="bg-gray-50 p-4 rounded-xl border border-gray-200 flex flex-col md:flex-row gap-3 items-center">
          <span className="text-sm font-medium text-gray-700 whitespace-nowrap">הוספת קטגוריה חדשה:</span>
          <input
            type="text"
            placeholder="שם הקטגוריה..."
            value={newCatName}
            onChange={(e) => setNewCatName(e.target.value)}
            className="p-2 border rounded-lg bg-white text-gray-900 text-sm flex-1 focus:outline-none"
          />
          <button
            type="submit"
            className="bg-gray-800 hover:bg-black text-white text-sm font-medium px-4 py-2 rounded-lg transition"
          >
            + הוסף קטגוריה
          </button>
        </form>

        {/* סרגל סינון לפי קטגוריות */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          <span className="text-sm font-medium text-gray-600 whitespace-nowrap">סינון:</span>
          <button
            onClick={() => setFilterCategory("הכל")}
            className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition ${
              filterCategory === "הכל"
                ? "bg-blue-600 text-white font-medium"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            הכל ({items.length})
          </button>
          {categories.map((cat) => {
            const count = items.filter((i) => i.category === cat.name).length;
            return (
              <button
                key={cat.id}
                onClick={() => setFilterCategory(cat.name)}
                className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition ${
                  filterCategory === cat.name
                    ? "bg-blue-600 text-white font-medium"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {cat.name} ({count})
              </button>
            );
          })}
        </div>

        {/* רשימת הציוד */}
        {loading ? (
          <div className="text-center py-8 text-gray-500">טוען נתונים...</div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-xl text-gray-500 border border-dashed">
            אין פריטים בקטגוריה זו
          </div>
        ) : (
          <div className="space-y-2">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                className={`flex items-center justify-between p-3.5 rounded-xl border transition ${
                  item.is_bought 
                    ? "bg-gray-100 border-gray-300 opacity-70" 
                    : "bg-white border-gray-200 shadow-sm"
                }`}
              >
                <div 
                  className="flex items-center gap-3 flex-1 cursor-pointer"
                  onClick={() => toggleBought(item.id, item.is_bought)}
                >
                  <input
                    type="checkbox"
                    checked={item.is_bought}
                    onChange={() => {}} // מעודכן דרך ה-onClick של השורה
                    className="w-5 h-5 accent-blue-600 rounded cursor-pointer"
                  />
                  <div className="flex items-center gap-2">
                    <span 
                      className={`font-medium transition-all ${
                        item.is_bought 
                          ? "line-through text-gray-400 decoration-2 decoration-gray-500" 
                          : "text-gray-900"
                      }`}
                    >
                      {item.item_name}
                    </span>
                    <span className="text-xs px-2 py-0.5 bg-gray-200 text-gray-700 rounded-md">
                      {item.category || "כללי"}
                    </span>
                  </div>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteItem(item.id);
                  }}
                  className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg transition text-base"
                  title="מחק לצמיתות"
                >
                  🗑️
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}