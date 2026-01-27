'use client';

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { updateItem, deleteItem, moveItem, getDirectoryChoices } from "@/actions/creations";

type Item = { id: string; name: string; description?: string | null; type: 'directory' | 'workbook'; parentId?: string | null };

const FolderIcon = () => <span className="text-xl text-yellow-500">📁</span>;
const WorkbookIcon = () => <span className="text-xl text-blue-400">📖</span>;

// ----- 移動先を選択するためのポップアップ -----
function MoveModal({ item, onClose }: { item: Item, onClose: () => void }) {
  const [currentPath, setCurrentPath] = useState<string | null>(null);
  const [dirStack, setDirStack] = useState<{id: string, name: string}[]>([]);
  const [dirs, setDirs] = useState<{id: string, name: string}[]>([]);
  const [loading, setLoading] = useState(true);

  // 指定したフォルダ内の子フォルダを取得
  const fetchDirs = async (pid: string | null) => {
    setLoading(true);
    const data = await getDirectoryChoices(pid);
    setDirs(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchDirs(currentPath);
  }, [currentPath]);

  const enterDir = (id: string, name: string) => {
    setDirStack([...dirStack, { id, name }]);
    setCurrentPath(id);
  };

  const goBack = () => {
    const newStack = [...dirStack];
    newStack.pop();
    setDirStack(newStack);
    setCurrentPath(newStack.length > 0 ? newStack[newStack.length - 1].id : null);
  };

  const handleMoveExecute = async () => {
    // 自身（フォルダの場合）と同じ場所に移動するのを防止
    if (item.type === 'directory' && item.id === currentPath) {
      alert("自分自身の中に移動することはできません。");
      return;
    }
    const res = await moveItem(item.id, item.type, currentPath);
    if (res.success) {
      onClose();
    } else {
      alert(res.message);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[150] p-4">
      <div className="bg-gray-800 border border-gray-700 rounded-3xl w-full max-w-md flex flex-col h-[70vh] shadow-2xl">
        <div className="p-6 border-b border-gray-700">
          <h3 className="font-black text-white text-xl">移動先を選択</h3>
          <p className="text-gray-400 text-sm mt-1">
            <span className="font-bold text-blue-500">Target:</span> {item.name}
          </p>
          <div className="text-[10px] text-gray-500 mt-2 font-mono flex gap-1 items-center bg-black/30 p-2 rounded">
             Home {dirStack.map(s => <span key={s.id}>/ {s.name}</span>)}
          </div>
        </div>

        {/* フォルダ一覧エリア */}
        <div className="flex-grow overflow-y-auto p-4 space-y-1 bg-gray-900/50">
          {currentPath !== null && (
            <button 
              onClick={goBack}
              className="w-full text-left p-4 hover:bg-gray-700 rounded-xl text-blue-400 font-bold transition flex items-center gap-2"
            >
              <span>⇠</span> 親フォルダに戻る
            </button>
          )}

          {loading ? (
            <p className="p-10 text-center text-gray-500 animate-pulse">読み込み中...</p>
          ) : (
            <>
              {dirs.filter(d => d.id !== item.id).map(d => (
                <button 
                  key={d.id} 
                  onClick={() => enterDir(d.id, d.name)} 
                  className="w-full text-left p-4 hover:bg-gray-700 rounded-xl flex items-center gap-3 transition group"
                >
                  <FolderIcon />
                  <span className="text-gray-200 font-medium group-hover:text-white">{d.name}</span>
                </button>
              ))}
              {!loading && dirs.length === 0 && <p className="p-10 text-center text-gray-600 text-sm">フォルダがありません</p>}
            </>
          )}
        </div>

        {/* 実行ボタンエリア */}
        <div className="p-6 bg-gray-800 border-t border-gray-700 grid grid-cols-2 gap-4">
          <button 
            onClick={onClose} 
            className="py-4 rounded-xl bg-gray-700 text-gray-300 font-bold hover:bg-gray-600 transition"
          >
            やめる
          </button>
          <button 
            onClick={handleMoveExecute}
            className="py-4 rounded-xl bg-blue-600 text-white font-black hover:bg-blue-500 transition shadow-lg shadow-blue-900/20"
          >
            ここに移動 (Enter)
          </button>
        </div>
      </div>
    </div>
  );
}

// ----- 各アイテムの行表示 -----
function ItemRow({ item }: { item: Item }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isMoving, setIsMoving] = useState(false);
  
  const [newName, setNewName] = useState(item.name);
  const [newDesc, setNewDesc] = useState(item.description || '');
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const clickOut = (e: MouseEvent) => { if (menuRef.current && !menuRef.current.contains(e.target as Node)) setIsMenuOpen(false); };
    document.addEventListener("mousedown", clickOut);
    return () => document.removeEventListener("mousedown", clickOut);
  }, []);

  return (
    <div className="flex items-center justify-between border border-gray-700 bg-gray-800 p-4 rounded-xl shadow-sm hover:bg-gray-750 transition-all text-white">
      <Link 
        href={item.type === 'directory' ? `/directory/${item.id}` : `/workbook/${item.id}`} 
        className="flex-grow flex items-center gap-4 group"
      >
        {item.type === 'directory' ? <FolderIcon /> : <WorkbookIcon />}
        <div className="overflow-hidden">
          <p className="font-semibold group-hover:text-blue-400 transition">{item.name}</p>
          {item.description && <p className="text-[10px] text-gray-500 truncate max-w-[250px]">{item.description}</p>}
        </div>
      </Link>
      
      {/* 三点リーダー */}
      <div className="relative" ref={menuRef} onMouseLeave={() => setIsMenuOpen(false)}>
        <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2 rounded-full hover:bg-gray-700 transition">
           <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01" /></svg>
        </button>

        {isMenuOpen && (
          <div className="absolute right-0 top-10 w-40 bg-gray-800 border border-gray-600 rounded-xl shadow-2xl z-30 overflow-hidden">
            <button onClick={() => { setIsEditing(true); setIsMenuOpen(false); }} className="block w-full text-left px-4 py-3 text-sm hover:bg-gray-700">名前の変更</button>
            {/* 移動ボタンを真ん中に追加 */}
            <button onClick={() => { setIsMoving(true); setIsMenuOpen(false); }} className="block w-full text-left px-4 py-3 text-sm text-blue-400 hover:bg-gray-700 border-t border-b border-gray-700">アイテムの移動</button>
            <button onClick={() => { setIsDeleting(true); setIsMenuOpen(false); }} className="block w-full text-left px-4 py-3 text-sm text-red-500 hover:bg-gray-700">データの削除</button>
          </div>
        )}
      </div>

      {/* --- モーダル集 --- */}
      {isEditing && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[200]">
          <form 
            onSubmit={async (e) => { e.preventDefault(); await updateItem(item.id, item.type, { name: newName, description: newDesc }); setIsEditing(false); }} 
            className="bg-gray-800 border border-gray-700 p-8 rounded-3xl w-full max-w-sm"
          >
            <h3 className="text-white text-center font-black mb-6 uppercase tracking-widest text-sm border-b border-gray-700 pb-2">編集</h3>
            <div className="space-y-4">
              <input value={newName} onChange={e => setNewName(e.target.value)} autoFocus className="bg-gray-900 border border-gray-700 w-full p-4 rounded-xl text-white outline-none focus:ring-2 focus:ring-blue-500 transition"/>
              {item.type === 'workbook' && <textarea value={newDesc} onChange={e => setNewDesc(e.target.value)} rows={3} className="bg-gray-900 border border-gray-700 w-full p-4 rounded-xl text-white outline-none" />}
            </div>
            <div className="flex justify-end gap-3 mt-8">
              <button type="button" onClick={() => setIsEditing(false)} className="px-6 py-2 bg-gray-700 text-gray-400 rounded-xl">中止</button>
              <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-xl font-bold">更新する</button>
            </div>
          </form>
        </div>
      )}

      {isMoving && <MoveModal item={item} onClose={() => setIsMoving(false)} />}

      {isDeleting && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[200] p-4 text-center">
          <div className="bg-gray-800 border border-gray-700 p-10 rounded-3xl max-w-sm w-full">
             <div className="text-red-500 text-3xl mb-4 italic font-black">WARNING</div>
             <p className="text-gray-400 text-sm mb-8 leading-relaxed">「{item.name}」に関連する全データが削除されます。よろしいですか？</p>
             <button onClick={async () => await deleteItem(item.id, item.type)} className="bg-red-600 hover:bg-red-500 text-white font-black px-10 py-3 rounded-2xl w-full transition shadow-xl">今すぐ削除する</button>
             <button onClick={() => setIsDeleting(false)} className="text-gray-500 text-xs mt-6 block w-full hover:underline font-bold tracking-widest uppercase">やっぱりやめる</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ----- 全体リストコンポーネント -----
export function ItemList({ directories, workbooks }: { directories: Item[], workbooks: Item[] }) {
  const allItems = [...directories, ...workbooks].sort((a,b) => a.name.localeCompare(b.name, 'ja'));

  return (
    <div className="space-y-3 max-w-4xl mx-auto pb-20 mt-8 px-4">
      {allItems.map(item => (
        <ItemRow key={`${item.type}-${item.id}`} item={item} />
      ))}
      {allItems.length === 0 && <p className="text-gray-500 text-center py-20 italic">アイテムはありません</p>}
    </div>
  );
}