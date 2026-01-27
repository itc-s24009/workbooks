import { auth } from "@/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { signOutAction } from '@/components/auth/action';
import { CreateButtonAndModal } from '../../home/_components/CreateButtonAndModal'; 
import { ItemList } from '../../home/_components/ItemList';
import Link from 'next/link';

// パンくずリスト用の型
type Breadcrumb = { id: string; name: string; };

export default async function DirectoryPage({ params }: { params: Promise<{ id: string }> }) {
  // 1. パラメータと認証の確認
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.email) redirect("/");

  // 2. 自分のユーザー情報を取得
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });
  if (!user) redirect("/");

  // 3. 表示中のディレクトリ情報を取得
  const currentDir = await prisma.directory.findUnique({
    where: { id: id },
    include: {
      children: true,   // 子フォルダ
      workbooks: true,  // 直属の問題集
    }
  });

  if (!currentDir || currentDir.userId !== user.id) redirect("/home");

  // 4. 【シェア機能】もしこのフォルダがシェア受取用なら、届いているアイテムを追加する
  let displayWorkbooks = currentDir.workbooks.map(w => ({ ...w, type: 'workbook' as const }));

  if (currentDir.name === "シェアされたアイテム") {
    // 自分宛てにシェアされたレコードを全件取得
    const receivedShares = await prisma.share.findMany({
      where: { receiverId: user.id },
      include: { 
        workbook: {
          include: { cards: true } // カード数なども必要な場合のために含める
        } 
      }
    });

    // シェアされた問題集をリストに合流させる
    const sharedWbs = receivedShares.map(s => ({
      ...s.workbook,
      type: 'workbook' as const,
      // 注意: シェアされたものは「自分のではない」が、ここでは同等に表示する
    }));

    displayWorkbooks = [...displayWorkbooks, ...sharedWbs];
  }

  // 5. パンくずリストの生成（さかのぼり処理）
  const breadcrumbs: Breadcrumb[] = [];
  let tempParentId = currentDir.parentId;

  while (tempParentId) {
    const parent = await prisma.directory.findUnique({
      where: { id: tempParentId },
      select: { id: true, name: true, parentId: true }
    });
    if (parent) {
      breadcrumbs.unshift({ id: parent.id, name: parent.name });
      tempParentId = parent.parentId;
    } else {
      break;
    }
  }

  const displayDirectories = currentDir.children.map(d => ({ ...d, type: 'directory' as const }));

  return (
    <div className="p-8 max-w-4xl mx-auto bg-gray-900 text-white min-h-screen">
      {/* ヘッダー部分 */}
      <header className="flex justify-between items-start mb-6 border-b border-gray-800 pb-4">
        <div>
          {/* パンくずリスト */}
          <nav className="flex items-center gap-1 text-[10px] text-gray-500 mb-1 flex-wrap font-bold uppercase tracking-wider">
            <Link href="/home" className="hover:text-blue-500 transition">Home</Link>
            {breadcrumbs.map((crumb) => (
              <span key={crumb.id} className="flex items-center gap-1">
                <span className="text-gray-700">/</span>
                <Link href={`/directory/${crumb.id}`} className="hover:text-blue-500 transition">
                  {crumb.name}
                </Link>
              </span>
            ))}
            <span className="flex items-center gap-1 text-gray-700">/</span>
            <span className="text-blue-400">{currentDir.name}</span>
          </nav>

          {/* ディレクトリ名 */}
          <h1 className="text-4xl font-black italic tracking-tighter">
            {currentDir.name === "シェアされたアイテム" ? "Shared box" : currentDir.name}
          </h1>
        </div>

        {/* ユーザーエリア */}
        <div className="flex flex-col items-end gap-2 text-right">
          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{session.user.name}</p>
          <form action={signOutAction}>
            <button type="submit" className="text-gray-500 hover:text-white transition text-[10px] border border-gray-800 px-2 py-1 rounded">
              Logout
            </button>
          </form>
        </div>
      </header>

      {/* 新規作成ボタン (シェア用ディレクトリ内でも追加作成できるように親IDを渡す) */}
      <CreateButtonAndModal parentId={id} />

      {/* メインリスト：自前アイテム ＋ シェアアイテムを合体させて表示 */}
      <main className="mt-10">
        <div className="flex items-center gap-3 mb-6">
           <h2 className="text-xs font-black text-gray-500 uppercase tracking-[0.3em]">Contents List</h2>
           <div className="flex-grow h-[1px] bg-gray-800"></div>
        </div>

        <ItemList 
          directories={displayDirectories} 
          workbooks={displayWorkbooks} 
        />
      </main>
    </div>
  );
}