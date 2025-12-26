import { prisma } from "@/utils/prisma";
import logger from "@/utils/logger";

export const saveNotification = async (data: {
  title: string;
  message: string;
  imageUrl?: string;
  sentBy: string;
  sentTo: string[];
  sentToAll: boolean;
  status: string;
}) => {
  try {
    return await prisma.notification.create({
      data,
    });
  } catch (error: any) {
    logger.error({ error: error.message }, "Failed to save notification");
    throw error;
  }
};

export const getNotifications = async (
  page: number,
  limit: number,
  sortBy: string,
  order: "asc" | "desc"
) => {
  const skip = (page - 1) * limit;

  const [notifications, total] = await Promise.all([
    prisma.notification.findMany({
      skip,
      take: limit,
      orderBy: { [sortBy]: order },
    }),
    prisma.notification.count(),
  ]);

  return {
    notifications,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const saveEmailLog = async (data: {
  subject: string;
  message: string;
  pdfUrls: string[];
  sentBy: string;
  sentTo: string[];
  status: string;
}) => {
  try {
    return await prisma.emailLog.create({
      data,
    });
  } catch (error: any) {
    logger.error({ error: error.message }, "Failed to save email log");
    throw error;
  }
};

export const getEmailLogs = async (
  page: number,
  limit: number,
  sortBy: string,
  order: "asc" | "desc"
) => {
  const skip = (page - 1) * limit;

  const [logs, total] = await Promise.all([
    prisma.emailLog.findMany({
      skip,
      take: limit,
      orderBy: { [sortBy]: order },
    }),
    prisma.emailLog.count(),
  ]);

  return {
    logs,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};
