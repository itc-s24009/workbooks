'use server'

import { auth } from "@/auth"
import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export type ActionResult = { success: boolean; message: string; }

export async function createCard(formData: FormData): Promise<ActionResult> {
  const workbookId = formData.get('workbookId') as string;
  const question = formData.get('question') as string;
  const answer = formData.get('answer') as string;

  if (!workbookId || !question || !answer) return { success: false, message: "空欄があります" };

  try {
    await prisma.card.create({
      data: { workbookId, question, answer }
    });
    revalidatePath(`/workbook/${workbookId}`);
    return { success: true, message: "カードを追加しました" };
  } catch (e) { 
    return { success: false, message: "作成に失敗しました" }; 
  }
}

export async function updateCard(cardId: string, workbookId: string, data: { question: string; answer: string }): Promise<ActionResult> {
  try {
    await prisma.card.update({
      where: { id: cardId },
      data: { question: data.question, answer: data.answer }
    });
    revalidatePath(`/workbook/${workbookId}`);
    return { success: true, message: "更新しました" };
  } catch (e) { return { success: false, message: "失敗" }; }
}

export async function deleteCard(cardId: string, workbookId: string): Promise<ActionResult> {
  try {
    await prisma.card.delete({ where: { id: cardId } });
    revalidatePath(`/workbook/${workbookId}`);
    return { success: true, message: "削除しました" };
  } catch (e) { return { success: false, message: "失敗" }; }
}