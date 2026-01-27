'use client';

import { useState } from "react";
import { getCardHistory } from "@/actions/study";

export function SessionHistoryList({ records }: { records: any[] }) {
  const [selectedCard, setSelectedCard] = useState<any>(null);
  const [cardHistory, setCardHistory] = useState<any[]>([]);
  const [cardAccuracy, setCardAccuracy] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const openHistory = async (rec: any) => {
    setSelectedCard(rec.card);
    setIsLoading(true);
    const data = await getCardHistory(rec.card.id);
    if (data.success) {
      setCardHistory(data.history || []);
      setCardAccuracy(data.accuracy || 0);
    }
    setIsLoading(false);
  };

    return (
    <div className="space-y-4 mb-40">
      <h3 className="font-bold text-gray-500 uppercase tracking-widest text-[10px] ml-4 mb-2">Answer log (problem remains even after deletion)</h3>
      {records.map((r, i) => (
        <div 
          key={i} 
          // もし元のカードが消えていたらクリック（分析）できないように制御
          onClick={() => r.cardId ? openHistory(r) : alert("この問題は既に削除されているため、個別分析はできません。")}
          className={`flex items-start gap-5 bg-gray-850 border border-gray-800 p-5 rounded-2xl transition duration-300 ${r.cardId ? 'hover:border-blue-500/50 hover:bg-gray-800 cursor-pointer active:scale-[0.99]' : 'opacity-80 cursor-default'} group`}
        >
          {/* 丸・バツ表示 */}
          <div className={`mt-1 shrink-0 w-12 h-12 flex items-center justify-center rounded-full font-black text-2xl shadow-inner ${r.isCorrect ? 'bg-green-900/10 text-green-500 border border-green-500/20' : 'bg-red-900/10 text-red-500 border border-red-500/20'}`}>
            {r.isCorrect ? "○" : "×"}
          </div>

          <div className="min-w-0 flex-grow">
            <div className="flex justify-between items-center mb-1">
              <p className="text-[9px] text-gray-600 font-bold uppercase tracking-wider">Question {i+1} {!r.cardId && "(DELETED)"}</p>
              {r.cardId && <span className="text-[9px] text-blue-500 opacity-0 group-hover:opacity-100 font-black">ANALYSIS →</span>}
            </div>
            {/* ★ここがポイント： r.card.question ではなく、直の r.question を使う */}
            <div className="text-lg font-bold text-gray-200 whitespace-pre-wrap break-words">{r.question}</div>
            <div className="text-sm text-gray-400 italic mt-1 font-medium pl-3 border-l-2 border-gray-800 whitespace-pre-wrap break-words">{r.answer}</div>
          </div>
        </div>
      ))}


      {/* ポップアップ詳細UI (上記と完全共通) */}
      {selectedCard && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-[110] p-4 text-white">
          <div className="bg-gray-800 border border-gray-700 rounded-3xl w-full max-w-md p-8 shadow-2xl relative max-h-[85vh] overflow-y-auto custom-scrollbar flex flex-col">
            <button onClick={() => setSelectedCard(null)} className="absolute top-4 right-4 text-gray-500 hover:text-white z-20 bg-gray-900/50 rounded-full w-8 h-8 flex items-center justify-center">✕</button>
            <div className="space-y-6">
              <div>
                <p className="text-[10px] font-bold text-gray-500 tracking-[0.2em] uppercase mb-1">Session Data Inquiry</p>
                <h4 className="text-xl font-black text-white whitespace-pre-wrap break-words">{selectedCard.question}</h4>
                <div className="mt-3 bg-black/30 p-4 rounded-xl text-gray-300 text-sm whitespace-pre-wrap break-words leading-relaxed border border-gray-700/50">
                  <span className="text-[9px] font-bold block opacity-40 uppercase mb-1 font-sans">Answer context</span>
                  {selectedCard.answer}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <div className="bg-gray-900/50 rounded-2xl p-4 border border-gray-700 text-center"><p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">Avg Rate</p><div className="text-3xl font-black text-blue-500">{cardAccuracy}%</div></div>
                 <div className="bg-gray-900/50 rounded-2xl p-4 border border-gray-700 text-center"><p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">Logged Count</p><div className="text-3xl font-black text-white">{cardHistory.length}</div></div>
              </div>
              <div>
                <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mb-3 border-b border-gray-700 pb-2">Historical Records</p>
                <div className="space-y-2">
                  {isLoading ? (
                    <div className="py-20 text-center text-sm text-gray-500 animate-pulse font-mono tracking-widest">READING DATA...</div>
                  ) : (
                    cardHistory.map((h: any) => (
                      <div key={h.id} className="flex justify-between items-center bg-gray-900/50 p-4 rounded-2xl border border-gray-800/30 transition">
                        <span className="text-gray-400 font-mono text-[10px] uppercase">{h.date}</span>
                        <span className={`font-black text-[11px] ${h.isCorrect ? 'text-green-500' : 'text-red-500'}`}>{h.isCorrect ? "SUCCESS ●" : "FAILURE ×"}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
              <button onClick={() => setSelectedCard(null)} className="w-full bg-blue-600 font-black py-4 rounded-2xl">Return To Review</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}