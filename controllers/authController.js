import jwt from 'jsonwebtoken'
import crypto from 'crypto'
import catchAsync from '../utils/catchAsync.js'
import Users from '../models/userModel.js'
import AppError from '../utils/appError.js'
import sendEmail from '../utils/email.js'
import { io } from '../utils/socket-oi.js'
import { promisify } from 'util'
import Project from '../models/projectModel.js'
import notification from '../controllers/notification.js'


const signToken = id => {
   return jwt.sign({ id }, process.env.SECRET_KEY, {
      expiresIn: process.env.JWT_EXPIRES_IN
   })
}


const createSendToken = (user, statusCode, res) => {
   const token = signToken(user._id)

   const cookieOptions = {
      expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000),
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production' ? true : false
   };

   res.cookie('jwt', token, cookieOptions);

   user.password = undefined

   res.status(statusCode).json({
      status: 'success',
      token: token,
      data: {
         user
      }
   })
}

export const signup = catchAsync(async (req, res, next) => {
   const newUser = await Users.create({
      name: req.body.name.trim(),
      email: req.body.email.trim().toLowerCase(),
      password: req.body.password.trim()
   })

   const verificationToken = newUser.createEmailVerificationToken()
   await newUser.save({ validateBeforeSave: false })

   const verifyURL = `${process.env.FRONTEND_URI}/verifyEmail/${verificationToken}`

   const newNotification = await notification.notifications('SignUp', newUser._id, `Sign Up Successfully`, newUser._id, Date.now())

   const html = `
         <div style="font-family: Arial, sans-serif; line-height: 1.6;">
            <h2 style="color: #4CAF50;">Welcome to Our Website 🎉</h2>
            <p>Thank you for signing up, ${newUser.email}!</p>
            <p>Please verify your account by clicking the button below:</p>
            <a href="${verifyURL}" 
               style="display:inline-block; padding:10px 20px; background:#4CAF50; color:#fff; 
                      text-decoration:none; border-radius:5px; font-weight:bold;">
               Verify My Account
            </a>
            <p style="margin-top:20px; font-size:12px; color:#888;">
               This link will expire in 10 minutes.
            </p>
         </div>
      `

   io.emit('SignupUser', {
      message: newNotification.message,
      notification: newNotification
   })

   try {
      await sendEmail({
         email: newUser.email,
         subject: 'Your verifycation token valid for (10 minute)',
         html
      })

      res.status(201).json({
         status: 'pending'
      })
   } catch (err) {
      newUser.emailVerificationToken = undefined;
      newUser.emailVerificationExpires = undefined;
         await newUser.save({ validateBeforeSave: false })

      return next(new AppError('There was an error sending email. Try again later!', 500))
   }
})

export const login = catchAsync(async (req, res, next) => {
   const { email, password } = req.body

   if (!email || !password) {
      return next(new AppError('Please provide your email or password', 400))
   }

   const user = await Users.findOne({ email }).select('+password')

   if (!user || !(await user.correctPassword(password, user.password))) {
      return next(new AppError('Incorrect email or password'))
   }

   const newNotification = await notification.notifications('Login', user._id, `Logged in successfully`, user._id, Date.now())

   io.to('LoginUser', {
      message: newNotification.message,
      notification: newNotification
   })

   createSendToken(user, 200, res)
})

export const logout = catchAsync(async (req, res, next) => {
   res.cookie('jwt', 'loggedout', {
      expires: new Date(Date.now()),
      httpOnly: true
   })

   io.emit('LogoutUser', {
      message: 'Logout successfully'
   })

   res.status(200).json({
      status: 'Logged Out',
      message: 'Logged out successfully'
   })
})

export const protect = catchAsync(async (req, res, next) => {
   let token;
   if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1]
   }

   if (!token && req.cookies && req.cookies.jwt) {
      token = req.cookies.jwt;
   }

   if (!token) {
      return next(new AppError('You are not logged in! Please log in get access.', 401))
   }

   const decoded = await promisify(jwt.verify)(token, process.env.SECRET_KEY)

   const currentUser = await Users.findById(decoded.id)

   if (!currentUser) {
      return next(new AppError('The user belonging to this token does no longer exist.'))
   }

   if (currentUser.changePasswordAfter(decoded.iat)) {
      return next(new AppError('User recently changed password! Please log in again', 401))
   }

   req.user = currentUser
   next()
})


export const verifyEmail = catchAsync(async (req, res, next) => {
   const hashedTokenEmail = crypto.createHash('sha256').update(req.params.verifyToken).digest('hex')

   const user = await Users.findOne({
      emailVerificationToken: hashedTokenEmail,
      emailVerificationExpires: { $gt: Date.now() }
   })

   if (!user) {
      return next(new AppError('Token is invalid or has expired', 400))
   }

   user.isVerified = true
   user.emailVerificationExpires = undefined
   user.emailVerificationToken = undefined
   await user.save()

   createSendToken(user, 200, res)
})

export const forgotPassword = catchAsync(async (req, res, next) => {
   const user = await Users.findOne({ email: req.body.email })

   if (!user) {
      return next(new AppError('There is no user with email address.', 404))
   }

   const resetToken = user.createPasswordResetToken()
   await user.save({ validateBeforeSave: false })

   const resetURL = `${req.protocol}://192.168.0.103:3000/forgotPassword/${resetToken}`


   const html = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6;">
         <h2 style="color: #f44336;">Reset Your Password 🔑</h2>
         <p>Hello ${user.email},</p>
         <p>You requested to reset your password. Click the button below:</p>
         <a href="${resetURL}" 
            style="display:inline-block; padding:10px 20px; background:#f44336; color:#fff; 
                   text-decoration:none; border-radius:5px; font-weight:bold;">
            Reset My Password
         </a>
         <p style="margin-top:20px; font-size:12px; color:#888;">
            This link will expire in 10 minutes. If you did not request this, please ignore.
         </p>
      </div>
   `

   try {
      await sendEmail({
         email: user.email,
         subject: 'Your password reset token valid for (10 minute)',
         html
      })

      res.status(200).json({
         status: 'success',
         message: 'Token send to email'
      })
   } catch (err) {
      user.passwordResetToken = undefined
      user.passwordResetExpires = undefined
      await user.save({ validateBeforeSave: false })

      return next(new AppError('There was an error sending the email. Try again later!', 500))
   }
})

export const resetPassword = catchAsync(async (req, res, next) => {
   const hashedTokenPass = crypto.createHash('sha256').update(req.params.token).digest('hex')

   const user = await Users.findOne({
      passwordResetToken: hashedTokenPass,
      passwordResetExpires: { $gt: Date.now() }
   })

   if (!user) {
      return next(new AppError('Token is invalid or has expired', 404))
   }

   user.password = req.body.password
   user.passwordResetExpires = undefined,
      user.passwordResetToken = undefined
   await user.save()

   createSendToken(user, 200, res)
})

export const restrictTo = (roles) => {
   return async (req, res, next) => {
      try {
         const user = req.user
         let orgId = req.params.orgId || req.body.orgId || req.query.orgId || null

         if (user.role === 'superadmin') {
            return next()
         }
         if (!orgId && req.params.projectId) {
            const project = await Project.findById(req.params.projectId)
            if (!project) return next(new AppError('Project not found.', 404))
            orgId = project.orgId
         }

         if (!orgId) {
            return next(new AppError('Organization ID is required', 404))
         }


         const memberShip = user.organizations.find(org => org.orgId.toString() === orgId.toString())

         if (!memberShip) {
            return next(new AppError('Membership not found', 403));
         }

         if (!roles.map(r => r.toLowerCase()).includes(memberShip.role.toLowerCase())) {
            return next(new AppError('You do not have permission to perform this action', 403));
         }

         next()
      } catch (error) {
         next(error)
      }
   }
}

export const roleCheck = (...roles) => {
   return (req, res, next) => {
      if (!roles.includes(req.user.role)) {
         return next(new AppError('You do not have permission to perform this actions.', 400))
      }
      next()
   }
}

export default {
   signup,
   login,
   verifyEmail,
   forgotPassword,
   resetPassword,
   protect,
   restrictTo,
   logout,
   roleCheck
}