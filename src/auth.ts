import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import prisma from "@/lib/prisma" // DB接続用

export const { handlers, auth, signIn, signOut } = NextAuth({
  // アダプターを使わず、セッションストラテジーをJWTにする（デフォルト挙動）
  session: { strategy: "jwt" },
  theme: {
    logo: "https://authjs.dev/img/logo-sm.png"
  },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    })
  ],
  callbacks: {
    // ▼ ここでログイン時にDBへの保存を行います ▼
    signIn: async ({ user }) => {
      try {
        if (!user.email) return false // メアドがない場合はログイン拒否

        // 「あれば更新、なければ作成」を一発でやる便利な機能 (upsert)
        await prisma.user.upsert({
          where: { email: user.email },
          // データがあれば何もしない（名前を更新したければここに入れる）
          update: {
             name: user.name 
          },
          // データがなければ新しく作る
          create: {
            email: user.email,
            name: user.name,
          },
        })

        return true // ログインOK
      } catch (error) {
        console.error("Login Error:", error)
        return false // エラーならログイン拒否
      }
    },
    // ▲ 追加・修正したのはここまで ▲

    session: async ({ session }) => {
      // そのままでOK
      return session
    }
  }
})