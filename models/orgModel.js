import mongoose from "mongoose";
import Users from '../models/userModel.js'
import Project from "../models/projectModel.js";
import Task from "../models/taskModel.js";
import Comment from "../models/commentModel.js";
import Invite from "../models/inviteModel.js";

const orgSchema = new mongoose.Schema({
   name: {
      type: String,
      required: [true, 'Please fill-up your organizations name!'],
      trim: true
   },
   ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
   },
   createdAt: {
      type: Date,
      default: Date.now()
   },
   activeMembers: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
   }]
})

orgSchema.pre('findOneAndDelete', async function () {
   const orgId = this.getQuery()._id

   const task = await Task.find({ orgId })
   const taskIds = task.map(t => t._id)

      await Users.updateMany(
         { 'organizations.orgId': orgId },
         { $pull: { organizations: { orgId } } }
      )

   await Project.deleteMany({ orgId })
   await Invite.deleteMany({ orgId })
   await Task.deleteMany({ orgId })
   await Comment.deleteMany({ taskId: { $in: taskIds } })
})

const organizations = mongoose.model('Organization', orgSchema)

export default organizations