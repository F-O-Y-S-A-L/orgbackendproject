import express from 'express'
import orgController from '../controllers/orgController.js'
import authController from '../controllers/authController.js'
import inviteController from '../controllers/inviteController.js'

const route = express.Router()

route.use(authController.protect, authController.roleCheck('user', 'superadmin'))
route.get('/', orgController.getAllOrg)
route.get('/getUserOrg', orgController.getUserByOrg)
route.get('/:orgId', orgController.getOrg)
route.post('/', orgController.createOrganizations)
route.post('/:orgId/invite', inviteController.inviteSend)
route.patch('/:orgId', authController.restrictTo(['owner']), orgController.updateOrg)
route.delete('/:orgId', authController.restrictTo(['owner']), orgController.deleteOrg)

export default route