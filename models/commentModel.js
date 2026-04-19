import mongoose from "mongoose";

const commentSchema = new mongoose.Schema({
   message: {
      type: String,
      required: true
   },
   taskId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Task',
      required: true
   },
   userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
   },
   createdAt: {
      type: Date,
      default: Date.now()
   }
})

const Comment = mongoose.model('Comments', commentSchema)

export default Comment