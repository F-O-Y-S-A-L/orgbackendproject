import express from 'express'
import commentController from '../controllers/commentController.js'
import authController from '../controllers/authController.js'
import notification from '../controllers/notification.js'

const route = express.Router()

route.use(authController.protect)
route.post('/:taskId', commentController.commentCreate)
route.get('/:comId', commentController.getComment)
route.get('/', commentController.getAllComment)
route.get('/notification', notification.getAllNotifycation)

route.patch('/:comId', commentController.updateComment)
route.delete('/:comId', commentController.deleteComment)

export default route