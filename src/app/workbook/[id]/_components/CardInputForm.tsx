'use client';

import { createCard } from "@/actions/cards";
import { useRef, useState } from "react";

export function CardInputForm({ workbookId }: { workbookId: string }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isSubmittingRef = useRef(false); // 連打ガード用

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isSubmittingRef.current) return; // ガード

    isSubmittingRef.current = true;
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);
    // hidden inputを使わなくてもここでappend可能ですが、form内にあるのでそのままでOK
    
    const result = await createCard(formData);
    
    if (result.success) {
      formRef.current?.reset();
      // 連続投稿しやすいように、フォームの最初の要素（問題文）にフォーカスを戻すと親切です
      (formRef.current?.elements[1] as HTMLElement)?.focus();
    } else {
      alert(result.message);
    }
    
    isSubmittingRef.current = false;
    setIsSubmitting(false);
  };

  return (
    <section className="bg-gray-800 border border-gray-700 rounded-2xl p-6 mb-12 shadow-xl shadow-black/20">
      <h2 className="text-sm font-bold text-blue-400 mb-4 uppercase tracking-widest">カードを追加する</h2>
      
      <form 
        onSubmit={handleSubmit} // actionではなくonSubmit
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
            disabled={isSubmitting}
            className="bg-blue-600 px-6 rounded-lg font-bold hover:bg-blue-500 transition active:scale-95 text-white disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap min-w-[80px] flex items-center justify-center"
          >
            {isSubmitting ? (
               <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            ) : "作成"}
          </button>
        </div>
      </form>
    </section>
  );
}