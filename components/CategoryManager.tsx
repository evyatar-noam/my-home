"use client";

import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface Category {
  id: number;
  name: string;
}

interface CategoryManagerProps {
  onDataChanged?: () => void;
}

export default function CategoryManager({ onDataChanged }: CategoryManagerProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState("");

  // מצבים למיזוג קטגוריות
  const [sourceCategory, setSourceCategory] = useState("");
  const [targetCategory, setTargetCategory] = useState("");
  const [isMerging, setIsMerging] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  async function fetchCategories() {
    const { data } = await supabase
      .from("shopping_categories")
      .select("*")
      .order("name", { ascending: true });

    if (data) setCategories(data);
  }

  // עריכת שם קטגוריה
  function startEdit(cat: Category) {
    setEditingId(cat.id);
    setEditingName(cat.name);
  }

  async function saveEdit(id: number) {
    if (!editingName.trim()) return;

    const oldCat = categories.find((c) => c.id === id);

    const { error } = await supabase
      .from("shopping_categories")
      .update({ name: editingName.trim() })
      .eq("id", id);

    if (!error && oldCat) {
      // עדכון כל המוצרים שהיו משויכים לשם הישן
      await supabase
        .from("shopping_list")
        .update({ category: editingName.trim() })
        .eq("category", oldCat.name);

      setEditingId(null);
      fetchCategories();
      if (onDataChanged) onDataChanged();
    }
  }

  // מחיקת קטגוריה
  async function handleDelete(id: number) {
    if (!confirm("האם אתה בטוח שברצונך למחוק קטגוריה זו?")) return;

    const { error } = await supabase.from("shopping_categories").delete().eq("id", id);
    if (!error) {
      fetchCategories();
      if (onDataChanged) onDataChanged();
    }
  }

  // מיזוג שתי קטגוריות
  async function handleMerge(e: React.FormEvent) {
    e.preventDefault();

    if (!sourceCategory || !targetCategory) {
      alert("יש לבחור קטגוריית מקור וקטגוריית יעד.");
      return;
    }

    if (sourceCategory === targetCategory) {
      alert("לא ניתן למזג קטגוריה לתוך עצמה.");
      return;
    }

    if (
      !confirm(
        `האם למזג את כל המוצרים מ-"${sourceCategory}" ל-"${targetCategory}" ולמחוק את "${sourceCategory}"?`
      )
    ) {
      return;
    }

    setIsMerging(true);

    try {
      // 1. העברת המוצרים לקטגוריה החדשה
      const { error: updateError } = await supabase
        .from("shopping_list")
        .update({ category: targetCategory })
        .eq("category", sourceCategory);

      if (updateError) throw updateError;

      // 2. מחיקת קטגוריית המקור
      const { error: deleteError } = await supabase
        .from("shopping_categories")
        .delete()
        .eq("name", sourceCategory);

      if (deleteError) throw deleteError;

      alert("המיזוג בוצע בהצלחה!");
      setSourceCategory("");
      setTargetCategory("");
      fetchCategories();
      if (onDataChanged) onDataChanged();
    } catch (err: any) {
      alert("שגיאה בביצוע המיזוג: " + err.message);
    } finally {
      setIsMerging(false);
    }
  }

  return (
    <div className="bg-gray-50 border border-gray-200 p-5 rounded-xl space-y-6 text-gray-900" dir="rtl">
      {/* חלק 1: עריכת/מחיקת קטגוריות */}
      <div>
        <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
          ✏️ עריכת ומחיקת קטגוריות
        </h3>
        <ul className="space-y-2">
          {categories.map((cat) => (
            <li key={cat.id} className="flex items-center justify-between p-2.5 bg-white border rounded-lg">
              {editingId === cat.id ? (
                <div className="flex items-center gap-2 w-full">
                  <input
                    type="text"
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    className="p-1.5 border rounded w-full text-sm bg-white text-gray-900"
                  />
                  <button
                    onClick={() => saveEdit(cat.id)}
                    className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-xs font-medium whitespace-nowrap"
                  >
                    שמור
                  </button>
                  <button
                    onClick={() => setEditingId(null)}
                    className="bg-gray-300 text-gray-800 px-2 py-1 rounded text-xs"
                  >
                    ביטול
                  </button>
                </div>
              ) : (
                <>
                  <span className="font-medium text-sm">{cat.name}</span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => startEdit(cat)}
                      className="text-blue-600 hover:underline text-xs font-medium"
                    >
                      ערוך
                    </button>
                    <button
                      onClick={() => handleDelete(cat.id)}
                      className="text-red-600 hover:underline text-xs font-medium"
                    >
                      מחק
                    </button>
                  </div>
                </>
              )}
            </li>
          ))}
        </ul>
      </div>

      {/* חלק 2: מיזוג קטגוריות */}
      <div className="border-t pt-4">
        <h3 className="text-lg font-bold mb-2 flex items-center gap-2">
          🔀 מיזוג שתי קטגוריות לקטגוריה אחת
        </h3>
        <p className="text-xs text-gray-600 mb-3">
          פעולה זו תעביר את כל הפריטים מקטגוריית המקור (למשל "חדר רחצה") לקטגוריית היעד (למשל "אמבטייה"), ותמחוק את קטגוריית המקור.
        </p>

        <form onSubmit={handleMerge} className="space-y-3">
          <div>
            <label className="block text-xs font-medium mb-1">קטגוריה להעברה (מקור):</label>
            <select
              value={sourceCategory}
              onChange={(e) => setSourceCategory(e.target.value)}
              className="w-full p-2 border rounded-lg bg-white text-sm text-gray-900"
            >
              <option value="">-- בחר קטגוריה למחיקה/העברה --</option>
              {categories.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium mb-1">קטגוריה מקבלת (יעד):</label>
            <select
              value={targetCategory}
              onChange={(e) => setTargetCategory(e.target.value)}
              className="w-full p-2 border rounded-lg bg-white text-sm text-gray-900"
            >
              <option value="">-- בחר קטגוריה שתרצה לשמור --</option>
              {categories
                .filter((c) => c.name !== sourceCategory)
                .map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
            </select>
          </div>

          <button
            type="submit"
            disabled={isMerging || !sourceCategory || !targetCategory}
            className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 text-white font-medium p-2 rounded-lg text-sm transition"
          >
            {isMerging ? "ממזג..." : "בצע מיזוג"}
          </button>
        </form>
      </div>
    </div>
  );
}