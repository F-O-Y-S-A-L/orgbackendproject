import Notification from "../models/notifiModel.js";
import AppError from "../utils/appError.js";
import catchAsync from "../utils/catchAsync.js";
import { io } from "../utils/socket-oi.js";

export const notifications = async (action, userId, message, targetId, createdAt) => {
   const newNotification = await Notification.create({
      action,
      userId,
      message,
      targetId,
      createdAt
   })
   const unreadCount = await Notification.countDocuments({
      userId,
      isRead: false
   });

   io.to(userId.toString()).emit("NotificationCount", unreadCount);

   return newNotification;
}

export const getAllNotifycation = catchAsync(async (req, res, next) => {
   const getNotification = await Notification.find().populate('userId', 'email')

   if (!getNotification.length === 0) {
      return next(new AppError('There is no Activitylog here.', 404))
   }

   res.status(200).json({
      status: 'success',
      results: getNotification.length,
      data: {
         getNotification
      }
   })
})

export const getUserNotification = catchAsync(async (req, res, next) => {
   const userId = req.user._id
   const notification = await Notification.find({ userId: userId }).populate('userId', 'email')

   if (!notification) {
      return next(new AppError('No Notification yet!'))
   }

   res.status(200).json({
      status: 'success',
      result: notification.length,
      data: {
         notification
      }
   })
})
export const DeleteUserNotification = catchAsync(async (req, res, next) => {
   const userId = req.user._id
   const notification = await Notification.find({ userId: userId })

   if (!notification) {
      return next(new AppError('No Notification yet!'))
   }

   await Notification.findByIdAndDelete(req.params.notifiId)

   res.status(204).json({
      status: 'success',
      data: null
   })
})

export const getUnreadCount = catchAsync(async (req, res, next) => {
   const unreadCount = await Notification.countDocuments({
      userId: req.user._id,
      isRead: false
   })

   io.to(req.user._id.toString()).emit('NotificationCount', unreadCount)

   res.status(200).json({
      status: 'success',
      count: unreadCount
   })
})

export const markAsRead = catchAsync(async (req, res, next) => {
   await Notification.updateMany(
      { userId: req.user._id, isRead: false },
      { $set: { isRead: true } }
   )

   io.to(req.user._id.toString()).emit('NotificationCount', 0)

   res.status(200).json({
      status: 'success',
      message: 'All notifications marked as read'
   })
})

export default {
   notifications,
   getAllNotifycation,
   getUserNotification,
   DeleteUserNotification,
   getUnreadCount,
   markAsRead
}