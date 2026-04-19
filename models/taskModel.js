import mongoose from "mongoose";

const taskSchema = new mongoose.Schema({
   title: {
      type: String,
      required: true
   },
   projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'project',
      required: true
   },
   orgId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'organization',
      required: true
   },
   description: String,
   status: {
      type: String,
      enum: ['Todo', 'In-Progress', 'Done'],
      required: true
   },
   assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
   },
   dueDate: {
      type: Date
   },
   createdAt: {
      type: Date,
      default: Date.now()
   }
})

const Task = mongoose.model('Tasks', taskSchema)

export default Task