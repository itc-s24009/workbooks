'use client';

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { updateItem, deleteItem, moveItem, getDirectoryChoices } from "@/actions/creations";
import { shareWorkbook } from "@/actions/shareActions";

type Item = { id: string; name: string; description?: string | null; type: 'directory' | 'workbook'; parentId?: string | null };

const FolderIcon = () => <span className="text-xl text-yellow-500">📁</span>;
const WorkbookIcon = () => <span className="text-xl text-blue-400">📖</span>;

// MoveModal, ShareModal は変更がないため省略（そのままでOK）
// 下記ItemRow内の「メニュー位置」を修正しました

// --- MoveModal, ShareModal は既存コードのまま ---
function ShareModal({ item, onClose }: { item: Item, onClose: () => void }) {
  const [email, setEmail] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const handleShare = async (e: React.FormEvent) => {
    e.preventDefault(); if (isProcessing) return;
    setIsProcessing(true);
    const res = await shareWorkbook(item.id, email);
    alert(res.message);
    if (res.success) onClose();
    setIsProcessing(false);
  };
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[200] p-4 text-left">
      <form onSubmit={handleShare} className="bg-gray-800 border border-gray-700 rounded-3xl w-full max-w-sm shadow-2xl p-8 flex flex-col">
        <h3 className="text-white font-black text-xl mb-2 text-center">シェア機能</h3>
        <p className="text-center text-xs text-gray-500 mb-6 font-mono truncate">{item.name}</p>
        <div className="mb-6">
          <label className="text-xs font-bold text-gray-500 uppercase tracking-widest block mb-2">宛先メールアドレス</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus className="w-full bg-gray-900 border border-gray-700 rounded-xl p-3 text-white outline-none focus:ring-2 focus:ring-blue-600 transition" />
        </div>
        <div className="flex gap-4">
          <button type="button" onClick={onClose} className="flex-1 bg-gray-700 text-gray-300 font-bold py-3 rounded-xl hover:bg-gray-600">中止</button>
          <button type="submit" disabled={isProcessing} className="flex-1 bg-blue-600 text-white font-black py-3 rounded-xl hover:bg-blue-500 transition disabled:opacity-50">{isProcessing ? "送信中..." : "送る"}</button>
        </div>
      </form>
    </div>
  );
}

function MoveModal({ item, onClose }: { item: Item, onClose: () => void }) {
  const [currentPath, setCurrentPath] = useState<string | null>(null);
  const [dirStack, setDirStack] = useState<{id: string, name: string}[]>([]);
  const [dirs, setDirs] = useState<{id: string, name: string}[]>([]);
  const [loading, setLoading] = useState(true);
  const fetchDirs = async (pid: string | null) => {
    setLoading(true); setDirs(await getDirectoryChoices(pid)); setLoading(false);
  };
  useEffect(() => { fetchDirs(currentPath); }, [currentPath]);
  const handleMove = async () => {
    if (item.type === 'directory' && item.id === currentPath) return alert("自分の中には移動できません");
    const res = await moveItem(item.id, item.type, currentPath);
    if (res.success) onClose(); else alert(res.message);
  };
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[150] p-4">
      <div className="bg-gray-800 border border-gray-700 rounded-3xl w-full max-w-md flex flex-col h-[70vh] shadow-2xl">
        <div className="p-6 border-b border-gray-700">
          <h3 className="font-black text-white text-xl">移動先を選択</h3>
          <p className="text-gray-400 text-sm mt-1 truncate">Target: {item.name}</p>
          <div className="text-[10px] text-gray-500 mt-2 font-mono flex gap-1 items-center bg-black/30 p-2 rounded overflow-x-auto whitespace-nowrap">Home {dirStack.map(s => <span key={s.id}>/ {s.name}</span>)}</div>
        </div>
        <div className="flex-grow overflow-y-auto p-4 space-y-1 bg-gray-900/50">
          {currentPath !== null && <button onClick={() => { const s = [...dirStack]; s.pop(); setDirStack(s); setCurrentPath(s.length ? s[s.length-1].id : null); }} className="w-full text-left p-4 hover:bg-gray-700 rounded-xl text-blue-400 font-bold transition">⇠ 親フォルダへ</button>}
          {loading ? <p className="p-10 text-center text-gray-500 animate-pulse">Loading...</p> : dirs.filter(d => d.id !== item.id).map(d => (
            <button key={d.id} onClick={() => { setDirStack([...dirStack, d]); setCurrentPath(d.id); }} className="w-full text-left p-4 hover:bg-gray-700 rounded-xl flex items-center gap-3"><FolderIcon /><span className="text-gray-200">{d.name}</span></button>
          ))}
        </div>
        <div className="p-6 bg-gray-800 border-t border-gray-700 grid grid-cols-2 gap-4">
          <button onClick={onClose} className="py-4 rounded-xl bg-gray-700 text-gray-300 font-bold">やめる</button>
          <button onClick={handleMove} className="py-4 rounded-xl bg-blue-600 text-white font-black hover:bg-blue-500">ここに移動</button>
        </div>
      </div>
    </div>
  );
}

// ----- 行コンポーネント (修正メイン) -----
function ItemRow({ item }: { item: Item }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isMoving, setIsMoving] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [newName, setNewName] = useState(item.name);
  const [newDesc, setNewDesc] = useState(item.description || '');
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const clickOut = (e: MouseEvent) => { if (menuRef.current && !menuRef.current.contains(e.target as Node)) setIsMenuOpen(false); };
    document.addEventListener("mousedown", clickOut);
    return () => document.removeEventListener("mousedown", clickOut);
  }, []);

  return (
    <div className="flex items-center justify-between border border-gray-700 bg-gray-800 p-4 rounded-xl shadow-sm hover:bg-gray-750 transition-all text-white group relative">
      <Link href={item.type === 'directory' ? `/directory/${item.id}` : `/workbook/${item.id}`} className="flex-grow flex items-center gap-4 min-w-0 pr-4">
        <div className="flex-shrink-0">{item.type === 'directory' ? <FolderIcon /> : <WorkbookIcon />}</div>
        <div className="min-w-0">
          <p className="font-semibold group-hover:text-blue-400 transition truncate">{item.name}</p>
          {item.description && <p className="text-[10px] text-gray-500 truncate max-w-full">{item.description}</p>}
        </div>
      </Link>
      
      {/* --- メニュー --- */}
      {/* 修正：親divに onMouseLeave をつけることで、ボタン〜メニュー間の移動中に消えないようにする */}
      <div className="relative flex-shrink-0" ref={menuRef} onMouseLeave={() => setIsMenuOpen(false)}>
        <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2 rounded-full hover:bg-gray-700 transition">
           <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01" /></svg>
        </button>

        {isMenuOpen && (
          // 修正：top-8 (約32px) だとボタン高さ(40px程度)に食い込み、隙間が物理的になくなります。
          // かつ、z-indexを高くして手前に表示させます。
          <div className="absolute right-0 top-7 w-40 bg-gray-800 border border-gray-600 rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
            <button onClick={() => { setIsEditing(true); setIsMenuOpen(false); }} className="block w-full text-left px-4 py-3 text-sm hover:bg-gray-700 transition">編集</button>
            <button onClick={() => { setIsMoving(true); setIsMenuOpen(false); }} className="block w-full text-left px-4 py-3 text-sm hover:bg-gray-700 transition border-t border-gray-700 text-blue-400">移動</button>
            {item.type === 'workbook' && (
              <button onClick={() => { setIsSharing(true); setIsMenuOpen(false); }} className="block w-full text-left px-4 py-3 text-sm hover:bg-gray-700 transition border-t border-gray-700 text-green-400">シェア</button>
            )}
            <button onClick={() => { setIsDeleting(true); setIsMenuOpen(false); }} className="block w-full text-left px-4 py-3 text-sm hover:bg-gray-700 transition border-t border-gray-700 text-red-500">削除</button>
          </div>
        )}
      </div>

      {/* --- モーダル: maxLength制限を追加 --- */}
      {isEditing && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[200] px-4">
          <form onSubmit={async (e) => { e.preventDefault(); const res = await updateItem(item.id, item.type, { name: newName, description: newDesc }); if(res.success) setIsEditing(false); else alert(res.message); }} className="bg-gray-800 border border-gray-700 p-8 rounded-3xl w-full max-w-sm">
            <h3 className="text-white text-center font-black mb-6 uppercase tracking-widest text-sm border-b border-gray-700 pb-2">編集</h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-gray-500 font-bold block mb-1">名前 (Max 50)</label>
                <input value={newName} onChange={e => setNewName(e.target.value)} maxLength={50} autoFocus className="bg-gray-900 border border-gray-700 w-full p-4 rounded-xl text-white outline-none focus:ring-2 focus:ring-blue-500 transition"/>
              </div>
              {item.type === 'workbook' && (
                <div>
                  <label className="text-xs text-gray-500 font-bold block mb-1">説明 (Max 300)</label>
                  <textarea value={newDesc} onChange={e => setNewDesc(e.target.value)} maxLength={300} rows={3} className="bg-gray-900 border border-gray-700 w-full p-4 rounded-xl text-white outline-none focus:ring-2 focus:ring-blue-500 resize-none transition" />
                </div>
              )}
            </div>
            <div className="flex justify-end gap-3 mt-8">
              <button type="button" onClick={() => setIsEditing(false)} className="px-6 py-2 bg-gray-700 text-gray-300 rounded-xl hover:bg-gray-600 transition">中止</button>
              <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-500 transition">更新</button>
            </div>
          </form>
        </div>
      )}

      {isMoving && <MoveModal item={item} onClose={() => setIsMoving(false)} />}
      {isSharing && <ShareModal item={item} onClose={() => setIsSharing(false)} />}
      {isDeleting && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[200] p-4 text-center">
          <div className="bg-gray-800 border border-gray-700 p-10 rounded-3xl max-w-sm w-full">
             <div className="text-red-500 text-3xl mb-4 italic font-black">WARNING</div>
             <p className="text-gray-400 text-sm mb-8 leading-relaxed font-medium">「{item.name}」を削除しますか？<br/>この操作は元に戻せません。</p>
             <button onClick={async () => await deleteItem(item.id, item.type)} className="bg-red-600 hover:bg-red-500 text-white font-black px-10 py-3 rounded-2xl w-full transition shadow-xl mb-4">削除</button>
             <button onClick={() => setIsDeleting(false)} className="text-gray-500 text-xs w-full hover:underline font-bold uppercase tracking-widest">キャンセル</button>
          </div>
        </div>
      )}
    </div>
  );
}

export function ItemList({ directories, workbooks }: { directories: Item[], workbooks: Item[] }) {
  const allItems = [...directories, ...workbooks].sort((a,b) => a.name.localeCompare(b.name, 'ja'));
  return (
    <div className="space-y-3 max-w-4xl mx-auto pb-20 mt-8 px-2">
      {allItems.map(item => ( <ItemRow key={`${item.type}-${item.id}`} item={item} /> ))}
      {allItems.length === 0 && <p className="text-gray-500 text-center py-20 italic">アイテムはありません</p>}
    </div>
  );
}