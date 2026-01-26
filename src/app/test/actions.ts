'use server'

import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"

// ユーザーを追加する機能
export async function addUser(formData: FormData) {
  // フォームから入力された値を取得
  const name = formData.get("name") as string
  const email = formData.get("email") as string

  // Prismaを使ってDBに保存！
  await prisma.user.create({
    data: {
      name: name,
      email: email,
    },
  })

  // 画面を更新する
  revalidatePath("/test")
}

// ユーザーを削除する機能
export async function deleteUser(userId: string) {
  // Prismaを使ってDBから削除！
  await prisma.user.delete({
    where: { id: userId },
  })

  // 画面を更新する
  revalidatePath("/test")
}