'use server'

import { auth } from "@/auth"
import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function saveStudySession(data: {
  workbookId: string;
  accuracyRate: number;
  // question と answer を追加で受け取る
  results: { cardId: string; isCorrect: boolean; question: string; answer: string }[];
}) {
  const session = await auth();
  if (!session?.user?.email) return { success: false };
  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return { success: false };

  try {
    await prisma.studySession.create({
      data: {
        userId: user.id,
        workbookId: data.workbookId,
        accuracyRate: data.accuracyRate,
        records: {
          create: data.results.map(r => ({
            cardId: r.cardId,
            isCorrect: r.isCorrect,
            question: r.question, // ★解いた時の文字を保存
            answer: r.answer      // ★解いた時の文字を保存
          }))
        }
      }
    });
    revalidatePath(`/workbook/${data.workbookId}`);
    return { success: true };
  } catch (e) {
    return { success: false };
  }
}

// 履歴取得アクション（変更なし：Cardが存在する場合のみAnalyticsが見れます）
export async function getCardHistory(cardId: string) {
  const session = await auth();
  if (!session?.user) return { success: false, history: [] };
  try {
    const records = await prisma.studyRecord.findMany({
      where: { cardId: cardId },
      include: { session: { select: { createdAt: true } } },
      orderBy: { createdAt: 'desc' }
    });
    const correctCount = records.filter(r => r.isCorrect).length;
    const accuracy = records.length > 0 ? Math.round((correctCount / records.length) * 100) : 0;
    const history = records.map(r => ({
      id: r.id, isCorrect: r.isCorrect, date: new Date(r.session.createdAt).toLocaleString('ja-JP')
    }));
    return { success: true, history, accuracy };
  } catch (e) { return { success: false, history: [], accuracy: 0 }; }
}