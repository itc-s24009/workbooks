import { auth } from "@/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import Link from "next/link";
import { signOutAction } from "@/components/auth/action";
import { CardList } from "./_components/CardList";
import { CardInputForm } from "./_components/CardInputForm";
// ↓ ここで作成したシェアボタン用コンポーネントをインポートします
import { ShareButtonAndModal } from "./_components/ShareButtonAndModal";

export default async function WorkbookPage({ params }: { params: Promise<{ id: string }> }) {
  // params を await する
  const { id } = await params;
  
  const session = await auth();
  if (!session?.user?.email) redirect("/");

  const workbook = await prisma.workbook.findUnique({
    where: { id },
    include: { 
      cards: { orderBy: { createdAt: 'desc' } }, 
      directory: true 
    }
  });

  if (!workbook) redirect("/home");

  // パンくずリスト生成
  const crumbs = [];
  let tempDirId = workbook.parentId;
  while (tempDirId) {
    const d: any = await prisma.directory.findUnique({ 
        where: { id: tempDirId }, 
        select: { id: true, name: true, parentId: true } 
    });
    if (d) { 
      crumbs.unshift(d); 
      tempDirId = d.parentId; 
    } else {
      break;
    }
  }

  return (
    <div className="p-8 max-w-4xl mx-auto min-h-screen bg-gray-900 text-white">
      <header className="flex justify-between items-start mb-6 border-b border-gray-800 pb-4">
        <div>
          <nav className="text-[10px] text-gray-500 mb-1 flex items-center gap-1 font-bold uppercase tracking-widest">
            <Link href="/home" className="hover:text-white transition">Home</Link>
            {crumbs.map(c => (
              <span key={c.id}> / <Link href={`/directory/${c.id}`} className="hover:text-white transition">{c.name}</Link></span>
            ))}
            <span className="text-blue-500"> / {workbook.name}</span>
          </nav>
          <h1 className="text-4xl font-black italic tracking-tighter">{workbook.name}</h1>
          <p className="text-gray-500 text-sm mt-1">{workbook.description || "No description"}</p>
        </div>
        <form action={signOutAction}>
          <button type="submit" className="text-gray-500 text-[10px] font-bold border border-gray-800 px-3 py-1 rounded hover:text-white transition uppercase tracking-tighter">Sign Out</button>
        </form>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10 text-center">
              <Link
                  href={`/workbook/${id}/play`} 
                  className="bg-blue-600 py-6 rounded-2xl text-xl font-black hover:bg-blue-500 transition shadow-lg active:scale-95 shadow-blue-900/20 text-center flex items-center justify-center"
              >
                  START 🚀
              </Link>
              <Link
                  href={`/workbook/${id}/history`}
                  className="bg-gray-800 border border-gray-700 py-6 rounded-2xl font-black text-gray-400 hover:text-white hover:bg-gray-750 transition text-center shadow-md flex items-center justify-center"
              >
                  HISTORY 📊
              </Link>

        {/* ▼ 死んでいたボタンを本物のシェア機能に置き換えました ▼ */}
        <ShareButtonAndModal workbookId={id} />
      </div>

      <CardInputForm workbookId={id} />

      <section>
        <div className="flex items-center gap-3 mb-6">
           <h2 className="text-xs font-black text-gray-500 uppercase tracking-[0.3em]">Card List ({workbook.cards.length})</h2>
           <div className="flex-grow h-[1px] bg-gray-800"></div>
        </div>
        <CardList cards={workbook.cards} />
      </section>
    </div>
  );
}