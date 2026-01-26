import { auth } from "../auth";
import { getUserByEmail } from "./db/user";

export async function getUserInfo() {
  const session = await auth();
  const email = session?.user?.email || null;
  return email ? await getUserByEmail(email) : null;
}
