import { auth } from "@/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import Link from "next/link";
import { signOutAction } from "@/components/auth/action";
import { SessionHistoryList } from "./[id]/_components/SessionHistoryList"; // 呼び出し

export default async function SessionResultPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.email) redirect("/");

  const studySession = await prisma.studySession.findUnique({
    where: { id },
    include: {
      workbook: true,
      records: { include: { card: true } }
    }
  });

  if (!studySession) redirect("/home");

  const correctCount = studySession.records.filter(r => r.isCorrect).length;

  return (
    <div className="p-8 max-w-4xl mx-auto min-h-screen bg-gray-900 text-white font-sans">
      <div className="text-center mb-10 pt-4">
        <h1 className="text-blue-500 text-[10px] font-black tracking-[0.3em] uppercase mb-4">Saved Historical Analytics</h1>
        <h2 className="text-4xl font-black tracking-tighter">{studySession.workbook.name}</h2>
        <p className="text-gray-500 font-mono text-xs mt-3 bg-black/40 inline-block px-4 py-2 rounded-full border border-gray-800 shadow-inner">
          Record at: {new Date(studySession.createdAt).toLocaleString('ja-JP')}
        </p>
      </div>

      <div className="bg-gray-800 border-2 border-gray-700 rounded-[2.5rem] p-12 mb-14 text-center shadow-2xl relative overflow-hidden">
        <div className="text-8xl font-black text-white mb-2 tracking-tighter drop-shadow-lg">
          {Math.round(studySession.accuracyRate)}<span className="text-4xl text-blue-600 font-black ml-1">%</span>
        </div>
        <p className="text-gray-500 font-black uppercase tracking-[0.4em] text-[9px] opacity-70">Calculated Final Score</p>
        <p className="mt-2 text-xs font-bold text-gray-400">Total Solved: {correctCount} / {studySession.records.length}</p>
        <div className="absolute -top-10 -right-10 w-56 h-56 bg-blue-500/5 blur-[80px] rounded-full"></div>
      </div>

      {/* --- 新しく作ったクライアント部品を使用 --- */}
      <SessionHistoryList records={studySession.records} />

      <div className="fixed bottom-0 left-0 w-full p-8 bg-gray-900/90 backdrop-blur-2xl border-t border-gray-800/80 flex justify-center z-50">
        <Link 
          href={`/workbook/${studySession.workbookId}/history`} 
          className="bg-gray-800 hover:bg-white hover:text-black border border-gray-700 text-gray-300 font-black py-4 px-14 rounded-full transition-all duration-300 shadow-2xl tracking-tighter uppercase"
        >
          ← History Overview
        </Link>
      </div>
    </div>
  );
}