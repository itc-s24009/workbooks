"use server"

// 移動したauth.tsを読み込む
import { signIn, signOut } from "@/auth"

export async function signInAction() {
  // Googleログインを実行。完了後は /home に飛ぶ設定
  await signIn("google", { redirectTo: "/home" })
}

export async function signOutAction() {
  // ログアウトを実行。完了後はトップページに戻る
  await signOut({ redirectTo: "/" })
}