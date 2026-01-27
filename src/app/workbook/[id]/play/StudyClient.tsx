'use client';

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { saveStudySession, getCardHistory } from "@/actions/study";

type Card = { id: string; question: string; answer: string; workbookId: string };

export default function StudyClient({ workbookName, cards, workbookId }: { workbookName: string, cards: Card[], workbookId: string }) {
  const router = useRouter();

  const [shuffledCards, setShuffledCards] = useState<Card[]>([]);
  const [mounted, setMounted] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnswerShown, setIsAnswerShown] = useState(false);
  const [results, setResults] = useState<{ cardId: string, question: string, answer: string, isCorrect: boolean }[]>([]);
  const [phase, setPhase] = useState<'STUDY' | 'RESULT'>('STUDY');
  const [finishTime, setFinishTime] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  // ▼ 新規追加：詳細履歴用ポップアップの状態 ▼
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

  if (!mounted) return <div className="h-screen bg-gray-900 flex items-center justify-center italic text-gray-500">Loading...</div>;

  const handleJudge = async (isCorrect: boolean) => {
    if (isProcessing || !currentCard) return;
    setIsProcessing(true);

    const newResult = {
      cardId: currentCard.id, question: currentCard.question, answer: currentCard.answer, isCorrect
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
      const now = new Date();
      setFinishTime(now.toLocaleString());
      await saveStudySession({ workbookId, accuracyRate: rate, results: updatedResults.map(r => ({ cardId: r.cardId, isCorrect: r.isCorrect })) });
      setPhase('RESULT');
    }
  };

  // ▼ 詳細履歴を開く処理 ▼
  const openCardHistory = async (cardId: string, q: string, a: string) => {
    setSelectedCard({ id: cardId, q, a });
    setIsLoadingHistory(true);
    const data = await getCardHistory(cardId);
    if (data.success) {
      setCardHistory(data.history || []);
      setCardAccuracy(data.accuracy || 0);
    }
    setIsLoadingHistory(false);
  };

  if (phase === 'STUDY') {
    return (
      <div className="max-w-2xl mx-auto mt-20 p-6 animate-in fade-in duration-700">
        <div className="text-center mb-10 text-gray-500 font-bold tracking-widest text-[10px] uppercase">
          {currentIndex + 1} / {shuffledCards.length}
        </div>
        {currentCard && (
          <div className="bg-gray-800 border border-gray-700 rounded-3xl p-12 shadow-2xl min-h-[300px] flex flex-col justify-center items-center text-center">
            <h2 className="text-3xl font-black text-white mb-8">{currentCard.question}</h2>
            {isAnswerShown && (
              <div className="w-full pt-8 border-t border-gray-700 animate-in fade-in duration-500">
                <p className="text-[10px] text-blue-500 font-black mb-2 uppercase tracking-widest">Answer</p>
                <p className="text-2xl text-white font-bold">{currentCard.answer}</p>
              </div>
            )}
          </div>
        )}
        <div className="mt-12 space-y-4">
          {!isAnswerShown ? (
            <button onClick={() => setIsAnswerShown(true)} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-5 rounded-2xl text-xl shadow-lg transition active:scale-[0.98]">解答を表示</button>
          ) : (
            <div className="grid grid-cols-2 gap-6">
              <button onClick={() => handleJudge(false)} disabled={isProcessing} className="bg-red-600/90 py-6 rounded-2xl text-xl text-white font-black">✕ 不正解</button>
              <button onClick={() => handleJudge(true)} disabled={isProcessing} className="bg-green-600/90 py-6 rounded-2xl text-xl text-white font-black">〇 正解！</button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // --- RESULT フェーズ ---
  const accuracy = Math.round((results.filter(r => r.isCorrect).length / shuffledCards.length) * 100);

  return (
    <div className="max-w-4xl mx-auto p-8 text-white min-h-screen">
      <div className="text-center mb-10">
        <h1 className="text-blue-500 text-[10px] font-black tracking-widest uppercase mb-2">Workbook Result</h1>
        <h2 className="text-4xl font-black">{workbookName}</h2>
        <p className="text-gray-500 font-mono text-sm mt-2">{finishTime}</p>
      </div>

      <div className="bg-gray-800 border border-gray-700 rounded-3xl p-10 mb-10 text-center shadow-xl">
        <div className="text-7xl font-black text-blue-500 mb-2">{accuracy}%</div>
        <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">Total Accuracy</p>
      </div>

      <div className="space-y-4 mb-40">
        <h3 className="font-bold text-gray-500 uppercase tracking-widest text-[10px] ml-2">Click each for history</h3>
        {results.map((r, i) => (
          <div 
            key={i} 
            onClick={() => openCardHistory(r.cardId, r.question, r.answer)}
            className="flex items-center gap-4 bg-gray-800/40 border border-gray-800 p-5 rounded-2xl hover:bg-gray-700/50 cursor-pointer transition active:scale-[0.98]"
          >
            <div className={`w-10 h-10 flex items-center justify-center rounded-full font-black text-xl ${r.isCorrect ? 'text-green-500' : 'text-red-500'}`}>
              {r.isCorrect ? "〇" : "✕"}
            </div>
            <div>
              <div className="text-[10px] text-gray-500 font-bold uppercase mb-0.5">Q. {r.question}</div>
              <div className="text-lg font-bold">A. {r.answer}</div>
            </div>
          </div>
        ))}
      </div>

      {/* 履歴ポップアップモーダル */}
      {selectedCard && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-gray-800 border border-gray-700 rounded-3xl w-full max-w-md p-8 shadow-2xl overflow-hidden relative max-h-[80vh] flex flex-col">
            <button onClick={() => setSelectedCard(null)} className="absolute top-4 right-4 text-gray-500 hover:text-white">✕</button>
            
            <div className="mb-6">
              <p className="text-xs font-bold text-gray-500 tracking-widest uppercase mb-1">Detailed Analytics</p>
              <h4 className="text-xl font-black mb-1">{selectedCard.q}</h4>
              <p className="text-gray-400 text-sm">Ans: {selectedCard.a}</p>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-8">
               <div className="bg-gray-900/50 rounded-2xl p-4 border border-gray-700">
                  <p className="text-[10px] text-gray-500 font-bold uppercase">Average Score</p>
                  <div className="text-3xl font-black text-blue-500">{cardAccuracy}%</div>
               </div>
               <div className="bg-gray-900/50 rounded-2xl p-4 border border-gray-700">
                  <p className="text-[10px] text-gray-500 font-bold uppercase">Attempts</p>
                  <div className="text-3xl font-black text-white">{cardHistory.length}</div>
               </div>
            </div>

            <div className="flex-grow overflow-y-auto space-y-2 pr-2">
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest sticky top-0 bg-gray-800 py-2">Full Logs</p>
              {isLoadingHistory ? <p className="text-center py-4 animate-pulse">Loading data...</p> : 
               cardHistory.map((h) => (
                <div key={h.id} className="flex justify-between items-center bg-gray-900/30 p-3 rounded-xl text-sm border border-gray-800">
                  <span className="text-gray-400 font-mono text-xs">{h.date}</span>
                  <span className={`font-black ${h.isCorrect ? 'text-green-500' : 'text-red-500'}`}>{h.isCorrect ? "〇 SUCCESS" : "✕ MISS"}</span>
                </div>
              ))}
              {cardHistory.length === 0 && !isLoadingHistory && <p className="text-center text-gray-500 py-10">履歴なし</p>}
            </div>

            <button onClick={() => setSelectedCard(null)} className="mt-6 w-full bg-gray-700 hover:bg-gray-600 py-3 rounded-xl font-bold">閉じる (Enter)</button>
          </div>
        </div>
      )}

      {/* フッター操作 */}
      <div className="fixed bottom-0 left-0 w-full p-6 bg-gray-900/80 backdrop-blur-md border-t border-gray-800 flex gap-4">
        <button onClick={() => router.push(`/workbook/${workbookId}`)} className="flex-1 bg-gray-800 py-4 rounded-xl font-bold border border-gray-700">終了</button>
        <button onClick={() => window.location.reload()} className="flex-1 bg-blue-600 py-4 rounded-xl font-bold">解き直す</button>
      </div>
    </div>
  );
}