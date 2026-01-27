'use client';

import { useState, useRef, useEffect } from "react";
import { updateCard, deleteCard } from "@/actions/cards";
import { getCardHistory } from "@/actions/study"; // さきほど作成したアクションをインポート

// ----- 1問ごとの行コンポーネント -----
function CardRow({ card }: { card: any }) {
  // 基本メニュー用のステート
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [q, setQ] = useState(card.question);
  const [a, setA] = useState(card.answer);
  
  // ▼ 新機能：履歴ポップアップ用のステート ▼
  const [showHistory, setShowHistory] = useState(false);
  const [historyData, setHistoryData] = useState<{ id: string, isCorrect: boolean, date: string }[]>([]);
  const [accuracy, setAccuracy] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

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

  // 履歴を読み込む関数
  const handleOpenHistory = async () => {
    setShowHistory(true);
    setIsLoading(true);
    const data = await getCardHistory(card.id);
    if (data.success) {
      setHistoryData(data.history || []);
      setAccuracy(data.accuracy || 0);
    }
    setIsLoading(false);
  };

  return (
    <>
      <div className="flex items-center justify-between border border-gray-700 bg-gray-800 p-4 rounded-lg hover:bg-gray-750 transition-colors text-white mb-2">
        {/* 問題エリア（ここをクリックで履歴ポップアップ表示） */}
        <div 
          onClick={handleOpenHistory}
          className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-4 mr-4 cursor-pointer group"
        >
          <div className="overflow-hidden">
            <span className="text-[10px] text-gray-500 block uppercase font-bold mb-1 tracking-tighter group-hover:text-blue-500 transition-colors">Question (View Analytics)</span>
            <div className="break-all font-medium">{card.question}</div>
          </div>
          <div className="hidden md:block overflow-hidden">
            <span className="text-[10px] text-gray-500 block uppercase font-bold mb-1 tracking-tighter">Answer</span>
            <div className="break-all font-semibold text-gray-300">{card.answer}</div>
          </div>
        </div>

        {/* 三点リーダーメニュー */}
        <div className="relative" ref={menuRef}>
          <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2 rounded-full hover:bg-gray-600 transition-colors">
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01" />
            </svg>
          </button>
          {isMenuOpen && (
            <div className="absolute right-0 top-10 w-48 bg-gray-800 border border-gray-600 rounded-md shadow-2xl z-20 overflow-hidden" onMouseLeave={() => setIsMenuOpen(false)}>
              <button onClick={() => { setIsEditing(true); setIsMenuOpen(false); }} className="block w-full text-left px-4 py-3 text-sm text-gray-100 hover:bg-gray-700 border-b border-gray-700">編集</button>
              <button onClick={() => { setIsDeleting(true); setIsMenuOpen(false); }} className="block w-full text-left px-4 py-3 text-sm text-red-400 hover:bg-gray-700">削除</button>
            </div>
          )}
        </div>

        {/* --- 編集モーダル --- */}
        {isEditing && (
          <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-[100] p-4">
            <form onSubmit={handleUpdate} className="bg-gray-800 border border-gray-700 rounded-xl p-6 w-full max-w-sm shadow-2xl">
              <h3 className="font-bold text-xl mb-6 text-center text-white">カードを編集</h3>
              <div className="space-y-4">
                <input value={q} onChange={e => setQ(e.target.value)} placeholder="問題" className="bg-gray-700 border border-gray-600 text-white p-3 w-full rounded-lg outline-none" required autoFocus />
                <input value={a} onChange={e => setA(e.target.value)} placeholder="答え" className="bg-gray-700 border border-gray-600 text-white p-3 w-full rounded-lg outline-none" required />
              </div>
              <div className="flex justify-center gap-4 mt-8">
                <button type="button" onClick={() => setIsEditing(false)} className="bg-gray-700 px-6 py-2 rounded-lg text-gray-300">キャンセル</button>
                <button type="submit" className="bg-blue-600 px-6 py-2 rounded-lg font-bold text-white shadow-lg">保存</button>
              </div>
            </form>
          </div>
        )}

        {/* --- 削除モーダル --- */}
        {isDeleting && (
           <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-[100] p-4 text-center">
            <div className="bg-gray-800 border border-gray-700 rounded-xl p-8 w-full max-w-sm">
              <h3 className="font-bold text-xl text-white">削除しますか？</h3>
              <div className="flex justify-center gap-4 mt-8">
                <button onClick={() => setIsDeleting(false)} className="bg-gray-700 px-6 py-2 rounded-lg text-gray-300">キャンセル</button>
                <button onClick={async () => { await deleteCard(card.id, card.workbookId); setIsDeleting(false); }} className="bg-red-600 px-6 py-2 rounded-lg font-bold text-white">削除する</button>
              </div>
            </div>
          </div>
        )}

        {/* ▼ ▼ 新規：過去データ詳細ポップアップ ▼ ▼ */}
        {showHistory && (
          <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-[110] p-4">
            <div className="bg-gray-800 border border-gray-700 rounded-3xl w-full max-w-md p-8 shadow-2xl overflow-hidden relative max-h-[80vh] flex flex-col">
              <button onClick={() => setShowHistory(false)} className="absolute top-4 right-4 text-gray-500 hover:text-white">✕</button>
              
              <div className="mb-6">
                <p className="text-[10px] font-bold text-gray-500 tracking-[0.2em] uppercase mb-1">Detailed Log</p>
                <h4 className="text-xl font-black text-white">{card.question}</h4>
                <p className="text-gray-400 text-sm italic mt-1 font-mono">Answer: {card.answer}</p>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                 <div className="bg-gray-900/50 rounded-2xl p-4 border border-gray-700 text-center">
                    <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">Average Score</p>
                    <div className="text-3xl font-black text-blue-500">{accuracy}%</div>
                 </div>
                 <div className="bg-gray-900/50 rounded-2xl p-4 border border-gray-700 text-center">
                    <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">Sessions</p>
                    <div className="text-3xl font-black text-white">{historyData.length}</div>
                 </div>
              </div>

              <div className="flex-grow overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest py-2 sticky top-0 bg-gray-800 z-10">Historical Data</p>
                {isLoading ? (
                  <div className="py-20 text-center text-sm text-gray-500 animate-pulse">Loading analytics...</div>
                ) : (
                  historyData.map((h) => (
                    <div key={h.id} className="flex justify-between items-center bg-gray-900/40 p-3 rounded-xl border border-gray-800/50">
                      <span className="text-gray-500 font-mono text-[11px]">{h.date}</span>
                      <span className={`font-black text-xs ${h.isCorrect ? 'text-green-500' : 'text-red-500'}`}>
                        {h.isCorrect ? "○ SUCCESS" : "× FAIL"}
                      </span>
                    </div>
                  ))
                )}
                {!isLoading && historyData.length === 0 && (
                  <p className="text-center text-gray-500 py-10 text-sm">学習データがありません。</p>
                )}
              </div>

              <button 
                onClick={() => setShowHistory(false)} 
                className="mt-6 w-full bg-blue-600/10 hover:bg-blue-600 border border-blue-600/30 text-blue-500 hover:text-white py-4 rounded-xl font-black transition-all"
              >
                Close (Enter)
              </button>
            </div>
          </div>
        )}
        {/* ▲ ▲ ここまで ▲ ▲ */}

      </div>
    </>
  );
}

export function CardList({ cards }: { cards: any[] }) {
  return (
    <div className="space-y-2 pb-32">
      {cards.map(card => (
        <CardRow key={card.id} card={card} />
      ))}
      {cards.length === 0 && (
        <p className="text-gray-500 text-center py-20 border border-dashed border-gray-800 rounded-2xl">
          問題がありません。上のフォームからカードを作成してください。
        </p>
      )}
    </div>
  );
}