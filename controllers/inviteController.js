import catchAsync from '../utils/catchAsync.js'
import Invite from '../models/inviteModel.js'
import User from '../models/userModel.js'
import AppError from '../utils/appError.js'
import notification from '../controllers/notification.js'


export const inviteSend = catchAsync(async (req, res, next) => {
   const { email, role } = req.body
   const orgId = req.params.orgId
   const invite = await Invite.create({
      orgId,
      email,
      role
   })

   const user = await User.findOne({ email })

   if (!user) {
      return next(new AppError('User not found', 404))
   }
   const newNotification = await notification.notifications('Invite', req.user._id, `Invitation send: ${user.name}`, user.id, Date.now())

   const existingOrg = user.organizations.find(
      org => org.orgId.toString() === orgId.toString()
   )

   if (existingOrg) {
      existingOrg.role = role
   } else {
      user.organizations.push({ orgId, role })
   }

   await user.save()

   res.status(201).json({
      status: 'success',
      data: {
         invite,
         users: user,
         notification: newNotification
      }
   })
})

export const getAllInvite = catchAsync(async (req, res, next) => {
   const invite = await Invite.find()

   if (!invite) {
      return next(new AppError('Invite User not found', 404))
   }

   res.status(200).json({
      status: 'success',
      results: invite.length,
      data: {
         invite
      }
   })
})


export default {
   inviteSend,
   getAllInvite
}