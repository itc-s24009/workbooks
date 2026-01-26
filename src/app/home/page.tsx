import { auth } from "@/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
// ↓ 先ほど作ったログアウト用のアクションを読み込みます
import { signOutAction } from "@/components/auth/action";

export default async function HomePage() {
  // 1. ログインチェック
  const session = await auth();
  
  // ログインしてなければトップ（ログイン画面）に強制送還
  if (!session?.user) {
    redirect("/");
  }

  // 2. 自分の問題集一覧を取得してみる
  const user = await prisma.user.findUnique({
    where: { email: session.user.email! },
    include: { workbooks: true } // 問題集も一緒に取る
  });

  return (
    <div className="p-8">
      <header className="flex justify-between items-center mb-8 border-b pb-4">
        <h1 className="text-2xl font-bold">マイ・ワークブック</h1>
        <div className="flex items-center gap-4">
          <p>ようこそ、{session.user.name}さん</p>
          
          {/* ▼ 追加したログアウトボタン ▼ */}
          <form action={signOutAction}>
            <button 
              type="submit"
              className="bg-gray-200 text-black text-sm px-3 py-1 rounded hover:bg-gray-300 transition"
            >
              ログアウト
            </button>
          </form>

        </div>
      </header>

      <main>
        {user?.workbooks.length === 0 ? (
          <p className="text-gray-500">まだ問題集がありません。「新規作成」しましょう！</p>
        ) : (
          <ul className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* userがnullの可能性を一応ケアするために ? をつけています */}
            {user?.workbooks?.map((wb) => (
              <li key={wb.id} className="border p-4 rounded shadow hover:bg-gray-50 transition">
                <h3 className="font-bold text-lg">{wb.name}</h3>
                <p className="text-sm text-gray-500">{wb.description}</p>
              </li>
            ))}
          </ul>
        )}
        
        <div className="mt-8">
           {/* 次に実装する「作成画面」へのリンクなどをここに置く */}
           <button className="bg-blue-600 text-white px-4 py-2 rounded">+ 問題集を作る</button>
        </div>
      </main>
    </div>
  );
}