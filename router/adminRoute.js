import express from 'express'
import userController from '../controllers/userController.js'
import inviteController from '../controllers/inviteController.js'
import authController from '../controllers/authController.js'

const route = express.Router()

//admin
route.use(authController.protect)
route.delete('/user/:userId', userController.adminDeleteUser)
route.get('/', userController.getAllUser)
route.get('/:userId', userController.adminFindUser)
route.get('/invite', inviteController.getAllInvite)
route.delete('/org/:orgId', userController.adminDeleteUserOrg)

export default route 