import Organization from "../models/orgModel.js";
import catchAsync from "../utils/catchAsync.js";
import Activitylog from '../controllers/Activitylog.js'
import AppError from "../utils/appError.js";
import notification from "../controllers/notification.js";
import Users from "../models/userModel.js";
import { io } from '../utils/socket-oi.js'  

export const createOrganizations = catchAsync(async (req, res, next) => {
   const newOrg = await Organization.create({
      name: req.body.name,
      ownerId: req.user._id,
   })
   await newOrg.populate('ownerId', 'email photo')

   if (!req.user.organizations.some(org => org.orgId.toString() === newOrg._id.toString())) {
      req.user.organizations.push({
         orgId: newOrg._id,
         role: 'owner'
      })
   }
   await req.user.save()

   await Activitylog.activitylog('Create', newOrg.id, req.user._id, 'Organizations', newOrg.id)

   const newNotification = await notification.notifications('Create', req.user._id, `New Organization created: ${newOrg.name}`, newOrg.id, Date.now())
   
   io.emit('OrgCreated', { 
      message: newNotification.message,
      notification: newNotification       
   })

   res.status(201).json({
      status: 'success',
      data: {
         newOrg
      }
   })
})

export const getAllOrg = catchAsync(async (req, res, next) => {
   const allOrg = await Organization.find().populate('ownerId', 'email photo')
   const orgCount = allOrg.length

   if (!allOrg) {
      return next(new AppError('org not found.', 404))
   }

   res.status(200).json({
      status: 'success',
      result: allOrg.length,
      data: {
         org: {
            allOrg, orgCount
         }
      }
   })
})


export const getOrg = catchAsync(async (req, res, next) => {
   const org = await Organization.findById(req.params.orgId).populate('ownerId', 'email photo role')
   const orgAllUser = await Users.findById(org.ownerId).populate('organizations', 'orgId')
   const orgCount = orgAllUser.organizations.length

   if (!org) {
      return next(new AppError('org not found.', 404))
   }

   res.status(200).json({
      status: 'success',
      data: {
         OrgUser: { org, orgAllUser, orgCount },
      }
   })
})

export const updateOrg = catchAsync(async (req, res, next) => {
   const org = await Organization.findByIdAndUpdate(req.params.orgId, req.body, {
      new: true,
      runValidators: true
   })

   if (!org) {
      return next(new AppError('org not found.', 404))
   }
   const newNotification = await notification.notifications('Update', req.user._id, `Organization updated: ${org.name}`, org.id, Date.now())
   await Activitylog.activitylog('Update', org.id, req.user._id, 'Organizations', org.id)

   io.emit('OrgUpdate', {
      message: newNotification.message,
      notification: newNotification
   })

   res.status(200).json({
      status: 'success',
      data: {
         org,
      }
   })
})

export const deleteOrg = catchAsync(async (req, res, next) => {
   const org = await Organization.findByIdAndDelete(req.params.orgId)

   if (!org) {
      return next(new AppError('org not found.', 404))
   }

   const newNotification = await notification.notifications('Delete', req.user._id, `Organization Deleted: ${org.name}`, org.id, Date.now())
   await Activitylog.activitylog('Delete', org.id, req.user.id, 'Organizations', org.id)
   
   io.emit('OrgDelete', {
      message: newNotification.message,
      notification: newNotification
   })

   res.status(200).json({
      status: 'success',
      data: null
   })
})

export const getUserByOrg = catchAsync(async (req, res, next) => {
   const org = await Organization.find({ownerId: req.user._id}).populate('ownerId', 'photo name email')
   const orgCount = org.length

   if (!org || org.length === 0) {
      return next(new AppError('org not found.', 404))
   }

   res.status(200).json({
      status: 'success',
      data: {
         orgs: org,
         OrgCount: orgCount
      }
   })
})



export default {
   createOrganizations,
   getOrg,
   getAllOrg,
   deleteOrg,
   updateOrg,
   getUserByOrg
}