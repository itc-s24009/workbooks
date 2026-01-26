import { auth } from "@/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import Link from "next/link";
import { signOutAction } from "@/components/auth/action";
import { CardList } from "./_components/CardList";
import { CardInputForm } from "./_components/CardInputForm"; // 新しい部品

export default async function WorkbookPage({ params }: { params: { id: string } }) {
  const resolvedParams = await params;
  const id = resolvedParams.id;
  
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
    const d: any = await prisma.directory.findUnique({ where: { id: tempDirId }, select: { id: true, name: true, parentId: true } });
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
          <nav className="text-xs text-gray-500 mb-1 flex items-center gap-1">
            <Link href="/home" className="hover:text-white transition">Home</Link>
            {crumbs.map(c => (
              <span key={c.id}> / <Link href={`/directory/${c.id}`} className="hover:text-white transition">{c.name}</Link></span>
            ))}
            <span> / {workbook.name}</span>
          </nav>
          <h1 className="text-4xl font-black">{workbook.name}</h1>
          <p className="text-gray-500 text-sm mt-1">{workbook.description}</p>
        </div>
        <form action={signOutAction}>
          <button type="submit" className="text-gray-500 text-xs border border-gray-700 px-3 py-1 rounded hover:text-white transition">ログアウト</button>
        </form>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10 text-center">
        <button className="bg-blue-600 py-6 rounded-xl text-xl font-black hover:bg-blue-500 transition shadow-lg active:scale-95 shadow-blue-900/20">
          問題スタート 🚀
        </button>
        <button className="bg-gray-800 border border-gray-700 py-6 rounded-xl font-bold text-gray-500 cursor-default">
          学習履歴 📊
        </button>
        <button className="bg-gray-800 border border-gray-700 py-6 rounded-xl font-bold text-gray-500 cursor-default">
          シェア ✉️
        </button>
      </div>

      {/* 修正：型エラーが起きていた箇所を新しく切り出したコンポーネントに差し替え */}
      <CardInputForm workbookId={id} />

      <section>
        <h2 className="text-sm font-bold text-gray-500 mb-4 uppercase tracking-widest">問題一覧 ({workbook.cards.length})</h2>
        <CardList cards={workbook.cards} />
      </section>
    </div>
  );
}