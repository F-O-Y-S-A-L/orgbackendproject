import express from 'express'
import authController from '../controllers/authController.js'
import notification from '../controllers/notification.js'

const route = express.Router()

route.use(authController.protect, authController.roleCheck('user', 'superadmin'))
route.get('/user', notification.getUserNotification)
route.get('/unread-count', notification.getUnreadCount)
route.get('/mark-as-read', notification.markAsRead)
route.delete('/:notifiId', notification.DeleteUserNotification)
route.get('/', notification.getAllNotifycation)

export default route