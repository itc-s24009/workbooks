'use client';

import { useState, useRef, useEffect } from "react";
import { updateCard, deleteCard } from "@/actions/cards";

function CardRow({ card }: { card: any }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [q, setQ] = useState(card.question);
  const [a, setA] = useState(card.answer);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) setIsMenuOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuRef]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await updateCard(card.id, card.workbookId, { question: q, answer: a });
    if (result.success) setIsEditing(false);
    else alert(result.message);
  };

  return (
    <div className="flex items-center justify-between border border-gray-700 bg-gray-800 p-4 rounded-lg hover:bg-gray-750 text-white">
      <div className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-4 mr-4">
        <div className="overflow-hidden">
          <span className="text-[10px] text-gray-500 block uppercase font-bold mb-1 tracking-tighter">Question</span>
          <div className="break-all">{card.question}</div>
        </div>
        <div className="overflow-hidden">
          <span className="text-[10px] text-gray-500 block uppercase font-bold mb-1 tracking-tighter">Answer</span>
          <div className="break-all font-semibold text-blue-300">{card.answer}</div>
        </div>
      </div>

      <div className="relative" ref={menuRef}>
        <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2 rounded-full hover:bg-gray-600 transition-colors">
          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01" />
          </svg>
        </button>
        {isMenuOpen && (
          <div className="absolute right-0 top-10 w-48 bg-gray-800 border border-gray-600 rounded-md shadow-2xl z-20 overflow-hidden" onMouseLeave={() => setIsMenuOpen(false)}>
            <button onClick={() => { setIsEditing(true); setIsMenuOpen(false); }} className="block w-full text-left px-4 py-3 text-sm text-gray-100 hover:bg-gray-700 border-b border-gray-700">問題を編集</button>
            <button onClick={() => { setIsDeleting(true); setIsMenuOpen(false); }} className="block w-full text-left px-4 py-3 text-sm text-red-400 hover:bg-gray-700">削除</button>
          </div>
        )}
      </div>

      {isEditing && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4">
          <form onSubmit={handleUpdate} className="bg-gray-800 border border-gray-700 rounded-xl p-6 w-full max-w-sm shadow-2xl">
            <h3 className="font-bold text-xl mb-6 text-center text-white">問題を編集</h3>
            <div className="space-y-4 text-black">
              <input value={q} onChange={e => setQ(e.target.value)} placeholder="問題" className="bg-gray-700 border border-gray-600 text-white p-3 w-full rounded-lg outline-none focus:ring-2 focus:ring-blue-500" required autoFocus />
              <input value={a} onChange={e => setA(e.target.value)} placeholder="答え" className="bg-gray-700 border border-gray-600 text-white p-3 w-full rounded-lg outline-none focus:ring-2 focus:ring-blue-500" required />
            </div>
            <div className="flex justify-center gap-4 mt-8">
              <button type="button" onClick={() => setIsEditing(false)} className="bg-gray-700 px-6 py-2 rounded-lg text-gray-300">中止</button>
              <button type="submit" className="bg-blue-600 px-6 py-2 rounded-lg font-bold text-white shadow-lg hover:bg-blue-500">保存 (Enter)</button>
            </div>
          </form>
        </div>
      )}

      {isDeleting && (
         <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4 text-center">
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-8 w-full max-w-sm">
            <h3 className="font-bold text-xl text-white">このカードを削除しますか？</h3>
            <p className="text-gray-400 my-4 text-sm leading-relaxed italic">この操作は元に戻せません</p>
            <div className="flex justify-center gap-4 mt-8">
              <button onClick={() => setIsDeleting(false)} className="bg-gray-700 px-6 py-2 rounded-lg text-gray-300 font-bold">やめる</button>
              <button onClick={async () => { await deleteCard(card.id, card.workbookId); setIsDeleting(false); }} className="bg-red-600 px-6 py-2 rounded-lg font-bold text-white shadow-lg hover:bg-red-500">削除する</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ▼ ここが export されていることを確認
export function CardList({ cards }: { cards: any[] }) {
  return (
    <div className="space-y-2 pb-20">
      {cards.map(card => (
        <CardRow key={card.id} card={card} />
      ))}
      {cards.length === 0 && (
        <p className="text-gray-500 text-center py-10 italic">問題がありません。上のフォームから追加してください。</p>
      )}
    </div>
  );
}