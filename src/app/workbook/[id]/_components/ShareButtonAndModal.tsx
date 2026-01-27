'use client';

import { useState } from "react";
import { shareWorkbook } from "@/actions/shareActions";

export function ShareButtonAndModal({ workbookId }: { workbookId: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const handleShare = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isProcessing) return;

    setIsProcessing(true);
    const res = await shareWorkbook(workbookId, email);
    alert(res.message);
    if (res.success) {
      setIsOpen(false);
      setEmail("");
    }
    setIsProcessing(false);
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="bg-gray-800 border border-gray-700 py-6 rounded-xl font-bold text-gray-400 hover:text-white hover:bg-gray-700 transition text-center shadow-md"
      >
        シェア ✉️
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[200] p-4 text-left">
          <form onSubmit={handleShare} className="bg-gray-800 border border-gray-700 p-8 rounded-3xl w-full max-w-sm shadow-2xl">
            <h3 className="text-white font-black text-xl mb-6 text-center">この学習帳をシェア</h3>
            <div className="mb-6">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-widest block mb-2">相手のメールアドレス</label>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@mail.com"
                required
                autoFocus
                className="w-full bg-gray-900 border border-gray-700 rounded-xl p-3 text-white outline-none focus:ring-2 focus:ring-blue-600 transition"
              />
            </div>
            <div className="flex gap-4 mt-8">
              <button type="button" onClick={() => setIsOpen(false)} className="flex-1 bg-gray-700 text-gray-300 font-bold py-3 rounded-xl">中止</button>
              <button 
                type="submit" 
                disabled={isProcessing}
                className="flex-1 bg-blue-600 text-white font-black py-3 rounded-xl disabled:opacity-50"
              >
                {isProcessing ? "送信中..." : "シェア(Enter)"}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}