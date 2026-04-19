import mongoose from "mongoose";

const projectSchema = new mongoose.Schema({
   name: {
      type: String,
      required: true
   },
   orgId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true
   },
   description: String,
   createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
   },
   createdAt: {
      type: Date,
      default: Date.now()
   }
})

const project = mongoose.model('Project', projectSchema)

export default project