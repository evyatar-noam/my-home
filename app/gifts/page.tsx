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

  // מעבר לטבלת גיפטבתמונה רואים שה-`git push` ל-GitHub עבר בהצלחה[cite: 1] (`893f0bd..e647a60 main -> main`), אבל ב-VS Code מופיעות **199 שגיאות** בטאב ה-PROBLEMS (משמאל למטה)[cite: 1], וקוד ה-JSX בקובץ `app/gifts/page.tsx` מקוטע / לא סגור כראוי[cite: 1].

בסוג כזה של פרויקט Next.js / TypeScript, כשיש הרבה שגיאות קומפילציה, **Vercel** או ה-CI ייכשלו ב-Build או שלא תראה את השינויים באתר.

---

### מה לעשות כדי לפתור את זה:

1. **תיקון ה-JSX בקובץ `app/gifts/page.tsx`:**
   בשורה 296 רואים שהתחלת לכתוב `<div className="p-2 border rounded-md w-full text-center">` (או אלמנט דומה) אבל הוא נחתך ולא נסגר לפני שסגרת את ה-`filter` והפונקציה[cite: 1].
   * ודא שחזרת מסינון ה-`filter` אלמנט תקין ושהסוגריים מותאמים.
   * דוגמה למבנה תקין:
     ```tsx
     const filteredGifts = gifts.filter((gift) => (
       <div key={gift.id} className="p-2 border rounded-md w-full text-center">
         {gift.name}
       </div>
     ));
     ```

2. **בדיקת השגיאות בטאב PROBLEMS:**
   לחץ על הטאב **PROBLEMS (199)** בחלק התחתון של המסך[cite: 1] כדי לראות מה השגיאה העיקרית (בדרך כלל שגיאת סינטקסיס אחת בחרה קוראת לשרשרת שגיאות TypeScript בערך כולו).

3. **הרצת Build מקומי לבדיקה:**
   בטרמינל, הרץ את הפקודה:
   ```bash
   npm run build