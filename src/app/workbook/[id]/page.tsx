import { auth } from "@/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import Link from "next/link";
import { CardList } from "./_components/CardList";
import { CardInputForm } from "./_components/CardInputForm";
import { ShareButtonAndModal } from "./_components/ShareButtonAndModal";
// ↓ 新しいヘッダーコンポーネントをインポート
import { WorkbookHeader } from "./_components/WorkbookHeader";

export default async function WorkbookPage({ params }: { params: Promise<{ id: string }> }) {
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
      {/* ↓ 古いヘッダー記述を削除し、機能付きヘッダーに置き換え */}
      <WorkbookHeader 
        id={workbook.id}
        name={workbook.name}
        description={workbook.description}
        parentId={workbook.parentId}
        breadcrumbs={crumbs}
        userName={session.user.name || ""}
      />

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