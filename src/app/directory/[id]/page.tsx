import { auth } from "@/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { signOutAction } from '@/components/auth/action';
import { CreateButtonAndModal } from '../../home/_components/CreateButtonAndModal'; 
import { ItemList } from '../../home/_components/ItemList';
import Link from 'next/link';

type Breadcrumb = { id: string; name: string; };

export default async function DirectoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.email) redirect("/");

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });
  if (!user) redirect("/");

  // シンプルにディレクトリの中身を取得するだけでOKになりました
  const currentDir = await prisma.directory.findUnique({
    where: { id: id },
    include: {
      children: true,   
      workbooks: true,
    }
  });

  if (!currentDir || currentDir.userId !== user.id) redirect("/home");

  // パンくずリスト生成
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

  // 表示用データの整形
  const directories = currentDir.children.map(d => ({ ...d, type: 'directory' as const }));
  const workbooks = currentDir.workbooks.map(w => ({ ...w, type: 'workbook' as const }));

  return (
    <div className="p-8 max-w-4xl mx-auto bg-gray-900 text-white min-h-screen">
      <header className="flex justify-between items-start mb-6 border-b border-gray-800 pb-4">
        <div>
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
          <h1 className="text-4xl font-black italic tracking-tighter">
            {currentDir.name}
          </h1>
        </div>
        <div className="flex flex-col items-end gap-2 text-right">
          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{session.user.name}</p>
          <form action={signOutAction}>
            <button type="submit" className="text-gray-500 hover:text-white transition text-[10px] border border-gray-800 px-2 py-1 rounded">Logout</button>
          </form>
        </div>
      </header>

      <CreateButtonAndModal parentId={id} />

      <main className="mt-10">
        <div className="flex items-center gap-3 mb-6">
           <h2 className="text-xs font-black text-gray-500 uppercase tracking-[0.3em]">Contents List</h2>
           <div className="flex-grow h-[1px] bg-gray-800"></div>
        </div>
        <ItemList directories={directories} workbooks={workbooks} />
      </main>
    </div>
  );
}