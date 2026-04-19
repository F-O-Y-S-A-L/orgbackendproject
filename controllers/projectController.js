import catchAsync from '../utils/catchAsync.js'
import Project from '../models/projectModel.js'
import Activitylog from '../controllers/Activitylog.js'
import Organizations from '../models/orgModel.js'
import AppError from '../utils/appError.js'
import roleCheck from '../utils/roleCheck.js'
import notification from "../controllers/notification.js";
import { io } from "../utils/socket-oi.js";


export const createProject = catchAsync(async (req, res, next) => {
   const organization = await Organizations.findById(req.params.orgId)
   if (!organization) {
      return next(new AppError('Organization not found', 404))
   }

   const newProject = await Project.create({
      name: req.body.name,
      orgId: organization._id,
      description: req.body.description,
      createdBy: req.user._id
   })
   await newProject.populate('createdBy', 'email photo')

   if (organization.ownerId.toString() !== req.user._id.toString()) {
      const alreadyExists = req.user.organizations.some(org =>
         org.orgId.toString() === newProject.orgId.toString()
      )
      if (!alreadyExists) {
         req.user.organizations.push({
            orgId: organization._id,
            role: 'admin'
         })
      }
   }
   await req.user.save()

   const newNotification = await notification.notifications('Create', req.user._id, `New Project Created: ${newProject.name}`, newProject.id, Date.now())
   await Activitylog.activitylog('Create', newProject.orgId, req.user.id, 'Project', newProject.id)

   io.emit('ProjectCreated', {
      message: newNotification.message,
      notification: newNotification
   })

   res.status(201).json({
      status: 'success',
      data: {
         newProject,
      }
   })
})


export const getProject = catchAsync(async (req, res, next) => {
   const project = await Project.findById(req.params.projectId)

   if (!project) {
      return next(new AppError('Project not found.', 404))
   }

   res.status(200).json({
      status: 'success',
      data: {
         project
      }
   })
})

export const getAllProject = catchAsync(async (req, res, next) => {
   const project = await Project.find()
   const projectCount = project.length

   if (!project) {
      return next(new AppError('Project not found.', 404))
   }

   res.status(200).json({
      status: 'success',
      result: project.length,
      data: {
         project, projectCount
      }
   })
})

export const getProjectbyOrg = catchAsync(async (req, res, next) => {
   const projects = await Project.find({ orgId: req.params.orgId }).populate('createdBy', 'email photo')

   if (!projects) {
      return next(new AppError('Project not found by organizations', 404))
   }

   res.status(200).json({
      status: 'success',
      data: {
         projects
      }
   })
})

export const updateProject = catchAsync(async (req, res, next) => {
   const project = await Project.findById(req.params.projectId)

   if (!project) {
      return next(new AppError('Project not found.', 404))
   }

   const permission = roleCheck.projectRoleCheck(req, project)
   if (!permission) {
      return next(new AppError('You do not have permission to update this projects', 403))
   }

   const updateProject = await Project.findByIdAndUpdate(project._id, req.body, {
      new: true,
      runValidators: true
   })


   const newNotification = await notification.notifications('Update', req.user._id, `New Project Updated: ${project.name}`, project.id, Date.now())
   await Activitylog.activitylog('Update', updateProject.orgId, req.user.id, 'Project', updateProject.id)

   io.emit('ProjectUpdated', {
      message: newNotification.message,
      notification: newNotification
   })

   res.status(200).json({
      status: 'success',
      data: {
         updateProject,
      }
   })
})


export const deleteProject = catchAsync(async (req, res, next) => {
   const project = await Project.findById(req.params.projectId)

   if (!project) {
      return next(new AppError('Project not found.', 404))
   }

   const permission = roleCheck.projectRoleCheck(req, project)
   if (!permission) {
      return next(new AppError('You do not have permission to update this projects', 403))
   }

   const projectDelete = await Project.findByIdAndDelete(project._id)

   const newNotification = await notification.notifications('Delete', req.user._id, `New Project Deleted: ${project.name}`, project.id, Date.now())
   await Activitylog.activitylog('Delete', projectDelete.orgId, req.user.id, 'Project', projectDelete.id)

   io.emit('ProjectDelete', {
      message: newNotification.message,
      notification: newNotification
   })

   res.status(200).json({
      status: 'success',
      data: null
   })
})


export const getUserbyProject = catchAsync(async (req, res, next) => {
   const projects = await Project.find({ createdBy: req.user._id }).populate('createdBy', 'email photo')
   const projectCount = projects.length

   if (!projects || projects.length === 0) {
      return next(new AppError('Project not found by organizations', 404))
   }

   res.status(200).json({
      status: 'success',
      data: {
         projects,
         projectCount
      }
   })
})

export default {
   createProject,
   getProject,
   getAllProject,
   updateProject,
   deleteProject,
   getProjectbyOrg,
   getUserbyProject
}