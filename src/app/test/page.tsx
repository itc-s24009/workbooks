import prisma from "@/lib/prisma"
import { addUser, deleteUser } from "./actions"

// ページ本体（サーバーで動きます）
export default async function TestPage() {
  // 1. ページを開いた瞬間、DBから全ユーザーを取得
  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' } // 新しい順に並べる
  })

  return (
    <div className="p-10 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">DB接続テスト: ユーザー管理</h1>

      {/* --- 追加フォーム --- */}
      <div className="bg-gray-100 p-6 rounded-lg mb-8">
        <h2 className="font-bold mb-4">新規追加</h2>
        <form action={addUser} className="flex gap-4">
          <input 
            type="text" 
            name="name" 
            placeholder="名前 (例: 田中)" 
            className="border p-2 rounded flex-1 text-black"
            required 
          />
          <input 
            type="email" 
            name="email" 
            placeholder="メアド (例: a@test.com)" 
            className="border p-2 rounded flex-1 text-black"
            required 
          />
          <button 
            type="submit" 
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
          >
            追加
          </button>
        </form>
      </div>

      {/* --- ユーザーリスト表示 --- */}
      <div className="space-y-4">
        <h2 className="font-bold border-b pb-2">登録済みユーザー ({users.length}人)</h2>
        
        {users.length === 0 && <p className="text-gray-500">まだデータがありません</p>}

        {users.map((user) => (
          <div key={user.id} className="border p-4 rounded flex justify-between items-center bg-white shadow-sm text-black">
            <div>
              <p className="font-bold text-lg">{user.name}</p>
              <p className="text-gray-500 text-sm">{user.email}</p>
              <p className="text-gray-400 text-xs mt-1">ID: {user.id}</p>
            </div>
            
            {/* 削除ボタン（隠しformで実現） */}
            <form action={deleteUser.bind(null, user.id)}>
              <button 
                type="submit"
                className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600"
              >
                削除
              </button>
            </form>
          </div>
        ))}
      </div>
    </div>
  )
}