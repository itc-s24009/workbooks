import prisma from "../prisma";

export function getUserByEmail(email: string) {
    return prisma.$transaction(async (prisma) => {
        return await prisma.user.findUnique({
            where: {
                email: email
            }
        })
    })
}