"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import Link from "next/link";
import CategoryManager from "@/components/CategoryManager";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface Item {
  id: number;
  item_name: string;
  category: string;
  is_bought?: boolean;
  is_completed?: boolean;
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

    const { data: catData } = await supabase
      .from("shopping_categories")
      .select("*")
      .order("name", { ascending: true });

    if (catData) setCategories(catData);

    const { data: itemData } = await supabase
      .from("shopping_list")
      .select("*")
      .order("id", { ascending: false });

    if (itemData) {
      // נרמול הסטטוס בין is_bought ל-is_completed
      const normalizedData = itemData.map((item) => ({
        ...item,
        is_bought: item.is_bought ?? item.is_completed ?? false,
      }));
      setItems(normalizedData);
    }
    setLoading(false);
  }

  async function handleAddItem(e: React.FormEvent) {
    e.preventDefault();
    if (!newItemName.trim()) return;

    const { data, error } = await supabase
      .from("shopping_list")
      .insert([{ item_name: newItemName.trim(), category: selectedCategory, is_bought: false, is_completed: false }])
      .select();

    if (!error && data) {
      const newItem = {
        ...data[0],
        is_bought: false,
      };
      setItems([newItem, ...items]);
      setNewItemName("");
    }
  }

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

  async function toggleBought(id: number, currentStatus: boolean) {
    const newStatus = !currentStatus;

    // עדכון מקומי מידי בממשק
    setItems((prevItems) =>
      prevItems.map((item) => (item.id === id ? { ...item, is_bought: newStatus, is_completed: newStatus } : item))
    );

    // ניסיון עדכון העמודה is_bought
    const { error: error1 } = await supabase
      .from("shopping_list")
      .update({ is_bought: newStatus })
      .eq("id", id);

    // ניסיון גיבוי לעמודה is_completed במידה ואינה נקראת is_bought ב-DB
    if (error1) {
      await supabase
        .from("shopping_list")
        .update({ is_completed: newStatus })
        .eq("id", id);
    }
  }

  async function deleteItem(id: number) {
    const { error } = await supabase.from("shopping_list").delete().eq("id", id);
    if (!error) {
      setItems(items.filter((item) => item.id !== id));
    }
  }

  const filteredItems = items.filter((item) => {
    if (filterCategory === "הכל") return true;
    return item.category === filterCategory;
  });

  return (
    <div className="min-h-screen bg-white text-gray-900 p-4 md:p-8" dir="rtl">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex justify-between items-center border-b pb-4">
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
            🛒 ציוד חסר לבית
          </h1>
          <Link href="/" className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition">
            ← חזרה לבית
          </Link>
        </div>

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
              {categories.map((cat) => (
                <option key={cat.id} value={cat.name}>
                  {cat.name}
                </option>
              ))}
            </select>
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium p-2.5 rounded-lg transition"
            >
              + הוסף לרשימה
            </button>
          </div>
        </form>

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

        {loading ? (
          <div className="text-center py-8 text-gray-500">טוען נתונים...</div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-xl text-gray-500 border border-dashed">
            אין פריטים בקטגוריה זו
          </div>
        ) : (
          <div className="space-y-2">
            {filteredItems.map((item) => {
              const isChecked = Boolean(item.is_bought);
              return (
                <div
                  key={item.id}
                  onClick={() => toggleBought(item.id, isChecked)}
                  className={`flex items-center justify-between p-3.5 rounded-xl border transition cursor-pointer select-none ${
                    isChecked
                      ? "bg-gray-100 border-gray-300"
                      : "bg-white border-gray-200 shadow-sm hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-center gap-3 flex-1">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => {}} 
                      className="w-5 h-5 accent-blue-600 rounded cursor-pointer pointer-events-none"
                    />
                    <div className="flex items-center gap-2">
                      <span
                        style={{
                          textDecoration: isChecked ? "line-through" : "none",
                          color: isChecked ? "#6b7280" : "#111827",
                          fontWeight: 500,
                        }}
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
              );
            })}
          </div>
        )}

        <div className="mt-8">
          <CategoryManager onDataChanged={fetchData} />
        </div>
      </div>
    </div>
  );
}