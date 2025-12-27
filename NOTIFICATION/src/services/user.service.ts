import logger from '@/utils/logger';
import { prisma } from '@/utils/prisma';


export const registerOrUpdateUser = async (
  clerkId: string,
  email: string,
  expoToken: string,
) => {
  try {
    const existingUser = await prisma.user.findUnique({
      where: { clerkId },
    });

    if (existingUser) {
      // Update user:  add token if not already present
      const updatedTokens = existingUser.expoTokens.includes(expoToken)
        ? existingUser.expoTokens
        : [...existingUser.expoTokens, expoToken];

      return await prisma.user.update({
        where: { clerkId },
        data: {
          email, // Update email if changed
          expoTokens: updatedTokens,
        },
      });
    } else {
      // Create new user
      return await prisma.user.create({
        data: {
          clerkId,
          email,
          expoTokens: [expoToken],
        },
      });
    }
  } catch (error: any) {
    logger.error({ error: error.message }, 'User registration/update failed');
    throw error;
  }
};

export const getUsersByEmails = async (emails: string[]) => {
  return await prisma.user.findMany({
    where: {
      email: {
        in: emails,
      },
    },
  });
};

export const getAllUsersTokens = async (): Promise<string[]> => {
  const users = await prisma.user.findMany({
    select: { expoTokens: true },
  });
  return users.flatMap((user) => user.expoTokens);
};

export const getUsers = async (page: number, limit: number) => {
  const skip = (page - 1) * limit;

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.user.count(),
  ]);

  return {
    users,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const getUserEmails = async () => {
  const users = await prisma.user.findMany({
    select: { email: true },
  });
  return users.map((user) => user.email);
};
