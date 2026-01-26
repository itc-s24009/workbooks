import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { signInAction } from "@/components/auth/action"; // 既存のアクションを使う

export default async function LoginPage() {
  // 1. 既にログイン済みなら、さっき作ったHomeへ飛ばす
  const session = await auth();
  if (session?.user) {
    redirect("/home");
  }

  // 2. 未ログインなら、ログイン画面を表示
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-100">
      <div className="w-full max-w-md bg-white p-8 rounded-lg shadow-md text-center">
        <h1 className="text-2xl font-bold mb-2">My Study App</h1>
        <p className="text-gray-500 mb-8">自学自習を効率化しよう</p>

        {/* サーバーアクションを使ったログインボタン */}
        <form action={signInAction}>
          <button 
            type="submit"
            className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded hover:bg-blue-700 transition flex items-center justify-center gap-2"
          >
            {/* Googleアイコン等はここに入れる */}
            Googleでログインして始める
          </button>
        </form>
      </div>
    </div>
  );
}