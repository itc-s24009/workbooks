'use client';

import { useState, useRef, useEffect } from "react";
import { deleteCard } from "@/actions/cards"; // updateCard は不要になったので削除
import { getCardHistory } from "@/actions/study";

function CardRow({ card }: { card: any }) {
  // 編集用のステート（isEditing, q, a）を削除しました
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // 履歴ポップアップ用
  const [showHistory, setShowHistory] = useState(false);
  const [historyData, setHistoryData] = useState<{ id: string, isCorrect: boolean, date: string }[]>([]);
  const [accuracy, setAccuracy] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const clickOut = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) setIsMenuOpen(false);
    };
    document.addEventListener("mousedown", clickOut);
    return () => document.removeEventListener("mousedown", clickOut);
  }, [menuRef]);

  // handleUpdate 関数も削除しました

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
        {/* 問題エリア（クリックで詳細分析） */}
        <div 
          onClick={handleOpenHistory}
          className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-4 mr-4 cursor-pointer group min-w-0"
        >
          <div className="min-w-0">
            <span className="text-[10px] text-gray-500 block uppercase font-black mb-1 tracking-widest group-hover:text-blue-500 transition-colors">Question & Analytics</span>
            <div className="break-words font-medium text-sm md:text-base whitespace-pre-wrap">{card.question}</div>
          </div>
          <div className="hidden md:block min-w-0 border-l border-gray-700 pl-4">
            <span className="text-[10px] text-gray-500 block uppercase font-black mb-1 tracking-widest">Answer</span>
            <div className="break-words font-semibold text-gray-400 text-sm md:text-base whitespace-pre-wrap line-clamp-3">{card.answer}</div>
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
            <div className="absolute right-0 top-10 w-40 bg-gray-800 border border-gray-600 rounded-xl shadow-2xl z-30 overflow-hidden" onMouseLeave={() => setIsMenuOpen(false)}>
              {/* 編集ボタンを削除し、削除ボタンのみにしました */}
              <button 
                onClick={() => { setIsDeleting(true); setIsMenuOpen(false); }} 
                className="block w-full text-left px-4 py-3 text-sm text-red-400 hover:bg-gray-700 transition"
              >
                削除
              </button>
            </div>
          )}
        </div>

        {/* 編集モーダルがあった場所 (削除済み) */}

        {/* 削除モーダル */}
        {isDeleting && (
           <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-[200] p-4 text-center">
            <div className="bg-gray-800 border border-gray-700 rounded-xl p-8 w-full max-w-sm shadow-2xl">
              <h3 className="font-bold text-xl mb-6 text-white">削除しますか？</h3>
              <p className="text-gray-400 mb-6 text-sm">この操作は元に戻せません。</p>
              <button onClick={async () => { await deleteCard(card.id, card.workbookId); setIsDeleting(false); }} className="bg-red-600 px-10 py-3 rounded-xl font-bold w-full text-white hover:bg-red-500 transition shadow-lg">削除する</button>
              <button onClick={() => setIsDeleting(false)} className="text-gray-500 mt-4 block w-full hover:underline font-bold text-xs uppercase tracking-widest">キャンセル</button>
            </div>
          </div>
        )}

        {/* 詳細履歴ポップアップ (変更なし) */}
        {showHistory && (
          <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-[210] p-4">
            <div className="bg-gray-800 border border-gray-700 rounded-3xl w-full max-w-md p-8 shadow-2xl relative max-h-[85vh] overflow-y-auto custom-scrollbar flex flex-col">
              
              <button onClick={() => setShowHistory(false)} className="absolute top-4 right-4 text-gray-500 hover:text-white bg-gray-900/50 w-8 h-8 rounded-full flex items-center justify-center transition z-20">✕</button>
              
              <div className="space-y-6 pb-2">
                <div className="relative pt-2">
                  <p className="text-[10px] font-bold text-gray-500 tracking-[0.2em] uppercase mb-1">Card Statistics</p>
                  <h4 className="text-xl font-black text-white whitespace-pre-wrap break-words">{card.question}</h4>
                  <div className="mt-3 bg-black/20 p-4 rounded-xl border border-gray-700/50">
                    <p className="text-gray-400 text-xs font-mono mb-2 text-[10px] uppercase opacity-50">Saved Answer</p>
                    <p className="text-gray-300 text-sm whitespace-pre-wrap break-words leading-relaxed">{card.answer}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                   <div className="bg-gray-900/50 rounded-2xl p-4 border border-gray-700 text-center">
                      <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest mb-1">Avg Score</p>
                      <div className="text-3xl font-black text-blue-500">{accuracy}%</div>
                   </div>
                   <div className="bg-gray-900/50 rounded-2xl p-4 border border-gray-700 text-center">
                      <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest mb-1">Attempts</p>
                      <div className="text-3xl font-black text-white">{historyData.length}</div>
                   </div>
                </div>

                <div>
                  <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mb-3 border-b border-gray-700 pb-2">Historical Records</p>
                  <div className="space-y-2">
                    {isLoading ? (
                      <div className="py-20 text-center text-sm text-gray-500 animate-pulse">Retrieving log...</div>
                    ) : (
                      historyData.map((h) => (
                        <div key={h.id} className="flex justify-between items-center bg-gray-900/40 p-4 rounded-xl border border-gray-800/50">
                          <span className="text-gray-500 font-mono text-[11px]">{h.date}</span>
                          <span className={`font-black text-xs px-2 py-1 rounded bg-black/30 ${h.isCorrect ? 'text-green-500' : 'text-red-500'}`}>
                            {h.isCorrect ? "● SUCCESS" : "× FAIL"}
                          </span>
                        </div>
                      ))
                    )}
                    {!isLoading && historyData.length === 0 && <p className="text-center text-gray-500 py-10">データ未登録</p>}
                  </div>
                </div>

                <button 
                  onClick={() => setShowHistory(false)} 
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-4 rounded-2xl transition shadow-lg shadow-blue-900/30"
                >
                  Close Analytics
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export function CardList({ cards }: { cards: any[] }) {
  return (
    <div className="space-y-3 pb-40">
      {cards.map(card => <CardRow key={card.id} card={card} />)}
      {cards.length === 0 && <p className="text-center py-20 text-gray-600 italic">No problems found</p>}
    </div>
  );
}