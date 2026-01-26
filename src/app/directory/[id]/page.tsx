import { auth } from "@/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { signOutAction } from '@/components/auth/action';
import { CreateButtonAndModal } from '../../home/_components/CreateButtonAndModal'; 
import { ItemList } from '../../home/_components/ItemList';
import Link from 'next/link';

// パンくずリスト用の型
type Breadcrumb = {
  id: string;
  name: string;
};

export default async function DirectoryPage({ params }: { params: { id: string } }) {
  const resolvedParams = await params;
  const id = resolvedParams.id;

  const session = await auth();
  if (!session?.user?.email) redirect("/");

  // 1. 現在のフォルダと直近の中身を取得
  const currentDir = await prisma.directory.findUnique({
    where: { id: id },
    include: {
      children: true,
      workbooks: true,
    }
  });

  if (!currentDir) redirect("/home");

  // 2. パンくずリスト（階層）をさかのぼって生成
  // 親フォルダの名前とIDを配列に溜めていきます
  const breadcrumbs: Breadcrumb[] = [];
  let tempParentId = currentDir.parentId;

  while (tempParentId) {
    const parent = await prisma.directory.findUnique({
      where: { id: tempParentId },
      select: { id: true, name: true, parentId: true }
    });
    if (parent) {
      breadcrumbs.unshift({ id: parent.id, name: parent.name }); // 配列の先頭に追加していく
      tempParentId = parent.parentId;
    } else {
      tempParentId = null;
    }
  }

  // 3. 表示データの整形
  const directories = currentDir.children.map(d => ({ ...d, type: 'directory' as const }));
  const workbooks = currentDir.workbooks.map(w => ({ ...w, type: 'workbook' as const }));

  return (
    <div className="p-8 max-w-4xl mx-auto bg-gray-900 text-white min-h-screen">
      {/* ヘッダー部分 */}
      <header className="flex justify-between items-start mb-4 border-b border-gray-800 pb-4">
        <div>
          {/* パンくずリスト (A / B / C) */}
          <nav className="flex items-center gap-1 text-xs text-gray-500 mb-1 flex-wrap">
            <Link href="/home" className="hover:text-blue-400 transition">Home</Link>
            {breadcrumbs.map((crumb) => (
              <span key={crumb.id} className="flex items-center gap-1">
                <span>/</span>
                <Link href={`/directory/${crumb.id}`} className="hover:text-blue-400 transition">
                  {crumb.name}
                </Link>
              </span>
            ))}
            <span className="flex items-center gap-1">
              <span>/</span>
              <span className="text-gray-400">{currentDir.name}</span>
            </span>
          </nav>

          {/* 現在のディレクトリ名 (デカ文字) */}
          <h1 className="text-4xl font-black tracking-tight">
            {currentDir.name}
          </h1>
        </div>

        {/* ユーザー・ログアウトエリア */}
        <div className="flex flex-col items-end gap-2">
          <p className="text-xs text-gray-500">{session.user.name}さん</p>
          <form action={signOutAction}>
            <button type="submit" className="bg-gray-800 text-gray-400 text-xs px-3 py-1.5 rounded border border-gray-700 hover:text-white hover:bg-red-900/20 transition">
              ログアウト
            </button>
          </form>
        </div>
      </header>

      {/* 新規作成ボタン (parentIdを渡す) */}
      <CreateButtonAndModal parentId={id} />

      {/* コンテンツ一覧 (ホームと同じデザイン) */}
      <main className="mt-10">
        <h2 className="text-sm font-bold text-gray-500 mb-6 uppercase tracking-[0.2em]">Contents</h2>
        <ItemList directories={directories} workbooks={workbooks} />
      </main>
    </div>
  );
}