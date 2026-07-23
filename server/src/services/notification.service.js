import notificationRepository from "../repositories/notification.repository.js";
import userRepository from "../repositories/user.repository.js";
import prisma from "../config/prisma.js";
import ErrorHandler from "../utility/ErrorHandler.utility.js";

class NotificationService {
    async getMyNotifications(userId, query) {
        const { page = 1, limit = 20, unreadOnly } = query;
        const pageNum = Math.max(1, parseInt(page));
        const limitNum = Math.max(1, Math.min(100, parseInt(limit)));
        const skip = (pageNum - 1) * limitNum;

        const where = { userId };
        if (unreadOnly === "true") {
            where.isRead = false;
        }

        const { data, total } = await notificationRepository.findMany(where, skip, limitNum);
        const unreadCount = await notificationRepository.count({ userId, isRead: false });

        return {
            notifications: data,
            unreadCount,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                totalPages: Math.ceil(total / limitNum),
            },
        };
    }

    async markNotificationRead(userId, id) {
        const notification = await notificationRepository.findById(id);
        if (!notification) {
            throw new ErrorHandler("Notification not found", 404);
        }

        if (notification.userId !== userId) {
            throw new ErrorHandler("Access denied", 403);
        }

        return notificationRepository.update(id, { isRead: true });
    }

    async markAllRead(userId) {
        const result = await notificationRepository.updateMany(
            { userId, isRead: false },
            { isRead: true }
        );

        return { updatedCount: result.count };
    }

    async createNotification(body) {
        const { userId, title, message, type } = body;

        const user = await userRepository.findById(userId);
        if (!user) {
            throw new ErrorHandler("Target user not found", 404);
        }

        return notificationRepository.create({
            userId,
            title,
            message,
            type: type || "GENERAL",
        });
    }

    async sendBulkNotification(body) {
        const { title, message, type, role, userIds } = body;
        let targetUserIds = [];

        if (userIds && Array.isArray(userIds) && userIds.length > 0) {
            targetUserIds = userIds;
        } else if (role) {
            const users = await prisma.user.findMany({
                where: { role },
                select: { id: true },
            });
            targetUserIds = users.map((u) => u.id);
        } else {
            const users = await prisma.user.findMany({ select: { id: true } });
            targetUserIds = users.map((u) => u.id);
        }

        if (targetUserIds.length === 0) {
            throw new ErrorHandler("No target users found to send notifications to", 404);
        }

        const notificationsData = targetUserIds.map((uId) => ({
            userId: uId,
            title,
            message,
            type: type || "ANNOUNCEMENT",
        }));

        const result = await notificationRepository.createMany(notificationsData);

        return {
            count: result.count,
            targetUserCount: targetUserIds.length,
        };
    }

    async getNotificationById(userId, id) {
        const notification = await notificationRepository.findById(id);
        if (!notification) {
            throw new ErrorHandler("Notification not found", 404);
        }

        if (notification.userId !== userId) {
            throw new ErrorHandler("Access denied", 403);
        }

        return notification;
    }

    async deleteNotification(userId, id) {
        const notification = await notificationRepository.findById(id);
        if (!notification) {
            throw new ErrorHandler("Notification not found", 404);
        }

        if (notification.userId !== userId) {
            throw new ErrorHandler("Access denied", 403);
        }

        return notificationRepository.delete(id);
    }
}

export default new NotificationService();
