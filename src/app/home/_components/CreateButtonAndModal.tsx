'use client'; 

import { useState, useRef } from 'react';
import { createItem } from '@/actions/creations'; 

export function CreateButtonAndModal({ parentId }: { parentId?: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [itemType, setItemType] = useState<'workbook' | 'directory'>('workbook');
  
  // ▼ UI表示用（くるくる回す用）の状態
  const [isSubmitting, setIsSubmitting] = useState(false);
  // ▼ ロジック判定用（連打防止用）の即時変数
  const isSubmittingRef = useRef(false);

  const formRef = useRef<HTMLFormElement>(null); 
  
  // 標準的なフォーム送信イベントハンドラを使用
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); // 画面リロード阻止

    // 物理ロックがかかっていたら即リターン（0.1秒未満の連打もここで止まる）
    if (isSubmittingRef.current) return;

    // ロック開始
    isSubmittingRef.current = true;
    setIsSubmitting(true);

    // FormDataの生成
    const formData = new FormData(e.currentTarget);
    formData.append('type', itemType);
    if (parentId) formData.append('parentId', parentId);
    
    // 処理実行
    const result = await createItem(formData);
    
    if (result.success) {
      setIsOpen(false);
      formRef.current?.reset();
    } else {
      alert(result.message);
    }

    // ロック解除
    isSubmittingRef.current = false;
    setIsSubmitting(false);
  };

  return (
    <>
      <div className="text-center my-8">
        <button 
          onClick={() => setIsOpen(true)} 
          className="bg-blue-600 text-white font-bold py-3 px-8 rounded-full text-lg shadow-lg hover:bg-blue-700 transition active:scale-95"
        >
          + 新規作成
        </button>
      </div>
      
      {isOpen && (
         <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-8 w-full max-w-md shadow-2xl">
            <h2 className="text-2xl font-bold mb-6 text-white text-center underline decoration-blue-500 underline-offset-8">新規作成</h2>
            
            {/* onSubmitで制御することで、入力中のEnterキー＝送信ボタンクリックと同じ扱いになります */}
            <form onSubmit={handleSubmit} ref={formRef}>
               <div className="mb-6">
                <label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-widest">種類を選択</label>
                <div className="grid grid-cols-2 gap-4">
                  <button type="button" onClick={() => setItemType('directory')} className={`py-3 rounded-lg font-bold transition border border-transparent ${itemType === 'directory' ? 'bg-blue-500 text-white shadow-lg' : 'bg-gray-700 text-gray-400 hover:border-gray-500'}`}>📁 フォルダ</button>
                  <button type="button" onClick={() => setItemType('workbook')} className={`py-3 rounded-lg font-bold transition border border-transparent ${itemType === 'workbook' ? 'bg-blue-500 text-white shadow-lg' : 'bg-gray-700 text-gray-400 hover:border-gray-500'}`}>📖 問題集</button>
                </div>
              </div>
              
              <div className="mb-6">
                <label htmlFor="name" className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-widest">名前</label>
                <input 
                  type="text" 
                  name="name" 
                  id="name" 
                  maxLength={30}
                  required 
                  autoFocus // ポップアップが出た瞬間にフォーカス
                  placeholder="入力してください"
                  className="bg-gray-900 border border-gray-700 text-white block w-full rounded-lg p-3 focus:ring-2 focus:ring-blue-500 outline-none transition"
                />
              </div>
              
              {itemType === 'workbook' && (
                <div className="mb-8">
                  <label htmlFor="description" className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-widest">説明（任意）</label>
                  <textarea 
                    name="description" 
                    id="description" 
                    maxLength={50}
                    rows={3} 
                    className="bg-gray-900 border border-gray-700 text-white block w-full rounded-lg p-3 focus:ring-2 focus:ring-blue-500 outline-none transition"
                  ></textarea>
                </div>
              )}
              
              <div className="flex gap-4">
                <button 
                  type="button" 
                  onClick={() => setIsOpen(false)} 
                  disabled={isSubmitting} 
                  className="flex-1 bg-gray-700 text-white font-bold py-3 rounded-lg hover:bg-gray-600 transition disabled:opacity-50"
                >
                  キャンセル
                </button>
                <button 
                  type="submit" 
                  disabled={isSubmitting} // ボタンも無効化
                  className="flex-1 bg-green-600 text-white font-bold py-3 rounded-lg hover:bg-green-500 transition shadow-lg shadow-green-900/20 disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                      処理中...
                    </>
                  ) : (
                    "作成 (Enter)"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}