'use client';

import { useState } from "react";
import Link from "next/link";
import { signOutAction } from "@/components/auth/action";
import { updateItem } from "@/actions/creations";

type WorkbookHeaderProps = {
  id: string;
  name: string;
  description?: string | null;
  parentId?: string | null;
  breadcrumbs: { id: string; name: string }[];
  userName: string;
};

export function WorkbookHeader({ id, name, description, breadcrumbs, userName }: WorkbookHeaderProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [newName, setNewName] = useState(name);
  const [newDesc, setNewDesc] = useState(description || "");

  // 更新処理
  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await updateItem(id, 'workbook', { name: newName, description: newDesc });
    if (result.success) {
      setIsEditing(false);
    } else {
      alert(result.message);
    }
  };

  return (
    <>
      <header className="flex justify-between items-start mb-6 border-b border-gray-800 pb-4">
        <div className="flex-grow">
          {/* パンくずリスト */}
          <nav className="text-[10px] text-gray-500 mb-2 flex items-center gap-1 font-bold uppercase tracking-widest flex-wrap">
            <Link href="/home" className="hover:text-white transition">Home</Link>
            {breadcrumbs.map(c => (
              <span key={c.id}> / <Link href={`/directory/${c.id}`} className="hover:text-white transition">{c.name}</Link></span>
            ))}
            <span className="text-blue-500"> / {name}</span>
          </nav>

          {/* タイトル＆編集ボタン */}
          <div className="flex items-center gap-3 group">
            <h1 className="text-4xl font-black italic tracking-tighter text-white">{name}</h1>
            <button 
              onClick={() => setIsEditing(true)}
              className="opacity-0 group-hover:opacity-100 transition-opacity p-2 text-gray-500 hover:text-white"
              title="編集する"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
            </button>
          </div>
          <p className="text-gray-400 text-sm mt-2 whitespace-pre-wrap">{description || <span className="text-gray-600 italic">No description</span>}</p>
        </div>

        <div className="flex flex-col items-end gap-2 min-w-fit pl-4">
          <span className="text-[10px] font-bold text-gray-500 uppercase">{userName}</span>
          <form action={signOutAction}>
            <button type="submit" className="text-gray-500 text-[10px] font-bold border border-gray-800 px-3 py-1 rounded hover:text-white transition uppercase tracking-tighter">Sign Out</button>
          </form>
        </div>
      </header>

      {/* 編集モーダル */}
      {isEditing && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[200] p-4">
          <form onSubmit={handleUpdate} className="bg-gray-800 border border-gray-700 p-8 rounded-3xl w-full max-w-md shadow-2xl">
            <h3 className="text-white font-black text-xl mb-6 text-center border-b border-gray-700 pb-2">ワークブック情報を編集</h3>
            <div className="space-y-6">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest block mb-2">名前</label>
                <input 
                  value={newName} 
                  onChange={(e) => setNewName(e.target.value)} 
                  autoFocus
                  className="w-full bg-gray-900 border border-gray-700 rounded-xl p-3 text-white outline-none focus:ring-2 focus:ring-blue-500 transition"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest block mb-2">説明</label>
                <textarea 
                  value={newDesc} 
                  onChange={(e) => setNewDesc(e.target.value)} 
                  rows={4}
                  className="w-full bg-gray-900 border border-gray-700 rounded-xl p-3 text-white outline-none focus:ring-2 focus:ring-blue-500 transition resize-none"
                />
              </div>
            </div>
            <div className="flex gap-4 mt-8">
              <button type="button" onClick={() => setIsEditing(false)} className="flex-1 bg-gray-700 text-gray-300 font-bold py-3 rounded-xl hover:bg-gray-600 transition">中止</button>
              <button type="submit" className="flex-1 bg-blue-600 text-white font-black py-3 rounded-xl hover:bg-blue-500 transition">更新 (Enter)</button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}