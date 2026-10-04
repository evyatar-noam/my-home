"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "../../lib/supabase";

interface Gift {
  id: number;
  guest_name: string;
  gift_name: string;
  category: string;
  price: number | null;
  date: string;
  is_transferred?: boolean;
}

type SortField = "guest_name" | "gift_name" | "category" | "price" | "date";
type SortOrder = "asc" | "desc";

export default function GiftsPage() {
  const [gifts, setGifts] = useState<Gift[]>([]);
  const [guestName, setGuestName] = useState("");
  const [giftName, setGiftName] = useState("");
  const [category, setCategory] = useState("כללי");
  const [price, setPrice] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [categories, setCategories] = useState<string[]>([
    "כללי",
    "כסף",
    "מוצרי חשמל",
    "כלי מטבח",
    "עיצוב הבית",
    "Gift card",
  ]);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState("הכל");
  const [editingId, setEditingId] = useState<number | null>(null);

  // מצבים להעברה לגיפטקארדים (Modal)
  const [selectedGiftForCard, setSelectedGiftForCard] = useState<Gift | null>(null);
  const [cardNumber, setCardNumber] = useState("");
  const [expirationDate, setExpirationDate] = useState("");
  const [acceptedPlaces, setAcceptedPlaces] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmittingCard, setIsSubmittingCard] = useState(false);

  // מצבי מיון
  const [sortField, setSortField] = useState<SortField>("date");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");

  useEffect(() => {
    fetchGifts();
  }, []);

  const fetchGifts = async () => {
    const { data, error } = await supabase
      .from("gifts")
      .select("*")
      .order("id", { ascending: false });

    if (error) {
      console.error("שגיאה בטעינת מתנות:", error.message);
    } else if (data) {
      setGifts(data);
      const dbCategories = Array.from(new Set(data.map((g) => g.category)));
      setCategories((prev) => Array.from(new Set([...prev, ...dbCategories])));
    }
  };

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategory.trim()) return;
    if (!categories.includes(newCategory.trim())) {
      setCategories([...categories, newCategory.trim()]);
      setCategory(newCategory.trim());
    }
    setNewCategory("");
  };

  const handleSubmitGift = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestName || !giftName) return;

    const today = new Date().toISOString().split("T")[0];
    const numericPrice = price ? parseFloat(price) : null;

    if (editingId !== null) {
      const { error } = await supabase
        .from("gifts")
        .update({
          guest_name: guestName,
          gift_name: giftName,
          category: category,
          price: numericPrice,
        })
        .eq("id", editingId);

      if (error) {
        console.error("שגיאה בעדכון מתנה:", error.message);
      } else {
        setGifts(
          gifts.map((g) =>
            g.id === editingId
              ? { ...g, guest_name: guestName, gift_name: giftName, category, price: numericPrice }
              : g
          )
        );
        setEditingId(null);
        setGuestName("");
        setGiftName("");
        setCategory("כללי");
        setPrice("");
      }
    } else {
      const { data, error } = await supabase
        .from("gifts")
        .insert([
          {
            guest_name: guestName,
            gift_name: giftName,
            category: category,
            price: numericPrice,
            date: today,
          },
        ])
        .select();

      if (error) {
        console.error("שגיאה בהוספת מתנה:", error.message);
      } else if (data) {
        setGifts([data[0], ...gifts]);
        setGuestName("");
        setGiftName("");
        setCategory("כללי");
        setPrice("");
      }
    }
  };

  const handleEditClick = (gift: Gift) => {
    setEditingId(gift.id);
    setGuestName(gift.guest_name);
    setGiftName(gift.gift_name);
    setCategory(gift.category);
    setPrice(gift.price !== null ? gift.price.toString() : "");
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setGuestName("");
    setGiftName("");
    setCategory("כללי");
    setPrice("");
  };

  const handleDeleteGift = async (id: number) => {
    if (!confirm("האם אתה בטוח שברצונך למחוק מתנה זו?")) return;

    const { error } = await supabase.from("gifts").delete().eq("id", id);

    if (error) {
      console.error("שגיאה במחיקת מתנה:", error.message);
    } else {
      setGifts(gifts.filter((g) => g.id !== id));
    }
  };

  // מעבר לטבלת גיפטקארדים
  const handleTransferToGiftCard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGiftForCard) return;

    setIsSubmittingCard(true);

    const amount = selectedGiftForCard.price || 0;

    // 1. הוספה לטבלת gift_cards ב-Supabase
    const { error: cardError } = await supabase.from("gift_cards").insert([
      {
        company_name: selectedGiftForCard.gift_name,
        initial_balance: amount,
        current_balance: amount,
        card_number: cardNumber || null,
        expiration_date: expirationDate || null,
        accepted_places: acceptedPlaces || null,
        notes: notes ? `${notes} (מאת: ${selectedGiftForCard.guest_name})` : `מאת: ${selectedGiftForCard.guest_name}`,
      },
    ]);

    if (cardError) {
      console.error("שגיאה בהעברת הגיפטקארד:", cardError.message);
      alert("אירעה שגיאה בעת שמירת הגיפטקארד: " + cardError.message);
      setIsSubmittingCard(false);
      return;
    }

    // 2. עדכון המתנה ככזו שהועברה
    const { error: giftError } = await supabase
      .from("gifts")
      .update({ is_transferred: true })
      .eq("id", selectedGiftForCard.id);

    if (giftError) {
      console.warn("תשומת לב: הגיפטקארד נוצר אך עדכון סטטוס המתנה נכשל.", giftError.message);
    }

    // עדכון אופטימי ב-State
    setGifts((prev) =>
      prev.map((g) =>
        g.id === selectedGiftForCard.id ? { ...g, is_transferred: true } : g
      )
    );

    setIsSubmittingCard(false);
    setSelectedGiftForCard(null);
    setCardNumber("");
    setExpirationDate("");
    setAcceptedPlaces("");
    setNotes("");
    alert("💳 הגיפטקארד הועבר בהצלחה לטבלת הגיפטקארדים!");
  };

  const exportToExcel = () => {
    const headers = ["שם האורח", "המתנה", "קטגוריה", "סכום/מחיר", "תאריך"];
    const rows = sortedGifts.map((g) => [
      `"${g.guest_name}"`,
      `"${g.gift_name}"`,
      `"${g.category}"`,
      g.price !== null ? g.price : '""',
      `"${g.date}"`,
    ]);

    const csvContent =
      "\uFEFF" + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "wedding_gifts.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const filteredGifts = gifts.filter((gift) => {
    const matchesSearch =
      gift.guest_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      gift.gift_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      selectedCategoryFilter === "הכל" || gift.category === selectedCategoryFilter;
    return matchesSearch && matchesCategory;
  });

  const sortedGifts = [...filteredGifts].sort((a, b) => {
    let aValue: any = a[sortField];
    let bValue: any = b[sortField];

    if (sortField === "price") {
      if (aValue === null) aValue = sortOrder === "asc" ? Infinity : -Infinity;
      if (bValue === null) bValue = sortOrder === "asc" ? Infinity : -Infinity;
    }

    if (typeof aValue === "string" && typeof bValue === "string") {
      const comparison = aValue.localeCompare(bValue, "he");
      return sortOrder === "asc" ? comparison : -comparison;
    }

    if (aValue < bValue) return sortOrder === "asc" ? -1 : 1;
    if (aValue > bValue) return sortOrder === "asc" ? 1 : -1;
    return 0;
  });

  return (
    <main className="min-h-screen bg-gray-50 p-6 font-sans dir-rtl" style={{ direction: "rtl" }}>
      <div className="max-w-5xl mx-auto">
        {/* כותרת עליונה */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
              <span>💍</span> מתנות חתונה של נעם ואביתר
            </h1>
            <p className="text-gray-500">מעקב אחר מתנות, אורחים, קטגוריות וסכומים לחתונה.</p>
          </div>
          <Link
            href="/"
            className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition"
          >
            ← חזרה לבית
          </Link>
        </div>

        {/* טופס הוספה / עריכה */}
        <form
          onSubmit={handleSubmitGift}
          className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 mb-6 grid grid-cols-1 md:grid-cols-5 gap-4 items-end"
        >
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">שם האורח / נותן</label>
            <input
              type="text"
              placeholder="למשל: סבתא שושנה"
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              className="w-full p-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm text-gray-900 bg-white"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">שם המתנה</label>
            <input
              type="text"
              placeholder="למשל: מעטפה / בלנדר"
              value={giftName}
              onChange={(e) => setGiftName(e.target.value)}
              className="w-full p-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm text-gray-900 bg-white"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">קטגוריה</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full p-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-white text-sm text-gray-900"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">סכום / מחיר (רשות)</label>
            <input
              type="number"
              placeholder="למשל: 500"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-full p-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm text-gray-900 bg-white"
            />
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              className={`flex-1 py-2.5 text-white font-medium rounded-xl transition shadow-md text-sm ${
                editingId !== null ? "bg-green-600 hover:bg-green-700" : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              {editingId !== null ? "שמור" : "+ הוסף"}
            </button>
            {editingId !== null && (
              <button
                type="button"
                onClick={handleCancelEdit}
                className="px-3 py-2.5 bg-gray-300 hover:bg-gray-400 text-gray-800 font-medium rounded-xl transition text-sm"
              >
                ביטול
              </button>
            )}
          </div>
        </form>

        {/* הוספת קטגוריה חדשה */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-200 mb-6 flex gap-3 items-center">
          <input
            type="text"
            placeholder="שם קטגוריה חדשה (למשל: נדלן / מעטפות)"
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            className="flex-1 p-2 border border-gray-300 rounded-xl outline-none text-sm text-gray-900 bg-white"
          />
          <button
            type="button"
            onClick={handleAddCategory}
            className="px-4 py-2 bg-gray-800 hover:bg-gray-900 text-white rounded-xl transition text-sm"
          >
            הוסף קטגוריה
          </button>
        </div>

        {/* סרגל חיפוש, סינון וייצוא */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-200 mb-6 flex flex-col md:flex-row gap-4 justify-between items-center">
          <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto flex-1">
            <input
              type="text"
              placeholder="🔍 חיפוש לפי אורח או מתנה..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="p-2.5 border border-gray-300 rounded-xl outline-none flex-1 text-sm text-gray-900 bg-white"
            />
            <select
              value={selectedCategoryFilter}
              onChange={(e) => setSelectedCategoryFilter(e.target.value)}
              className="p-2.5 border border-gray-300 rounded-xl outline-none bg-white text-sm text-gray-900"
            >
              <option value="הכל">כל הקטגוריות</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={exportToExcel}
            className="w-full md:w-auto px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl transition shadow-sm text-sm flex items-center justify-center gap-2"
          >
            📊 ייצוא לאקסל (CSV)
          </button>
        </div>

        {/* טבלת מתנות */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-gray-600 text-sm">
                <th
                  onClick={() => handleSort("guest_name")}
                  className="p-4 cursor-pointer hover:bg-gray-100 transition select-none"
                >
                  שם האורח {sortField === "guest_name" && (sortOrder === "asc" ? "▲" : "▼")}
                </th>
                <th
                  onClick={() => handleSort("gift_name")}
                  className="p-4 cursor-pointer hover:bg-gray-100 transition select-none"
                >
                  המתנה {sortField === "gift_name" && (sortOrder === "asc" ? "▲" : "▼")}
                </th>
                <th
                  onClick={() => handleSort("category")}
                  className="p-4 cursor-pointer hover:bg-gray-100 transition select-none"
                >
                  קטגוריה {sortField === "category" && (sortOrder === "asc" ? "▲" : "▼")}
                </th>
                <th
                  onClick={() => handleSort("price")}
                  className="p-4 cursor-pointer hover:bg-gray-100 transition select-none"
                >
                  סכום / מחיר {sortField === "price" && (sortOrder === "asc" ? "▲" : "▼")}
                </th>
                <th
                  onClick={() => handleSort("date")}
                  className="p-4 cursor-pointer hover:bg-gray-100 transition select-none"
                >
                  תאריך {sortField === "date" && (sortOrder === "asc" ? "▲" : "▼")}
                </th>
                <th className="p-4 text-center">פעולות</th>
              </tr>
            </thead>
            <tbody>
              {sortedGifts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-400">
                    {gifts.length === 0
                      ? "אין עדיין מתנות במערכת. הוסף את המתנה הראשונה למעלה!"
                      : "לא נמצאו מתנות התואמות את החיפוש."}
                  </td>
                </tr>
              ) : (
                sortedGifts.map((gift) => (
                  <tr key={gift.id} className="border-b border-gray-100 hover:bg-gray-50 transition">
                    <td className="p-4 font-medium text-gray-800">{gift.guest_name}</td>
                    <td className="p-4 text-gray-700">{gift.gift_name}</td>
                    <td className="p-4">
                      <span className="px-3 py-1 bg-blue-50 text-blue-700 text-xs rounded-full font-medium">
                        {gift.category}
                      </span>
                    </td>
                    <td className="p-4 font-semibold text-emerald-600">
                      {gift.price !== null ? `₪${gift.price}` : <span className="text-gray-300 font-normal">-</span>}
                    </td>
                    <td className="p-4 text-gray-500 text-sm">{gift.date}</td>
                    <td className="p-4 text-center flex justify-center items-center gap-2">
                      {gift.category === "Gift card" && (
                        <button
                          onClick={() => setSelectedGiftForCard(gift)}
                          disabled={gift.is_transferred}
                          className={`px-3 py-1 text-xs rounded-lg font-medium transition ${
                            gift.is_transferred
                              ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                              : "bg-purple-600 hover:bg-purple-700 text-white shadow-sm"
                          }`}
                        >
                          {gift.is_transferred ? "✓ הועבר" : "💳 העבר לגיפטקארדים"}
                        </button>
                      )}
                      <button
                        onClick={() => handleEditClick(gift)}
                        className="px-3 py-1 bg-amber-100 hover:bg-amber-200 text-amber-800 text-xs rounded-lg font-medium transition"
                      >
                        עריכה
                      </button>
                      <button
                        onClick={() => handleDeleteGift(gift.id)}
                        className="px-3 py-1 bg-red-100 hover:bg-red-200 text-red-800 text-xs rounded-lg font-medium transition"
                      >
                        מחיקה
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* חלון קופץ להעברת גיפטקארד */}
      {selectedGiftForCard && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl border border-gray-100 space-y-4 text-right" dir="rtl">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <span>💳</span> העברת גיפטקארד לניהול
              </h3>
              <button
                onClick={() => setSelectedGiftForCard(null)}
                className="text-gray-400 hover:text-gray-600 font-bold text-lg"
              >
                ✕
              </button>
            </div>

            <div className="bg-purple-50 p-3 rounded-xl text-xs text-purple-900 space-y-1">
              <p><strong>חברה/שם:</strong> {selectedGiftForCard.gift_name}</p>
              <p><strong>מאת:</strong> {selectedGiftForCard.guest_name}</p>
              <p><strong>סכום מתנה:</strong> ₪{selectedGiftForCard.price || 0}</p>
            </div>

            <form onSubmit={handleTransferToGiftCard} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  מספר כרטיס / קוד גיפטקארד (אופציונלי):
                </label>
                <input
                  type="text"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value)}
                  placeholder="למשל: 1234-5678-9000"
                  className="w-full p-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  תאריך תוקף (אופציונלי):
                </label>
                <input
                  type="date"
                  value={expirationDate}
                  onChange={(e) => setExpirationDate(e.target.value)}
                  className="w-full p-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  רשתות מכבדות (קישור או טקסט חופשי):
                </label>
                <input
                  type="text"
                  value={acceptedPlaces}
                  onChange={(e) => setAcceptedPlaces(e.target.value)}
                  placeholder="למשל: https://... או 'פוקס, שילב, גולף'"
                  className="w-full p-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  הערות נוספות:
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="למשל: תקף ברשתות ספציפיות..."
                  className="w-full p-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                />
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedGiftForCard(null)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-medium transition"
                >
                  ביטול
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingCard}
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-sm font-medium shadow-md transition disabled:opacity-50"
                >
                  {isSubmittingCard ? "מעביר..." : "שמור והעבר לגיפטקארדים"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}