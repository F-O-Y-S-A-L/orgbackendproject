import Task from "../models/taskModel.js";
import Project from "../models/projectModel.js";
import catchAsync from "../utils/catchAsync.js";
import AppError from "../utils/appError.js";
import Activitylog from "../controllers/Activitylog.js";
import notification from "../controllers/notification.js";
import Organization from "../models/orgModel.js";
import roleCheck from "../utils/roleCheck.js";
import { io } from "../utils/socket-oi.js";


export const taskCreate = catchAsync(async (req, res, next) => {
   const project = await Project.findById(req.params.projectId)
   if (!project) {
      return next(new AppError('Project not found', 404))
   }
   const organization = await Organization.findById(project.orgId)
   if (!organization) next(new AppError('organization not found.', 404))

   const newTask = await Task.create({
      title: req.body.title,
      projectId: project.id,
      orgId: project.orgId,
      description: req.body.description,
      dueDate: new Date(req.body.dueDate),
      status: req.body.status,
      assignedTo: req.user._id
   })

   await newTask.populate('assignedTo', 'email photo')

   let role;
   if (project.createdBy.toString() === req.user._id.toString()) {
      role = 'admin'
   } else {
      role = 'member'
   }

   const alreadExists = req.user.organizations.some((org) => org.orgId.toString() === newTask.orgId.toString())
   if (!alreadExists) {
      req.user.organizations.push({ orgId: newTask.orgId, role })
      await req.user.save()
   }
   if (alreadExists) {
      console.log("User already member of this org");
   }

   const newNotification = await notification.notifications('Create', req.user._id, `New Task Created: ${newTask.title}`, newTask.id, Date.now())
   await Activitylog.activitylog('Create', newTask.orgId, req.user._id, 'Task', newTask._id)

   io.emit('TaskCreated', {
      message: newNotification.message,
      notification: newNotification
   })

   res.status(201).json({
      status: 'success',
      data: {
         newTask
      }
   })
})

export const getTask = catchAsync(async (req, res, next) => {
   const task = await Task.findById(req.params.taskId).populate('assignedTo', 'email')

   if (!task) {
      return next(new AppError('task not found.', 404))
   }

   res.status(200).json({
      status: 'success',
      data: {
         task
      }
   })
})

export const getAllTask = catchAsync(async (req, res, next) => {
   const task = await Task.find()

   if (!task) {
      return next(new AppError('task not found.', 404))
   }

   res.status(200).json({
      status: 'success',
      result: task.length,
      data: {
         task
      }
   })
})

export const getTaskbyProject = catchAsync(async (req, res, next) => {
   const task = await Task.find({ projectId: req.params.projectId }).populate('assignedTo', 'email photo')

   if (!task) {
      return next(new AppError('task not found by project', 404))
   }

   res.status(200).json({
      status: 'success',
      result: task.length,
      data: {
         task
      }
   })
})

export const updateTask = catchAsync(async (req, res, next) => {
   const task = await Task.findById(req.params.taskId)

   if (!task) {
      return next(new AppError('task not found.', 404))
   }

   const permission = roleCheck.taskRoleCheck(req, task)
   if (!permission) {
      return next(new AppError('You do not have permission to delete this task', 403))
   }

   const taskUpdated = await Task.findByIdAndUpdate(task._id, req.body, {
      new: true,
      runValidators: true
   })

   const newNotification = await notification.notifications('Update', req.user._id, `Task Updated: ${task.title}`, task.id, Date.now())
   await Activitylog.activitylog('Update', taskUpdated.orgId, req.user.id, 'Task', taskUpdated._id)

   io.emit('TaskUpdated', {
      message: newNotification.message,
      notification: newNotification
   })

   res.status(200).json({
      status: 'success',
      data: {
         taskUpdated,
      }
   })
})

export const deleteTask = catchAsync(async (req, res, next) => {
   const task = await Task.findById(req.params.taskId)

   if (!task) {
      return next(new AppError('task not found.', 404))
   }

   const permission = roleCheck.taskRoleCheck(req, task)
   if (!permission) {
      return next(new AppError('You do not have permission to delete this task', 403))
   }

   const taskDelete = await Task.findByIdAndDelete(task._id)

   const newNotification = await notification.notifications('Delete', req.user._id, `Task Deleted: ${task.title}`, task.id, Date.now())
   await Activitylog.activitylog('Delete', taskDelete.orgId, req.user.id, 'Task', taskDelete._id)

   io.emit('TaskDelete', {
      message: newNotification.message,
      notification: newNotification
   })

   res.status(200).json({
      status: 'success',
      data: null
   })
})

export default {
   taskCreate,
   getAllTask,
   getTask,
   updateTask,
   deleteTask,
   getTaskbyProject
}