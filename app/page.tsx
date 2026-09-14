'use client';

import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="max-w-4xl mx-auto p-6 dir-rtl text-right min-h-screen flex flex-col justify-center items-center">
      <h1 className="text-4xl font-extrabold mb-2 text-gray-800">הבית החדש 🏠</h1>
      <p className="text-lg text-gray-600 mb-8">ניהול מתנות, ציוד חסר וגיפטקארדים</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-2xl">
        <Link
          href="/gifts"
          className="bg-white border border-gray-200 p-6 rounded-xl shadow-md hover:shadow-lg transition text-center group"
        >
          <div className="text-4xl mb-3">🎁</div>
          <h2 className="text-xl font-bold text-gray-800 group-hover:text-blue-600">מתנות שקיבלנו</h2>
          <p className="text-sm text-gray-500 mt-2">רשימת המתנות והברכות</p>
        </Link>

        <Link
          href="/shopping-list"
          className="bg-white border border-gray-200 p-6 rounded-xl shadow-md hover:shadow-lg transition text-center group"
        >
          <div className="text-4xl mb-3">🛒</div>
          <h2 className="text-xl font-bold text-gray-800 group-hover:text-green-600">ציוד חסר לבית</h2>
          <p className="text-sm text-gray-500 mt-2">רשימת קניות ודברים שחסרים</p>
        </Link>

        <Link
          href="/gift-cards"
          className="bg-white border border-gray-200 p-6 rounded-xl shadow-md hover:shadow-lg transition text-center group"
        >
          <div className="text-4xl mb-3">💳</div>
          <h2 className="text-xl font-bold text-gray-800 group-hover:text-purple-600">גיפטקארדים שוברים</h2>
          <p className="text-sm text-gray-500 mt-2">מעקב יתרות ותוקף שוברים</p>
        </Link>
      </div>
    </main>
  );
}