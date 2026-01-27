import { auth } from "@/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import StudyClient from "./StudyClient";

export default async function PlayPage({ params }: { params: { id: string } }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.email) redirect("/");

  const workbook = await prisma.workbook.findUnique({
    where: { id },
    include: { cards: true }
  });

  if (!workbook || workbook.cards.length === 0) {
    redirect(`/workbook/${id}`); // 問題がなければ戻る
  }

  return <StudyClient workbookName={workbook.name} cards={workbook.cards} workbookId={id} />;
}