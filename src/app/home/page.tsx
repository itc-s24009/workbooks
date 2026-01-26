import { auth } from "@/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { signOutAction } from '@/components/auth/action';
import { CreateButtonAndModal } from './_components/CreateButtonAndModal'; 
import { ItemList } from './_components/ItemList';

export default async function HomePage() {
  const session = await auth();
  if (!session?.user?.email) redirect("/");

  // DBからデータを取得
  const userWithData = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: {
      directories: { where: { parentId: null } },
      workbooks: { where: { parentId: null } },
    },
  });

  if (!userWithData) return <div>ユーザーが見つかりません</div>;

  // クライアントコンポーネントに渡すために、型を整形
  const directories = userWithData.directories.map(d => ({ ...d, type: 'directory' as const }));
  const workbooks = userWithData.workbooks.map(w => ({ ...w, type: 'workbook' as const }));
  
  return (
    <div className="p-8 max-w-4xl mx-auto">
      {/* ヘッダー */}
      <header className="flex justify-between items-center mb-4 border-b pb-4">
        <h1 className="text-2xl font-bold">マイ・ワークスペース</h1>
        <div className="flex items-center gap-4">
          <p>ようこそ、{session.user.name}さん</p>
          <form action={signOutAction}>
            <button type="submit" className="bg-gray-200 text-black text-sm px-3 py-1 rounded hover:bg-gray-300 transition">ログアウト</button>
          </form>
        </div>
      </header>
      
      {/* 新規作成ボタンとポップアップ */}
      <CreateButtonAndModal />
      
      {/* アイテム一覧 */}
      <main className="mt-6">
        <h2 className="text-xl font-semibold mb-4">アイテム一覧</h2>
        <ItemList directories={directories} workbooks={workbooks} />
      </main>
    </div>
  );
}