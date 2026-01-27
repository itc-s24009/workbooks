'use server'

import { auth } from "@/auth"
import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function shareWorkbook(workbookId: string, receiverEmail: string) {
  const session = await auth();
  if (!session?.user?.email) return { success: false, message: "ログインしてください" };

  // 1. 自分自身の取得
  const sender = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!sender) return { success: false, message: "送信者エラー" };

  // 2. 送り先の取得
  const receiver = await prisma.user.findUnique({ where: { email: receiverEmail } });
  if (!receiver) return { success: false, message: "指定されたメールアドレスのユーザーは見つかりません" };

  if (sender.id === receiver.id) return { success: false, message: "自分自身にシェアすることはできません" };

  try {
    // 3. 既にシェア済みかチェック
    const existing = await prisma.share.findFirst({
      where: {
        senderId: sender.id,
        receiverId: receiver.id,
        workbookId: workbookId
      }
    });
    if (existing) return { success: false, message: "このユーザーには既にシェア済みです" };

    // 4. シェア実行
    await prisma.share.create({
      data: {
        senderId: sender.id,
        receiverId: receiver.id,
        workbookId: workbookId
      }
    });

    return { success: true, message: "シェアしました！" };
  } catch (e) {
    return { success: false, message: "シェアに失敗しました" };
  }
}