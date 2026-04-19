import mongoose from "mongoose";

const activeSchema = new mongoose.Schema({
   action: {
      type: String,
      required: true
   },
   orgId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'organization',
      required: true
   },
   userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
   },
   targetType: {
      type: String,
      requierd: true
   },
   targetId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true
   },
   createdAt: {
      type: Date,
      default: Date.now()
   }
})


const Activitylog = mongoose.model('Activitylog', activeSchema)

export default Activitylog