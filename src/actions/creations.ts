'use server'

import { auth } from "@/auth"
import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export type ActionResult = { success: boolean; message: string; }

// バリデーション用定数
const LIMITS = { NAME: 50, DESC: 300 };

async function checkDuplicateName(userId: string, parentId: string | null, name: string, excludeId?: string): Promise<boolean> {
  const whereDir: any = { userId, parentId, name };
  const whereWb: any = { userId, parentId, name };
  if (excludeId) { whereDir.id = { not: excludeId }; whereWb.id = { not: excludeId }; }
  const [d, w] = await Promise.all([
    prisma.directory.findFirst({ where: whereDir }),
    prisma.workbook.findFirst({ where: whereWb })
  ]);
  return !!(d || w);
}

// 1. 作成
export async function createItem(formData: FormData): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.email) return { success: false, message: "ログインしてください" };
  const user = await prisma.user.findUnique({ where: { email: session.user.email }});
  if (!user) return { success: false, message: "ユーザー不明" };

  const name = (formData.get('name') as string || "").trim();
  const type = formData.get('type') as 'directory' | 'workbook';
  const description = (formData.get('description') as string || "").trim();
  const parentId = formData.get('parentId') as string | null; 

  if (!name || !type) return { success: false, message: "名前は必須です" };
  if (name.length > LIMITS.NAME) return { success: false, message: `名前は${LIMITS.NAME}文字以内で入力してください` };
  if (description.length > LIMITS.DESC) return { success: false, message: `説明は${LIMITS.DESC}文字以内で入力してください` };

  const isDuplicate = await checkDuplicateName(user.id, parentId || null, name);
  if (isDuplicate) return { success: false, message: `同じ場所に「${name}」が既に存在します` };
  
  try {
    if (type === 'directory') {
      await prisma.directory.create({ data: { name, userId: user.id, parentId: parentId || null }});
    } else {
      await prisma.workbook.create({ data: { name, description, userId: user.id, parentId: parentId || null }});
    }
    revalidatePath("/home");
    if (parentId) revalidatePath(`/directory/${parentId}`);
    return { success: true, message: "作成しました" };
  } catch (e) { return { success: false, message: "作成失敗" }; }
}

// 2. 編集
export async function updateItem(itemId: string, itemType: 'directory' | 'workbook', newData: { name: string; description?: string }): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.email) return { success: false, message: "ログインしてください" };
  const user = await prisma.user.findUnique({ where: { email: session.user.email }});
  if (!user) return { success: false, message: "ユーザー不明" };

  const name = newData.name.trim();
  const desc = (newData.description || "").trim();

  if (!name) return { success: false, message: "名前は必須です" };
  if (name.length > LIMITS.NAME) return { success: false, message: `名前は${LIMITS.NAME}文字以内です` };
  if (desc.length > LIMITS.DESC) return { success: false, message: `説明は${LIMITS.DESC}文字以内です` };

  let currentItem: { parentId: string | null } | null = null;
  if (itemType === 'directory') {
    currentItem = await prisma.directory.findUnique({ where: { id: itemId }, select: { parentId: true } });
  } else {
    currentItem = await prisma.workbook.findUnique({ where: { id: itemId }, select: { parentId: true } });
  }
  if (!currentItem) return { success: false, message: "対象が見つかりません" };

  const isDuplicate = await checkDuplicateName(user.id, currentItem.parentId, name, itemId);
  if (isDuplicate) return { success: false, message: `名前「${name}」は既に使用されています` };

  try {
    if (itemType === 'directory') {
      await prisma.directory.update({ where: { id: itemId }, data: { name }});
    } else {
      await prisma.workbook.update({ where: { id: itemId }, data: { name, description: desc }});
    }
    revalidatePath("/home");
    revalidatePath(`/directory/${currentItem.parentId || ''}`);
    revalidatePath(`/workbook/${itemId}`); // ヘッダー編集反映用
    return { success: true, message: "更新しました" };
  } catch (e) { return { success: false, message: "更新失敗" }; }
}

// 3. 移動 (変更なしだが短縮版として記載)
export async function moveItem(itemId: string, itemType: 'directory' | 'workbook', newParentId: string | null): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.email) return { success: false, message: "ログイン要" };
  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  
  if (itemType === 'directory' && itemId === newParentId) return { success: false, message: "移動不可" };

  // 移動対象の名前を取得して重複チェック
  let name = "";
  if (itemType === 'directory') {
    const d = await prisma.directory.findUnique({ where: { id: itemId }});
    name = d?.name || "";
  } else {
    const w = await prisma.workbook.findUnique({ where: { id: itemId }});
    name = w?.name || "";
  }
  
  const isDuplicate = await checkDuplicateName(user!.id, newParentId, name, itemId);
  if (isDuplicate) return { success: false, message: `移動先に「${name}」が既に存在します` };

  try {
    const table: any = itemType === 'directory' ? prisma.directory : prisma.workbook;
    await table.update({ where: { id: itemId }, data: { parentId: newParentId } });
    revalidatePath("/home");
    return { success: true, message: "移動しました" };
  } catch (e) { return { success: false, message: "移動失敗" }; }
}

// その他
export async function getDirectoryChoices(parentId: string | null) {
  const session = await auth();
  if (!session?.user?.email) return [];
  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  return prisma.directory.findMany({ where: { userId: user?.id, parentId }, orderBy: { name: 'asc' } });
}

export async function deleteItem(itemId: string, itemType: 'directory' | 'workbook'): Promise<ActionResult> {
  try {
    if (itemType === 'directory') await prisma.directory.delete({ where: { id: itemId }});
    else await prisma.workbook.delete({ where: { id: itemId }});
    revalidatePath("/home");
    return { success: true, message: "削除しました" };
  } catch (e) { return { success: false, message: "失敗" }; }
}