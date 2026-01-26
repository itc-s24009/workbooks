import { signInAction, signOutAction } from "@/components/auth/action";
import { getUserInfo } from "@/lib/user";


export default async function Page() {
    const user = await getUserInfo();


    return (
        user ? (
            <div>
                <h1>ようこそ、{user.name}さん</h1>
                <form action={signOutAction}>
                    <button>ログアウト</button>
                </form>
            </div>
        ) : (
            <div>
                    <h1>ログインテスト</h1>
                    <form action={signInAction}>
                    <button>ログイン</button>
                </form>
            </div>
        )
    )
}