import { auth } from "@/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import Link from "next/link";
import { signOutAction } from "@/components/auth/action";

export default async function SessionResultPage({ params }: { params: { id: string } }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.email) redirect("/");

  const studySession = await prisma.studySession.findUnique({
    where: { id },
    include: {
      workbook: true,
      records: {
        include: { card: true }
      }
    }
  });

  if (!studySession) redirect("/home");

  const correctCount = studySession.records.filter(r => r.isCorrect).length;

  return (
    <div className="p-8 max-w-4xl mx-auto min-h-screen bg-gray-900 text-white font-sans">
      <div className="text-center mb-10 pt-4">
        <h1 className="text-blue-500 text-[10px] font-black tracking-[0.3em] uppercase mb-4">Past Result Data</h1>
        <h2 className="text-4xl font-black tracking-tight">{studySession.workbook.name}</h2>
        <p className="text-gray-500 font-mono text-xs mt-3 bg-gray-800 inline-block px-4 py-1 rounded-full border border-gray-700">
          {new Date(studySession.createdAt).toLocaleString('ja-JP')}
        </p>
      </div>

      <div className="bg-gray-800 border-2 border-gray-700 rounded-3xl p-10 mb-10 text-center shadow-2xl relative overflow-hidden">
        <div className="text-8xl font-black text-white mb-2 tracking-tighter">
          {Math.round(studySession.accuracyRate)}<span className="text-4xl text-blue-500 font-black ml-1">%</span>
        </div>
        <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">Overall Score: {correctCount} / {studySession.records.length}</p>
        {/* 背景装飾 */}
        <div className="absolute -top-10 -left-10 w-40 h-40 bg-blue-600/5 blur-3xl rounded-full"></div>
      </div>

      <div className="space-y-4 mb-32">
        <h3 className="font-bold text-gray-500 uppercase tracking-widest text-[10px] ml-4">Answer Log</h3>
        {studySession.records.map((r, i) => (
          <div key={i} className="flex items-center gap-5 bg-gray-850 border border-gray-800 p-5 rounded-2xl hover:border-gray-700 transition duration-300">
            <div className={`w-12 h-12 flex items-center justify-center rounded-full font-black text-2xl shadow-inner ${r.isCorrect ? 'bg-green-900/10 text-green-500 border border-green-500/20' : 'bg-red-900/10 text-red-500 border border-red-500/20'}`}>
              {r.isCorrect ? "○" : "×"}
            </div>
            <div>
              <p className="text-[9px] text-gray-500 font-bold uppercase leading-tight mb-1 font-mono tracking-wider">Question {i+1}</p>
              <div className="text-lg font-bold text-gray-200">{r.card.question}</div>
              <div className="text-sm text-gray-400 italic mt-1 font-medium">Ans: {r.card.answer}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="fixed bottom-0 left-0 w-full p-6 bg-gray-900/80 backdrop-blur-xl border-t border-gray-800 flex justify-center">
        <Link 
          href={`/workbook/${studySession.workbookId}/history`} 
          className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-4 px-12 rounded-xl transition shadow-xl"
        >
          ← 履歴一覧に戻る
        </Link>
      </div>
    </div>
  );
}