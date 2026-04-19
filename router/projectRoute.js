import express from 'express'
import authController from '../controllers/authController.js'
import projectController from '../controllers/projectController.js'

const route = express.Router()

route.use(authController.protect , authController.roleCheck('user', 'superadmin'))
route.get('/userByProject', projectController.getUserbyProject)
route.get('/:orgId/project', projectController.getProjectbyOrg)
route.post('/:orgId', projectController.createProject)
route.get('/:projectId', projectController.getProject)
route.get('/', projectController.getAllProject)
route.patch('/:projectId', authController.restrictTo(['owner', 'admin']), projectController.updateProject)
route.delete('/:projectId', authController.restrictTo(['owner', 'admin']), projectController.deleteProject)

export default route