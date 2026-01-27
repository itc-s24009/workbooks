'use client';

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { saveStudySession, getCardHistory } from "@/actions/study"; // 履歴取得アクションをインポート

type Card = { id: string; question: string; answer: string; workbookId: string };

export default function StudyClient({ workbookName, cards, workbookId }: { workbookName: string, cards: Card[], workbookId: string }) {
  const router = useRouter();

  // --- 基本ステート ---
  const [shuffledCards, setShuffledCards] = useState<Card[]>([]);
  const [mounted, setMounted] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnswerShown, setIsAnswerShown] = useState(false);
  const [results, setResults] = useState<{ cardId: string, question: string, answer: string, isCorrect: boolean }[]>([]);
  const [phase, setPhase] = useState<'STUDY' | 'RESULT'>('STUDY');
  const [finishTime, setFinishTime] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  // --- ▼ 新規追加: 詳細ポップアップ用のステート ▼ ---
  const [selectedCard, setSelectedCard] = useState<{ id: string, q: string, a: string } | null>(null);
  const [cardHistory, setCardHistory] = useState<{ id: string, isCorrect: boolean, date: string }[]>([]);
  const [cardAccuracy, setCardAccuracy] = useState(0);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  useEffect(() => {
    const shuffled = [...cards].sort(() => Math.random() - 0.5);
    setShuffledCards(shuffled);
    setMounted(true);
  }, [cards]);

  const currentCard = shuffledCards[currentIndex];

  if (!mounted) return <div className="h-screen bg-gray-900 flex justify-center items-center text-gray-500">Loading...</div>;

  // 判定ロジック
  const handleJudge = async (isCorrect: boolean) => {
    if (isProcessing || !currentCard) return;
    setIsProcessing(true);

    // 今回の結果を作成（問題文と答えも一緒に溜めておく）
    const newResult = {
      cardId: currentCard.id,
      question: currentCard.question, // 保持
      answer: currentCard.answer,     // 保持
      isCorrect: isCorrect
    };
    
    const updatedResults = [...results, newResult];
    setResults(updatedResults);

    if (currentIndex < shuffledCards.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setIsAnswerShown(false);
      setIsProcessing(false);
    } else {
      const correctCount = updatedResults.filter(r => r.isCorrect).length;
      const rate = (correctCount / shuffledCards.length) * 100;
      
      setFinishTime(new Date().toLocaleString());
      
      // 保存時に question と answer を渡す
      await saveStudySession({
        workbookId,
        accuracyRate: rate,
        results: updatedResults // これに QとA が含まれています
      });
      
      setPhase('RESULT');
    }
  };

  // --- ▼ 新規追加: 履歴データを読み込む関数 ▼ ---
  const handleOpenHistory = async (cardId: string, q: string, a: string) => {
    setSelectedCard({ id: cardId, q, a });
    setIsLoadingHistory(true);
    // 既存のアクションを使用して履歴を取得
    const data = await getCardHistory(cardId);
    if (data.success) {
      setCardHistory(data.history || []);
      setCardAccuracy(data.accuracy || 0);
    }
    setIsLoadingHistory(false);
  };

  // ===================== 学習画面 =====================
  if (phase === 'STUDY') {
    return (
      <div className="max-w-2xl mx-auto mt-10 p-6 h-screen flex flex-col">
        <div className="text-center mb-6 text-gray-500 font-bold tracking-widest text-xs uppercase">
          Question {currentIndex + 1} / {shuffledCards.length}
        </div>
        {currentCard && (
          <div className="bg-gray-800 border-2 border-gray-700 rounded-3xl p-8 shadow-2xl flex-grow flex flex-col justify-center items-center text-center max-h-[60vh] overflow-y-auto custom-scrollbar relative">
            <h2 className="text-2xl md:text-3xl font-black text-white mb-8 whitespace-pre-wrap break-words w-full">
              {currentCard.question}
            </h2>
            {isAnswerShown && (
              <div className="w-full pt-8 border-t border-gray-700 animate-in fade-in duration-300">
                <p className="text-[10px] text-blue-500 font-black mb-2 tracking-[0.2em] uppercase">Answer</p>
                <p className="text-xl md:text-2xl text-white font-bold whitespace-pre-wrap break-words">
                  {currentCard.answer}
                </p>
              </div>
            )}
          </div>
        )}
        <div className="mt-8 space-y-4 shrink-0 pb-10">
          {!isAnswerShown ? (
            <button onClick={() => setIsAnswerShown(true)} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-5 rounded-2xl text-xl shadow-lg transition active:scale-[0.98]">
              解答を表示
            </button>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <button onClick={() => handleJudge(false)} disabled={isProcessing} className="bg-red-600/90 hover:bg-red-500 text-white font-black py-6 rounded-2xl text-lg transition shadow-lg active:scale-[0.98] disabled:opacity-50">✕ 不正解</button>
              <button onClick={() => handleJudge(true)} disabled={isProcessing} className="bg-green-600/90 hover:bg-green-500 text-white font-black py-6 rounded-2xl text-lg transition shadow-lg active:scale-[0.98] disabled:opacity-50">〇 正解！</button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ===================== 結果画面 =====================
  const accuracy = Math.round((results.filter(r => r.isCorrect).length / shuffledCards.length) * 100);
  return (
    <div className="max-w-4xl mx-auto p-8 text-white min-h-screen">
      <div className="text-center mb-10">
        <h1 className="text-blue-500 text-xs font-black tracking-widest uppercase mb-2">Result</h1>
        <h2 className="text-3xl font-black mb-2">{workbookName}</h2>
        <p className="text-gray-500 font-mono text-xs">{finishTime}</p>
      </div>
      
      <div className="bg-gray-800 border border-gray-700 rounded-3xl p-8 mb-12 text-center shadow-xl">
        <div className="text-6xl font-black text-white mb-2">{accuracy}<span className="text-3xl text-blue-500">%</span></div>
        <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">Score: {results.filter(r=>r.isCorrect).length} / {shuffledCards.length}</p>
      </div>

      <div className="space-y-4 mb-40">
        {results.map((r, i) => (
          <div 
            key={i} 
            // ▼ ここをクリック可能に変更しました ▼
            onClick={() => handleOpenHistory(r.cardId, r.question, r.answer)}
            className="flex gap-4 bg-gray-850 border border-gray-800 p-4 rounded-xl items-start cursor-pointer hover:bg-gray-700/50 hover:border-gray-600 transition active:scale-[0.99]"
          >
            <div className={`mt-1 shrink-0 w-8 h-8 flex items-center justify-center rounded-full font-black text-sm ${r.isCorrect ? 'bg-green-900/20 text-green-500 border border-green-500/30' : 'bg-red-900/20 text-red-500 border border-red-500/30'}`}>
              {r.isCorrect ? "〇" : "✕"}
            </div>
            <div className="flex-grow min-w-0">
              {/* ホバー時にガイドを表示 */}
              <div className="flex justify-between items-center mb-1">
                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Q. {i+1}</span>
                <span className="text-[9px] text-blue-400 opacity-50 uppercase font-bold tracking-widest">Analytics &gt;</span>
              </div>
              <div className="text-sm font-bold text-gray-200 mb-2 whitespace-pre-wrap break-words">{r.question}</div>
              <div className="text-sm text-gray-400 font-mono whitespace-pre-wrap break-words pl-2 border-l-2 border-gray-700">{r.answer}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ================= 詳細履歴ポップアップ (修正版) ================= */}
      {selectedCard && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-[110] p-4">
          {/* 
             【修正】max-h-[80vh] と overflow-y-auto を大枠に適用することで、
             タイトル・統計・リスト「全体」がまとめてスクロールするようになりました 
          */}
          <div className="bg-gray-800 border border-gray-700 rounded-3xl w-full max-w-md p-8 shadow-2xl relative max-h-[85vh] overflow-y-auto custom-scrollbar flex flex-col">
            
            <button onClick={() => setSelectedCard(null)} className="absolute top-4 right-4 text-gray-500 hover:text-white bg-gray-900/50 w-8 h-8 rounded-full flex items-center justify-center transition z-10">✕</button>
            
            {/* 全体スクロール用のコンテンツラッパー */}
            <div className="space-y-6 pb-2">
              <div>
                <p className="text-[10px] font-bold text-gray-500 tracking-[0.2em] uppercase mb-1">Detailed Log</p>
                <h4 className="text-xl font-black text-white whitespace-pre-wrap break-words">{selectedCard.q}</h4>
                <div className="mt-2 bg-black/20 p-3 rounded-lg">
                  <p className="text-gray-400 text-xs italic font-mono mb-1 text-[10px] uppercase opacity-50">Answer</p>
                  <p className="text-gray-300 text-sm whitespace-pre-wrap break-words">{selectedCard.a}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                 <div className="bg-gray-900/50 rounded-2xl p-4 border border-gray-700 text-center">
                    <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">Average Score</p>
                    <div className="text-3xl font-black text-blue-500">{cardAccuracy}%</div>
                 </div>
                 <div className="bg-gray-900/50 rounded-2xl p-4 border border-gray-700 text-center">
                    <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">Total Trials</p>
                    <div className="text-3xl font-black text-white">{cardHistory.length}</div>
                 </div>
              </div>

              <div>
                <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mb-3 border-b border-gray-700 pb-2">Full History</p>
                <div className="space-y-2">
                  {isLoadingHistory ? (
                    <div className="py-10 text-center text-sm text-gray-500 animate-pulse">Loading analytics...</div>
                  ) : (
                    cardHistory.map((h) => (
                      <div key={h.id} className="flex justify-between items-center bg-gray-900/40 p-3 rounded-xl border border-gray-800/50">
                        <span className="text-gray-500 font-mono text-[11px]">{h.date}</span>
                        <span className={`font-black text-xs ${h.isCorrect ? 'text-green-500' : 'text-red-500'}`}>
                          {h.isCorrect ? "○ SUCCESS" : "× FAIL"}
                        </span>
                      </div>
                    ))
                  )}
                  {!isLoadingHistory && cardHistory.length === 0 && (
                    <p className="text-center text-gray-500 py-4 text-sm">学習データがまだありません。</p>
                  )}
                </div>
              </div>

              <button 
                onClick={() => setSelectedCard(null)} 
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-3 rounded-xl transition shadow-lg mt-4"
              >
                閉じる (Enter)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* フッター操作 */}
      <div className="fixed bottom-0 left-0 w-full p-6 bg-gray-900/90 backdrop-blur-xl border-t border-gray-800 flex gap-4 justify-center">
        <button onClick={() => router.push(`/workbook/${workbookId}`)} className="flex-1 max-w-[200px] bg-gray-800 border border-gray-700 text-white font-bold py-3 rounded-xl transition hover:bg-gray-700">終了</button>
        <button onClick={() => window.location.reload()} className="flex-1 max-w-[200px] bg-blue-600 text-white font-bold py-3 rounded-xl transition hover:bg-blue-500 shadow-lg">再挑戦</button>
      </div>
    </div>
  );
}