'use client';

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { updateItem, deleteItem } from "@/actions/creations";

type Item = { id: string; name: string; description?: string | null; type: 'directory' | 'workbook' };

const FolderIcon = () => <span>📁</span>;
const WorkbookIcon = () => <span>📖</span>;

function ItemRow({ item }: { item: Item }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [newName, setNewName] = useState(item.name);
  const [newDescription, setNewDescription] = useState(item.description || '');
  const menuRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) setIsMenuOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuRef]);
  
  const handleUpdate = async () => {
    const result = await updateItem(item.id, item.type, { name: newName, description: newDescription });
    alert(result.message);
    if (result.success) setIsEditing(false);
  }
  
  const handleDelete = async () => {
    const result = await deleteItem(item.id, item.type);
    alert(result.message);
    if (result.success) setIsDeleting(false);
  }
  
  return (
    <div className="flex items-center justify-between border border-gray-700 bg-gray-800 p-4 rounded-lg shadow-sm hover:bg-gray-700 transition-colors">
      <Link
        href={item.type === 'directory' ? `/directory/${item.id}` : `/workbook/${item.id}`}
        className="flex-grow flex items-center gap-4 text-white"
      >
        {item.type === 'directory' ? <FolderIcon /> : <WorkbookIcon />}
        <div>
          <p className="font-semibold text-white">{item.name}</p>
          {item.description && <p className="text-sm text-gray-400">{item.description}</p>}
        </div>
      </Link>
      
      {/* ▼ ▼ ▼ ▼ ▼ ▼ ▼ ▼ ▼ ▼ CSSの位置調整を追加 ▼ ▼ ▼ ▼ ▼ ▼ ▼ ▼ ▼ ▼ */}
      <div className="relative" ref={menuRef}>
        {/* ボタンをクリックでメニューの表示/非表示を切り替え */}
        <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2 rounded-full hover:bg-gray-600">
           <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01" /></svg>
        </button>
        {isMenuOpen && (
          // `top-8`を追加して、メニューがボタンに少し重なるように位置を調整
          // これでマウスが離れたと判定されにくくなります
          <div className="absolute right-0 top-8 w-48 bg-gray-700 border border-gray-600 rounded-md shadow-lg z-10">
            <button onClick={() => { setIsEditing(true); setIsMenuOpen(false); }} className="block w-full text-left px-4 py-2 text-sm text-gray-200 hover:bg-gray-600">編集</button>
            <button onClick={() => { setIsDeleting(true); setIsMenuOpen(false); }} className="block w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-gray-600">削除</button>
          </div>
        )}
      </div>
      {/* ▲ ▲ ▲ ▲ ▲ ▲ ▲ ▲ ▲ ▲ 修正ここまで ▲ ▲ ▲ ▲ ▲ ▲ ▲ ▲ ▲ ▲ */}

      {/* 編集用モーダル */}
      {isEditing && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 w-full max-w-sm">
            <h3 className="font-bold text-lg text-white mb-4">編集</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300">名前</label>
                <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)} className="bg-gray-700 border border-gray-600 text-white p-2 w-full rounded" />
              </div>
              {item.type === 'workbook' && (
                <div>
                   <label className="block text-sm font-medium text-gray-300">説明</label>
                  <textarea value={newDescription} onChange={(e) => setNewDescription(e.target.value)} rows={3} className="bg-gray-700 border border-gray-600 text-white p-2 w-full rounded"></textarea>
                </div>
              )}
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button onClick={() => setIsEditing(false)} className="bg-gray-600 text-white px-4 py-2 rounded">キャンセル</button>
              <button onClick={handleUpdate} className="bg-blue-600 text-white px-4 py-2 rounded">保存</button>
            </div>
          </div>
        </div>
      )}
      
      {/* 削除確認モーダル */}
      {isDeleting && (
         <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 w-full max-w-sm text-center">
            <h3 className="font-bold text-lg text-white">本当に削除しますか？</h3>
            <p className="text-gray-400 my-4">「{item.name}」を削除すると元に戻せません。</p>
            <div className="flex justify-center gap-4">
              <button onClick={() => setIsDeleting(false)} className="bg-gray-600 text-white px-4 py-2 rounded">キャンセル</button>
              <button onClick={handleDelete} className="bg-red-600 text-white px-4 py-2 rounded">削除する</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ItemList全体のコンポーネント (変更なし)
export function ItemList({ directories, workbooks }: { directories: Item[], workbooks: Item[] }) {
  const allItems = [ ...directories, ...workbooks ].sort((a,b) => a.name.localeCompare(b.name, 'ja'));
  return (
     <div className="space-y-4">
      {allItems.length === 0 ? (
        <p className="text-gray-500">まだアイテムがありません。「+ 新規作成」ボタンから作成しましょう！</p>
      ) : (
        allItems.map(item => <ItemRow key={`${item.type}-${item.id}`} item={item} />)
      )}
     </div>
  );
}