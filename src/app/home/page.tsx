import { auth } from "@/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { signOutAction } from '@/components/auth/action';
import { CreateButtonAndModal } from './_components/CreateButtonAndModal'; 
import { ItemList } from './_components/ItemList';

export default async function HomePage() {
  const session = await auth();
  if (!session?.user?.email) redirect("/");

  // 1. 自分のデータを取得
  const userWithData = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: {
      directories: { where: { parentId: null } },
      workbooks: { where: { parentId: null } },
      receivedShares: { // 自分宛てのシェア
        include: { workbook: true }
      }
    },
  });

  if (!userWithData) return <div>ユーザー不明</div>;

  // 2. 「シェアされたフォルダ」の自動管理
  // もしシェアされたデータがある場合、仮想的にフォルダとしてまとめます
  let directories = userWithData.directories.map(d => ({ ...d, type: 'directory' as const }));
  let workbooks = userWithData.workbooks.map(w => ({ ...w, type: 'workbook' as const }));

  if (userWithData.receivedShares.length > 0) {
    // 既に「シェアされたアイテム」という名前のディレクトリが自分のデータにあるかチェック
    let shareDir = userWithData.directories.find(d => d.name === "シェアされたアイテム");
    
    // なければ作成
    if (!shareDir) {
      shareDir = await prisma.directory.create({
        data: {
          name: "シェアされたアイテム",
          userId: userWithData.id,
        }
      });
      // 作成したのでリストに追加
      directories.push({ ...shareDir, type: 'directory' as const });
    }

    // 各シェアデータの移動先を、自動でこの「シェアフォルダ」にする
    // （※本来のデータ所有権は元の人のまま、自分だけこのフォルダに見えるようにする）
    // そのため、シェアフォルダの中身は「Directoryページ」の方で取得するようにします。
  }

  return (
    <div className="p-8 max-w-4xl mx-auto min-h-screen bg-gray-900 text-white">
      <header className="flex justify-between items-center mb-4 border-b border-gray-800 pb-4">
        <h1 className="text-2xl font-black italic tracking-tighter">My Workspace</h1>
        <div className="flex items-center gap-4 text-gray-500 text-xs font-bold uppercase">
          <span>{session.user.name}</span>
          <form action={signOutAction}><button type="submit" className="bg-gray-800 border border-gray-700 px-3 py-1 rounded">Log Out</button></form>
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