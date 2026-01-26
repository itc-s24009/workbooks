'use client';

import { createCard } from "@/actions/cards";
import { useRef } from "react";

export function CardInputForm({ workbookId }: { workbookId: string }) {
  const formRef = useRef<HTMLFormElement>(null);

  const handleSubmit = async (formData: FormData) => {
    // 実際にActionを呼び出す
    const result = await createCard(formData);
    
    if (result.success) {
      formRef.current?.reset(); // 成功したらフォームを空にする
    } else {
      alert(result.message);
    }
  };

  return (
    <section className="bg-gray-800 border border-gray-700 rounded-2xl p-6 mb-12 shadow-xl shadow-black/20">
      <h2 className="text-sm font-bold text-blue-400 mb-4 uppercase tracking-widest">カードを追加する</h2>
      
      {/* 
         JavaScriptの関数のとして呼び出すことで、型エラーを回避し、
         結果を受け取ってリセット処理などができるようになります 
      */}
      <form 
        action={handleSubmit} 
        ref={formRef} 
        className="grid grid-cols-1 md:grid-cols-2 gap-4"
      >
        <input type="hidden" name="workbookId" value={workbookId} />
        <input 
          name="question" 
          placeholder="問題を入力" 
          className="bg-gray-900 border border-gray-700 rounded-lg p-3 outline-none focus:ring-2 focus:ring-blue-600 transition text-white" 
          required 
        />
        <div className="flex gap-2">
          <input 
            name="answer" 
            placeholder="答えを入力" 
            className="bg-gray-900 border border-gray-700 rounded-lg p-3 outline-none focus:ring-2 focus:ring-blue-600 transition flex-grow text-white" 
            required 
          />
          <button 
            type="submit" 
            className="bg-blue-600 px-6 rounded-lg font-bold hover:bg-blue-500 transition active:scale-95 text-white"
          >
            作成
          </button>
        </div>
      </form>
    </section>
  );
}