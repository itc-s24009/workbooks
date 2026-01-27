'use server'

import { auth } from "@/auth"
import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export type ActionResult = { success: boolean; message: string; }

const LIMIT = 2000; // 問題文・答えの文字数制限

export async function createCard(formData: FormData): Promise<ActionResult> {
  const workbookId = formData.get('workbookId') as string;
  const question = (formData.get('question') as string || "").trim();
  const answer = (formData.get('answer') as string || "").trim();

  if (!workbookId || !question || !answer) return { success: false, message: "空欄があります" };
  if (question.length > LIMIT) return { success: false, message: `問題文が長すぎます（${LIMIT}文字まで）` };
  if (answer.length > LIMIT) return { success: false, message: `答えが長すぎます（${LIMIT}文字まで）` };

  try {
    await prisma.card.create({ data: { workbookId, question, answer } });
    revalidatePath(`/workbook/${workbookId}`);
    return { success: true, message: "追加しました" };
  } catch (e) { return { success: false, message: "失敗" }; }
}

export async function updateCard(cardId: string, workbookId: string, data: { question: string; answer: string }): Promise<ActionResult> {
  const q = data.question.trim();
  const a = data.answer.trim();
  if (!q || !a) return { success: false, message: "空欄不可" };
  if (q.length > LIMIT || a.length > LIMIT) return { success: false, message: `文字数制限超過（${LIMIT}文字まで）` };

  try {
    await prisma.card.update({ where: { id: cardId }, data: { question: q, answer: a } });
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