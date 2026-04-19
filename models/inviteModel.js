import mongoose from 'mongoose'
import AppError from '../utils/appError.js'

const inviteSchema = new mongoose.Schema({
   orgId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'Organization'
   },
   name: {
      type: String,
      trim: true
   },
   email: {
      type: String,
      required: true,
      trim: true
   },
   role: {
      type: String,
      required: true,
      enum: ['owner', 'admin', 'member'],
      default: 'member',
      trim: true
   },
   invitedAt: {
      type: Date,
      default: Date.now()
   }
})

const Invite = mongoose.model('invites', inviteSchema)

export default Invite