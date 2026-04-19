import express from 'express'
import Activitylog from '../controllers/Activitylog.js'
import authController from '../controllers/authController.js'

const route = express.Router()

route.use(authController.protect,authController.roleCheck('superadmin'))
route.get('/', Activitylog.getActivitylog)
route.delete('/:id', Activitylog.DeleteActivityLog)


export default route