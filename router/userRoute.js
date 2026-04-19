import express from 'express'
import authController from '../controllers/authController.js'
import userController from '../controllers/userController.js'

const route = express.Router()

route.post('/logout', authController.logout)
route.post('/signup', authController.signup)
route.post('/login', authController.login)


route.get('/verifyEmail/:verifyToken', authController.verifyEmail)
route.post('/forgotPassword', authController.forgotPassword)
route.patch('/resetPassword/:token', authController.resetPassword)

route.use(authController.protect)
route.get('/me', userController.getMe)
route.patch('/updateMe', userController.uploadUserPhoto,userController.resizeUserPhoto, userController.updatedMe)

export default route 