import Comment from '../models/commentModel.js'
import catchAsync from '../utils/catchAsync.js'
import Task from '../models/taskModel.js'
import AppError from '../utils/appError.js'
import Activitylog from '../controllers/Activitylog.js'
import notification from '../controllers/notification.js'
import roleCheck from '../utils/roleCheck.js'
import { io } from '../utils/socket-oi.js'

export const commentCreate = catchAsync(async (req, res, next) => {
   const task = await Task.findById(req.params.taskId)
   if (!task) {
      return next(new AppError('tasks not found.', 404))
   }

   const newComment = await Comment.create({
      message: req.body.message,
      taskId: task.id,
      userId: req.user.id
   })

   const newNotification = await notification.notifications('Create', req.user._id, `New Comment Added: ${newComment.message}`, newComment.id, Date.now())
   await Activitylog.activitylog('Create', task.orgId, req.user.id, 'comment', task.id)

   const populatedComment = await Comment.findById(newComment._id)
      .populate('userId', 'email photo name');

   io.emit('ComCreated', {
      message: newNotification.message,
      notification: newNotification
   })

   res.status(201).json({
      status: 'success',
      data: {
         newComment: populatedComment
      }
   })
})

export const getComment = catchAsync(async (req, res, next) => {
   const comment = await Comment.findById(req.params.comId)

   if (!comment) {
      return next(new AppError('comment not found.', 404))
   }

   res.status(200).json({
      status: 'success',
      data: {
         comment
      }
   })
})

export const getAllComment = catchAsync(async (req, res, next) => {
   const comment = await Comment.find()
   if (!comment) {
      return next(new AppError('comment not found.', 404))
   }

   res.status(200).json({
      status: 'success',
      result: comment.length,
      data: {
         comment
      }
   })
})

export const getCommentsByTaskId = catchAsync(async (req, res, next) => {
   const comments = await Comment.find({ taskId: req.params.taskId }).populate('userId', 'email photo name')

   if (!comments) {
      return next(new AppError('Comments not found', 404))
   }

   res.status(200).json({
      status: 'success',
      results: comments.length,
      data: { comments }
   })
})

export const updateComment = catchAsync(async (req, res, next) => {
   const comment = await Comment.findByIdAndUpdate(req.params.comId)
   if (!comment) {
      return next(new AppError('comment not found.', 404))
   }
   const task = await Task.findById(comment.taskId)

   if (!task) {
      return next(new AppError('Task not found for this comment', 404))
   }

   const permission = roleCheck.commentRoleCheck(req, comment, task)
   if (!permission) {
      return next(new AppError('You do not have permission to update this comment', 403))
   }

   const comUpdate = await Comment.findByIdAndUpdate(comment._id, req.body, {
      new: true,
      runValidators: true
   })

   const newNotification = await notification.notifications('Update', req.user._id, `New Comment Updated: ${comment.message}`, comment.id, Date.now())
   await Activitylog.activitylog('Update', task.orgId, req.user._id, 'comment', comUpdate._id)

   io.emit('ComUpdated', {
      message: newNotification.message,
      notification: newNotification
   })

   res.status(200).json({
      status: 'success',
      data: {
         comUpdate,
      }
   })
})


export const deleteComment = catchAsync(async (req, res, next) => {
   const comment = await Comment.findById(req.params.comId)

   if (!comment) {
      return next(new AppError('comment not found.', 404))
   }
   const task = await Task.findById(comment.taskId)

   const permission = roleCheck.commentRoleCheck(req, comment, task)
   if (!permission) {
      return next(new AppError('You do not have permission to delete this comment', 403))
   }

   const comDelete = await Comment.findByIdAndDelete(comment._id)

   const newNotification = await notification.notifications('Delete', req.user._id, `New Comment Deleted: ${comment.message}`, comment.id, Date.now())
   await Activitylog.activitylog('Delete', task.orgId, req.user._id, 'comment', comDelete._id)

   io.emit('ComDelete', {
      message: newNotification.message,
      notification: newNotification
   })

   res.status(200).json({
      status: 'success',
      data: null
   })
})



export default {
   commentCreate,
   getComment,
   getAllComment,
   updateComment,
   deleteComment,
   getCommentsByTaskId
}