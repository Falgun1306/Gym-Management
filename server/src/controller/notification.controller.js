import asyncHandler from "../middlewares/asyncHandler.middleware.js";
import ApiResponse from "../utility/ApiResponse.utility.js";
import notificationService from "../services/notification.service.js";

const getMyNotifications = asyncHandler(async (req, res) => {
    const { notifications, unreadCount, pagination } = await notificationService.getMyNotifications(req.user.id, req.query);
    res.status(200).json({
        ...new ApiResponse(200, notifications, "Notifications retrieved successfully", pagination),
        unreadCount,
    });
});

const markNotificationRead = asyncHandler(async (req, res) => {
    const updated = await notificationService.markNotificationRead(req.user.id, req.params.id);
    res.status(200).json(new ApiResponse(200, updated, "Notification marked as read"));
});

const markAllRead = asyncHandler(async (req, res) => {
    const { updatedCount } = await notificationService.markAllRead(req.user.id);
    res.status(200).json(new ApiResponse(200, { updatedCount }, "All notifications marked as read"));
});

const createNotification = asyncHandler(async (req, res) => {
    const notification = await notificationService.createNotification(req.body);
    res.status(201).json(new ApiResponse(201, notification, "Notification sent successfully"));
});

const sendBulkNotification = asyncHandler(async (req, res) => {
    const result = await notificationService.sendBulkNotification(req.body);
    res.status(201).json(new ApiResponse(201, result, `Bulk notifications sent to ${result.targetUserCount} users`));
});

const getNotificationById = asyncHandler(async (req, res) => {
    const notification = await notificationService.getNotificationById(req.user.id, req.params.id);
    res.status(200).json(new ApiResponse(200, notification));
});

const deleteNotification = asyncHandler(async (req, res) => {
    await notificationService.deleteNotification(req.user.id, req.params.id);
    res.status(200).json(new ApiResponse(200, null, "Notification deleted successfully"));
});

export {
    getMyNotifications,
    markNotificationRead,
    markAllRead,
    createNotification,
    sendBulkNotification,
    getNotificationById,
    deleteNotification,
};
