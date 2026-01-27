import { auth } from "@/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import Link from "next/link";
import { signOutAction } from "@/components/auth/action";

export default async function HistoryPage({ params }: { params: { id: string } }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.email) redirect("/");

  // その問題集の過去の全セッションを新しい順に取得
  const workbook = await prisma.workbook.findUnique({
    where: { id },
    include: {
      sessions: {
        orderBy: { createdAt: 'desc' }
      }
    }
  });

  if (!workbook) redirect("/home");

  return (
    <div className="p-8 max-w-4xl mx-auto min-h-screen bg-gray-900 text-white font-sans">
      <header className="flex justify-between items-start mb-10 border-b border-gray-800 pb-6">
        <div>
          <nav className="text-xs text-gray-500 mb-2 flex items-center gap-1 uppercase tracking-widest font-bold">
            <Link href="/home" className="hover:text-white transition">Home</Link>
            <span>/</span>
            <Link href={`/workbook/${id}`} className="hover:text-white transition">{workbook.name}</Link>
            <span className="text-gray-600">/ History</span>
          </nav>
          <h1 className="text-4xl font-black italic">Analytics Log</h1>
          <p className="text-blue-500 text-sm font-bold mt-1 uppercase tracking-tighter">Results history for "{workbook.name}"</p>
        </div>
        <form action={signOutAction}><button type="submit" className="text-gray-500 text-xs border border-gray-700 px-3 py-1 rounded hover:text-white transition">Sign Out</button></form>
      </header>

      <main className="space-y-4 pb-20">
        {workbook.sessions.length === 0 ? (
          <div className="text-center py-20 bg-gray-800/30 border border-dashed border-gray-800 rounded-3xl">
            <p className="text-gray-500 italic">まだ履歴がありません</p>
          </div>
        ) : (
          workbook.sessions.map((s) => (
            <Link 
              key={s.id} 
              href={`/study-session/${s.id}`} 
              className="flex items-center justify-between bg-gray-800 border border-gray-700 p-6 rounded-2xl hover:border-blue-500/50 hover:bg-gray-750 transition-all group shadow-xl active:scale-[0.98]"
            >
              <div>
                <p className="text-[10px] text-gray-500 font-black uppercase mb-1 tracking-widest">Studied at</p>
                <p className="font-mono text-gray-200">
                  {new Date(s.createdAt).toLocaleString('ja-JP')}
                </p>
              </div>
              
              <div className="flex items-center gap-6">
                <div className="text-right">
                  <p className="text-[10px] text-gray-500 font-black uppercase mb-1 tracking-widest">Score</p>
                  <p className={`text-2xl font-black ${s.accuracyRate >= 80 ? 'text-green-500' : s.accuracyRate >= 50 ? 'text-yellow-500' : 'text-red-500'}`}>
                    {Math.round(s.accuracyRate)}<span className="text-xs">%</span>
                  </p>
                </div>
                <div className="text-gray-600 group-hover:text-blue-500 transition">→</div>
              </div>
            </Link>
          ))
        )}
      </main>

      {/* フッター代わりの戻るボタン */}
      <div className="fixed bottom-0 left-0 w-full p-6 flex justify-center bg-gradient-to-t from-gray-900 to-transparent">
         <Link href={`/workbook/${id}`} className="bg-gray-800 border border-gray-700 text-white font-bold py-3 px-10 rounded-full hover:bg-gray-700 transition shadow-2xl">
           問題集に戻る
         </Link>
      </div>
    </div>
  );
}