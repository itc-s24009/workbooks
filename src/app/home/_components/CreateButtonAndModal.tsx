'use client'; 

import { useState, useRef } from 'react';
import { createItem } from '@/actions/creations'; 

// parentIdを受け取れるように拡張
export function CreateButtonAndModal({ parentId }: { parentId?: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [itemType, setItemType] = useState<'workbook' | 'directory'>('workbook');
  const formRef = useRef<HTMLFormElement>(null); 
  
  const handleCreate = async (formData: FormData) => {
    formData.append('type', itemType);
    if (parentId) formData.append('parentId', parentId); // 親IDがあれば追加
    const result = await createItem(formData);
    
    if (result.success) {
      setIsOpen(false);
      formRef.current?.reset();
    } else {
      alert(result.message);
    }
  };

  return (
    <>
      <div className="text-center my-8">
        <button onClick={() => setIsOpen(true)} className="bg-blue-600 text-white font-bold py-3 px-8 rounded-full text-lg shadow-lg hover:bg-blue-700 transition active:scale-95">
          + 新規作成
        </button>
      </div>
      
      {isOpen && (
         <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-8 w-full max-w-md shadow-2xl">
            <h2 className="text-2xl font-bold mb-6 text-white text-center underline decoration-blue-500 underline-offset-8">新規作成</h2>
            <form action={handleCreate} ref={formRef}>
               <div className="mb-6">
                <label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-widest">種類を選択</label>
                <div className="grid grid-cols-2 gap-4">
                  <button type="button" onClick={() => setItemType('directory')} className={`py-3 rounded-lg font-bold transition ${itemType === 'directory' ? 'bg-blue-500 text-white' : 'bg-gray-700 text-gray-400'}`}>📁 フォルダ</button>
                  <button type="button" onClick={() => setItemType('workbook')} className={`py-3 rounded-lg font-bold transition ${itemType === 'workbook' ? 'bg-blue-500 text-white' : 'bg-gray-700 text-gray-400'}`}>📖 問題集</button>
                </div>
              </div>
              <div className="mb-6">
                <label htmlFor="name" className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-widest">名前</label>
                <input type="text" name="name" id="name" required autoFocus className="bg-gray-700 border border-gray-600 text-white block w-full rounded-lg p-3 focus:ring-2 focus:ring-blue-500 outline-none"/>
              </div>
              {itemType === 'workbook' && (
                <div className="mb-8">
                  <label htmlFor="description" className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-widest">説明（任意）</label>
                  <textarea name="description" id="description" rows={3} className="bg-gray-700 border border-gray-600 text-white block w-full rounded-lg p-3 focus:ring-2 focus:ring-blue-500 outline-none"></textarea>
                </div>
              )}
              <div className="flex gap-4">
                <button type="button" onClick={() => setIsOpen(false)} className="flex-1 bg-gray-700 text-white font-bold py-3 rounded-lg hover:bg-gray-600 transition">キャンセル</button>
                <button type="submit" className="flex-1 bg-green-600 text-white font-bold py-3 rounded-lg hover:bg-green-500 transition shadow-lg shadow-green-900/20">作成 (Enter)</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}