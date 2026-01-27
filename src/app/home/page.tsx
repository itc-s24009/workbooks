import { auth } from "@/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { signOutAction } from '@/components/auth/action';
import { CreateButtonAndModal } from './_components/CreateButtonAndModal'; 
import { ItemList } from './_components/ItemList';

export default async function HomePage() {
  const session = await auth();
  if (!session?.user?.email) redirect("/");

  // 自分（ルート階層）のデータのみを素直に取得
  const userWithData = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: {
      directories: { where: { parentId: null } },
      workbooks: { where: { parentId: null } },
    },
  });

  if (!userWithData) return <div>ユーザー不明</div>;

  // ※もうここで「シェア」に関する複雑な計算は不要です
  // アクション側で自動作成された「シェアされたアイテム」フォルダも
  // ここでは普通のフォルダの一つとして自動的に読み込まれます。

  const directories = userWithData.directories.map(d => ({ ...d, type: 'directory' as const }));
  const workbooks = userWithData.workbooks.map(w => ({ ...w, type: 'workbook' as const }));

  return (
    <div className="p-8 max-w-4xl mx-auto min-h-screen bg-gray-900 text-white">
      <header className="flex justify-between items-center mb-4 border-b border-gray-800 pb-4">
        <h1 className="text-2xl font-black italic tracking-tighter">My Workspace</h1>
        <div className="flex items-center gap-4 text-gray-500 text-xs font-bold uppercase">
          <span>{session.user.name}</span>
          <form action={signOutAction}><button type="submit" className="bg-gray-800 border border-gray-700 px-3 py-1 rounded hover:text-white transition">Log Out</button></form>
        </div>
      </header>
      
      <CreateButtonAndModal />
      
      <main className="mt-8">
        <h2 className="text-[10px] font-black text-gray-600 mb-6 uppercase tracking-[0.3em]">Items</h2>
        <ItemList directories={directories} workbooks={workbooks} />
      </main>
    </div>
  );
}