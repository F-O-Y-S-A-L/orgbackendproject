import mongoose from "mongoose";
import validator from 'validator';
import bcrypt from "bcryptjs";
import crypto from "crypto";
import Organization from "../models/orgModel.js";
import Project from "../models/projectModel.js";
import Task from "../models/taskModel.js";
import Comment from "../models/commentModel.js";

const userSchema = new mongoose.Schema({
   name: {
      type: String,
      required: [true, 'Please provide your name']
   },
   email: {
      type: String,
      unique: true,
      lowarcase: true,
      required: [true, 'Please provide your email'],
      validate: [validator.isEmail, 'Please provide your email']
   },
   password: {
      type: String,
      required: [true, 'Please provide your password'],
      maxlength: 8,
      select: false
   },
   photo: {
      type: String,
      default: 'default.jpg'
   },
   isVerified: Boolean,
   organizations: [
      {
         orgId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Organization'
         },
         role: {
            type: String,
            enum: ['owner', 'admin', 'member'],
            required: true
         }
      }
   ],
   role: {
      type: String,
      enum: ['superadmin', 'user'],
      default: 'user'
   },
   createdAt: {
      type: Date,
      default: Date.now()
   },
   emailVerificationToken: String,
   emailVerificationExpires: Date,
   passwordResetToken: String,
   passwordResetExpires: Date,
   passwordChangedAt: Date
})

userSchema.pre('findOneAndDelete', async function () {
   const ownerId = this.getQuery()._id

   await Organization.deleteMany({ ownerId })
   await Project.deleteMany({ createdBy: ownerId })
   await Task.deleteMany({ assignedTo: ownerId })
   await Comment.deleteMany({ userId: ownerId })
})

userSchema.pre('save', async function () {
   if (!this.isModified('password')) return

   this.password = await bcrypt.hash(this.password, 12)
})

userSchema.pre('save', async function (next) {
   if (!this.isModified('password') || this.isNew) {
      return next
   }

   this.passwordChangedAt = Date.now() - 1000
})

userSchema.methods.correctPassword = async function (candidatePassword, userPassword) {
   return await bcrypt.compare(candidatePassword, userPassword)
}

userSchema.methods.createEmailVerificationToken = function () {
   const verificationToken = crypto.randomBytes(32).toString('hex')

   this.emailVerificationToken = crypto
      .createHash('sha256')
      .update(verificationToken)
      .digest('hex')

   this.emailVerificationExpires = Date.now() + 10 * 60 * 1000
   return verificationToken
}

userSchema.methods.createPasswordResetToken = function () {
   const resetToken = crypto.randomBytes(32).toString('hex')

   this.passwordResetToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex')

   this.passwordResetExpires = Date.now() + 10 * 60 * 1000

   console.log('resetToken:', resetToken, 'passwordResetToken:', (this.passwordResetToken));
   return resetToken
}

userSchema.methods.changePasswordAfter = function (jwtTimestamp) {
   if (this.passwordChangedAt) {
      const changeTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10)

      return jwtTimestamp < changeTimestamp
   }
   return false
}

const user = mongoose.model('User', userSchema)

export default user