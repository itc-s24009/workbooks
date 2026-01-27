'use server'

import { auth } from "@/auth"
import prisma from "@/lib/prisma"

export async function shareWorkbook(workbookId: string, receiverEmail: string) {
  const session = await auth();
  if (!session?.user?.email) return { success: false, message: "ログインしてください" };

  // 1. 自分自身の取得
  const sender = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!sender) return { success: false, message: "送信者エラー" };

  // 2. 送り先の取得
  const receiver = await prisma.user.findUnique({ where: { email: receiverEmail } });
  if (!receiver) return { success: false, message: "指定されたメールアドレスのユーザーは見つかりません" };

  if (sender.id === receiver.id) return { success: false, message: "自分自身にシェアすることはできません（コピー機能などを利用してください）" };

  // 3. 送る問題集の実データを取得（中身のカードも一緒に）
  const sourceWorkbook = await prisma.workbook.findUnique({ 
    where: { id: workbookId },
    include: { cards: true }
  });
  if (!sourceWorkbook) return { success: false, message: "送る問題集が見つかりません" };

  try {
    // 4. 相手の「シェアされたアイテム」フォルダを探す（なければ作る）
    let shareDir = await prisma.directory.findFirst({
      where: { userId: receiver.id, name: "シェアされたアイテム", parentId: null }
    });

    if (!shareDir) {
      shareDir = await prisma.directory.create({
        data: { name: "シェアされたアイテム", userId: receiver.id }
      });
    }

    // 5. 名前重複チェック（相手のシェアフォルダ内に同名がないか）
    const existing = await prisma.workbook.findFirst({
      where: {
        userId: receiver.id,
        parentId: shareDir.id,
        name: sourceWorkbook.name
      }
    });

    if (existing) {
      return { 
        success: false, 
        message: `相手のシェアBOXに既に「${sourceWorkbook.name}」が存在します。名前を変更してから送ってください。` 
      };
    }

    // 6. コピー作成実行（重要：所有者をreceiverにする）
    // Prismaのトランザクションで問題集とカードを一気に作る
    await prisma.$transaction(async (tx) => {
      // まず問題集のガワを作る
      const newWorkbook = await tx.workbook.create({
        data: {
          name: sourceWorkbook.name,
          description: sourceWorkbook.description ? `${sourceWorkbook.description} (Shared from ${sender.name})` : `Shared from ${sender.name}`,
          userId: receiver.id,      // ← ここで所有権を相手にする！
          parentId: shareDir.id,    // ← シェア用フォルダに入れる
        }
      });

      // 中身のカードを複製する
      if (sourceWorkbook.cards.length > 0) {
        await tx.card.createMany({
          data: sourceWorkbook.cards.map(card => ({
            workbookId: newWorkbook.id,
            question: card.question,
            answer: card.answer
          }))
        });
      }
    });

    return { success: true, message: "送信完了！データのコピーを相手にプレゼントしました。" };

  } catch (e) {
    console.error(e);
    return { success: false, message: "送信処理中にエラーが発生しました" };
  }
}