import catchAsync from "../utils/catchAsync.js";
import Users from "../models/userModel.js";
import Organization from "../models/orgModel.js";
import AppError from "../utils/appError.js";
import { io } from "../utils/socket-oi.js";
import multer from 'multer'
import sharp from 'sharp'
import { v2 as cloudinary } from 'cloudinary'
import dotenv from 'dotenv';
dotenv.config();


const multerStroage = multer.memoryStorage()
 
cloudinary.config({
   cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
   api_key: process.env.CLOUDINARY_API_KEY,
   api_secret: process.env.CLOUDINARY_API_SECRET,
})

const multerFilter = (req, file, cb) => {
   if (file.mimetype.startsWith('image')) {
      cb(null, true)
   } else {
      cb(new AppError('Not an images! Please upload your images.', 404), false)
   }
}

const upload = multer({
   storage: multerStroage,
   fileFilter: multerFilter
})

export const uploadUserPhoto = upload.single('photo')


export const resizeUserPhoto = catchAsync(async (req, res, next) => {
   if (!req.file) return next()

   const processedBuffer = await sharp(req.file.buffer)
      .resize(500, 500)
      .toFormat('jpeg')
      .jpeg({ quality: 90 })
      .toBuffer()


   const uploadResult = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
         { folder: 'profile-photos' },
         (error, result) => {
            if (error) reject(error)
            else resolve(result)
         }
      ).end(processedBuffer)
   })

   req.file.cloudinaryUrl = uploadResult.secure_url

   next()
})

const filterObj = (obj, ...allowedFields) => {
   let newObj = {}
   Object.keys(obj).forEach(el => {
      if (allowedFields.includes(el)) {
         return newObj[el] = obj[el]
      }
   })
   return newObj
}

export const getMe = (req, res, next) => {
   res.status(200).json({
      status: 'success',
      data: {
         User: req.user
      }
   })
}

export const updatedMe = catchAsync(async (req, res, next) => {
   if (req.body.password) {
      return next(new AppError('This route is not for password updates. Please use /updateMyPassword.', 400))
   }

   const filteredBody = filterObj(req.body, 'name', 'email')
   if (req.file) filteredBody.photo = req.file.cloudinaryUrl;

   const updatedUser = await Users.findByIdAndUpdate(req.user.id, filteredBody, {
      new: true,
      runValidators: true
   })

   io.emit('UpdateMe', {
      message: 'Updated settings successfully ✅',
   })

   res.status(200).json({
      status: 'success',
      data: {
         updatedUser
      }
   })
})


export const getAllUser = catchAsync(async (req, res, next) => {
   const allUser = await Users.find({ role: 'user' })
   const userCount = allUser.length

   res.status(200).json({
      status: 'success',
      result: allUser.length,
      data: {
         user: {
            allUser, userCount
         }
      }
   })
})

export const adminDeleteUser = catchAsync(async (req, res, next) => {
   const User = await Users.findByIdAndDelete(req.params.userId)

   if (!User) {
      return next(new AppError('User not found', 404))
   }

   res.status(204).json({
      status: 'success',
      data: null
   })
})
export const adminFindUser = catchAsync(async (req, res, next) => {
   const User = await Users.findById(req.params.userId)

   if (!User) {
      return next(new AppError('User not found', 404))
   }

   res.status(200).json({
      status: 'success',
      data: {
         User
      }
   })
})

export const adminDeleteUserOrg = catchAsync(async (req, res, next) => {
   const org = await Organization.findByIdAndDelete(req.params.orgId)

   if (!org) {
      return next(new AppError('Organization not found', 404))
   }


   res.status(204).json({
      status: 'success',
      data: null
   })
})


export default {
   getAllUser,
   updatedMe,
   uploadUserPhoto,
   resizeUserPhoto,
   getMe,
   adminDeleteUserOrg,
   adminDeleteUser,
   adminFindUser
}