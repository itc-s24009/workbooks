'use server'

import { auth } from "@/auth"
import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export type ActionResult = { success: boolean; message: string; }

export async function createItem(formData: FormData): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.email) return { success: false, message: "ログインしてください。" };
  const user = await prisma.user.findUnique({ where: { email: session.user.email }});
  if (!user) return { success: false, message: "ユーザー不明" };

  const name = formData.get('name') as string;
  const type = formData.get('type') as 'directory' | 'workbook';
  const description = formData.get('description') as string | null;
  const parentId = formData.get('parentId') as string | null; // 親IDを取得

  try {
    if (type === 'directory') {
      await prisma.directory.create({ data: { name, userId: user.id, parentId: parentId || null }});
    } else {
      await prisma.workbook.create({ data: { name, description, userId: user.id, parentId: parentId || null }});
    }
    revalidatePath("/home");
    if (parentId) revalidatePath(`/directory/${parentId}`);
    return { success: true, message: "作成成功" };
  } catch (e) { return { success: false, message: "失敗" }; }
}

export async function updateItem(itemId: string, itemType: 'directory' | 'workbook', newData: { name: string; description?: string }): Promise<ActionResult> {
  try {
    if (itemType === 'directory') {
      await prisma.directory.update({ where: { id: itemId }, data: { name: newData.name }});
    } else {
      await prisma.workbook.update({ where: { id: itemId }, data: { name: newData.name, description: newData.description }});
    }
    revalidatePath("/home");
    revalidatePath(`/directory`); 
    return { success: true, message: "更新完了" };
  } catch (e) { return { success: false, message: "失敗" }; }
}

export async function deleteItem(itemId: string, itemType: 'directory' | 'workbook'): Promise<ActionResult> {
  try {
    if (itemType === 'directory') { await prisma.directory.delete({ where: { id: itemId }}); }
    else { await prisma.workbook.delete({ where: { id: itemId }}); }
    revalidatePath("/home");
    return { success: true, message: "削除完了" };
  } catch (e) { return { success: false, message: "失敗" }; }
}