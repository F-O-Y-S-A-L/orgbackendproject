import Activitylog from "../models/activityModel.js";
import AppError from "../utils/appError.js";
import catchAsync from "../utils/catchAsync.js";

export const activitylog = async (action, orgId, userId, targetType, targetId) => {
   await Activitylog.create({
      action,
      orgId,
      userId,
      targetType,
      targetId
   })
}

export const getActivitylog = catchAsync(async (req, res, next) => {
   const getActivity = await Activitylog.find().populate('userId', 'email')
   const logCount = getActivity.length

   if(!getActivity) {
      return next(new AppError('There is no Activitylog here.', 404))
   }

   res.status(200).json({
      status: 'success',
      results: getActivity.length,
      data: {
         getActivity,
         logCount
      }
   })
})

export const DeleteActivityLog = catchAsync(async (req, res, next) => {
   await Activitylog.findByIdAndDelete(req.params.id)

   res.status(201).json({
      status: 'success',
      data: null
   })
})


export default {
   getActivitylog,
   activitylog,
   DeleteActivityLog
}