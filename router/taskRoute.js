import express from 'express'
import authController from '../controllers/authController.js'
import taskController  from '../controllers/taskController.js'
import commentController from '../controllers/commentController.js'

const route = express.Router()

route.use(authController.protect)
route.post('/:projectId', taskController.taskCreate)
route.get('/:taskId', taskController.getTask)
route.get('/', taskController.getAllTask)
route.get('/:projectId/task', taskController.getTaskbyProject)
route.get('/:taskId/comments', commentController.getCommentsByTaskId)

route.use(authController.roleCheck('superadmin', 'user'))
route.patch('/:taskId', taskController.updateTask)
route.delete('/:taskId', taskController.deleteTask)

export default route