'use server'

import { auth } from "@/auth"
import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export type ActionResult = { success: boolean; message: string; }

// 共通：名前の重複をチェックする関数 (フォルダと問題集を両方確認)
async function checkDuplicateName(userId: string, parentId: string | null, name: string, excludeId?: string): Promise<boolean> {
  const whereDir: any = { userId, parentId, name };
  const whereWb: any = { userId, parentId, name };
  
  if (excludeId) {
    whereDir.id = { not: excludeId };
    whereWb.id = { not: excludeId };
  }

  // ディレクトリとワークブックの両方を探す
  const existingDir = await prisma.directory.findFirst({ where: whereDir });
  const existingWb = await prisma.workbook.findFirst({ where: whereWb });

  return !!(existingDir || existingWb);
}

// ----------------------------------------------------------------

// 1. アイテム作成
export async function createItem(formData: FormData): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.email) return { success: false, message: "ログインしてください。" };
  const user = await prisma.user.findUnique({ where: { email: session.user.email }});
  if (!user) return { success: false, message: "ユーザー情報が見つかりません。" };

  const name = formData.get('name') as string;
  const type = formData.get('type') as 'directory' | 'workbook';
  const description = formData.get('description') as string | null;
  const parentId = formData.get('parentId') as string | null; 

  if (!name || !type) return { success: false, message: "名前と種類は必須です。" };

  // 重複チェック
  const isDuplicate = await checkDuplicateName(user.id, parentId || null, name);
  if (isDuplicate) return { success: false, message: `同じ場所に「${name}」という名前のアイテムが既に存在します。` };
  
  try {
    if (type === 'directory') {
      await prisma.directory.create({ data: { name, userId: user.id, parentId: parentId || null }});
    } else {
      await prisma.workbook.create({ data: { name, description, userId: user.id, parentId: parentId || null }});
    }
    revalidatePath("/home");
    if (parentId) revalidatePath(`/directory/${parentId}`);
    return { success: true, message: "作成しました！" };
  } catch (error) {
    return { success: false, message: "作成に失敗しました。" };
  }
}

// 2. アイテム編集（名前変更など）
export async function updateItem(
  itemId: string,
  itemType: 'directory' | 'workbook',
  newData: { name: string; description?: string }
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.email) return { success: false, message: "ログインしてください。" };
  const user = await prisma.user.findUnique({ where: { email: session.user.email }});
  if (!user) return { success: false, message: "ユーザーが見つかりません。" };

  // 元のデータの場所(parentId)を知るために取得
  let currentItem: { parentId: string | null } | null = null;
  if (itemType === 'directory') {
    currentItem = await prisma.directory.findUnique({ where: { id: itemId }, select: { parentId: true } });
  } else {
    currentItem = await prisma.workbook.findUnique({ where: { id: itemId }, select: { parentId: true } });
  }

  if (!currentItem) return { success: false, message: "アイテムが見つかりません" };

  // 重複チェック
  const isDuplicate = await checkDuplicateName(user.id, currentItem.parentId, newData.name, itemId);
  if (isDuplicate) return { success: false, message: `「${newData.name}」という名前は既に使われています。` };

  try {
    if (itemType === 'directory') {
      await prisma.directory.update({ where: { id: itemId }, data: { name: newData.name }});
    } else {
      await prisma.workbook.update({ where: { id: itemId }, data: { name: newData.name, description: newData.description }});
    }
    revalidatePath("/home");
    revalidatePath(`/directory/${currentItem.parentId || ''}`);
    return { success: true, message: "更新しました。" };
  } catch (error) {
    return { success: false, message: "更新に失敗しました。" };
  }
}

// 3. アイテム移動（場所変更）
export async function moveItem(
  itemId: string,
  itemType: 'directory' | 'workbook',
  newParentId: string | null
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.email) return { success: false, message: "ログインが必要です" };
  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return { success: false, message: "ユーザーが見つかりません" };

  // ディレクトリが自分自身のフォルダに入ろうとするのを防ぐ
  if (itemType === 'directory' && itemId === newParentId) {
    return { success: false, message: "自分自身の中には移動できません" };
  }

  // まず自分の名前を取得
  let itemName = "";
  if (itemType === 'directory') {
    const d = await prisma.directory.findUnique({ where: { id: itemId } });
    if (d) itemName = d.name;
  } else {
    const w = await prisma.workbook.findUnique({ where: { id: itemId } });
    if (w) itemName = w.name;
  }

  if (!itemName) return { success: false, message: "移動対象が見つかりません" };

  // 移動先に同じ名前のものがないかチェック！
  const isDuplicate = await checkDuplicateName(user.id, newParentId, itemName, itemId);
  if (isDuplicate) {
    return { success: false, message: `移動先に「${itemName}」と同名のアイテムが既にあります。名前を変えてから移動してください。` };
  }

  try {
    if (itemType === 'directory') {
      await prisma.directory.update({ where: { id: itemId }, data: { parentId: newParentId } });
    } else {
      await prisma.workbook.update({ where: { id: itemId }, data: { parentId: newParentId } });
    }

    revalidatePath("/home");
    return { success: true, message: "移動しました" };
  } catch (error) {
    return { success: false, message: "移動に失敗しました" };
  }
}

// 移動先候補取得
export async function getDirectoryChoices(parentId: string | null) {
  const session = await auth();
  if (!session?.user?.email) return [];
  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  return prisma.directory.findMany({ where: { userId: user?.id, parentId: parentId }, orderBy: { name: 'asc' } });
}

// 削除
export async function deleteItem(itemId: string, itemType: 'directory' | 'workbook'): Promise<ActionResult> {
  try {
    if (itemType === 'directory') { await prisma.directory.delete({ where: { id: itemId }}); }
    else { await prisma.workbook.delete({ where: { id: itemId }}); }
    revalidatePath("/home");
    return { success: true, message: "削除しました。" };
  } catch (error) { return { success: false, message: "失敗しました。" }; }
}