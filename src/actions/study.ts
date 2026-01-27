'use server'

import { auth } from "@/auth"
import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"

// 学習セッションの保存
export async function saveStudySession(data: {
  workbookId: string;
  accuracyRate: number;
  results: { cardId: string; isCorrect: boolean }[];
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

// ▼ ここから新規追加：特定の問題の履歴を取得する機能 ▼
export async function getCardHistory(cardId: string) {
  const session = await auth();
  if (!session?.user) return { success: false, history: [] };

  try {
    // このカードに関する過去の正誤記録を全て取得
    const records = await prisma.studyRecord.findMany({
      where: { cardId: cardId },
      include: {
        session: { select: { createdAt: true } } // 学習日を知るために親を繋ぐ
      },
      orderBy: { createdAt: 'desc' } // 新しい順
    });

    // 正答率の計算
    const correctCount = records.filter(r => r.isCorrect).length;
    const totalCount = records.length;
    const accuracy = totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : 0;

    // 表示用に整形して返す
    const history = records.map(r => ({
      id: r.id,
      isCorrect: r.isCorrect,
      date: new Date(r.session.createdAt).toLocaleString('ja-JP', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      })
    }));

    return { success: true, history, accuracy };
  } catch (e) {
    return { success: false, history: [], accuracy: 0 };
  }
}