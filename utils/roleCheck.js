export const projectRoleCheck = (req, project) => {
   if(req.user.role === 'superadmin') return true
   const roleCheck = req.user.organizations.find(
      org => org.orgId.toString() === project.orgId.toString()
   )
   
   const isOwner = roleCheck && roleCheck.role.toLowerCase() === 'owner'
   const isCreator = project.createdBy.toString() === req.user._id.toString()
   
   return isOwner || isCreator
}

export const taskRoleCheck = (req, task) => {
   if(req.user.role === 'superadmin') return true
   const roleCheck = req.user.organizations.find(
      org => org.orgId.toString() === task.orgId.toString()
   )
   
   const isOwner = roleCheck && roleCheck.role.toLowerCase() === 'owner'
   const isCreator = task.assignedTo.toString() === req.user._id.toString()
   const isAdmin = isCreator && roleCheck && roleCheck.role.toLowerCase() === 'admin'
   
   return isOwner || isAdmin || isCreator
}

export const commentRoleCheck = (req, comment, task) => {
   if(req.user.role === 'superadmin') return true
   const taskOwnerId = comment.userId.toString() === req.user._id.toString()

   const roleCheck = req.user.organizations.find(org => 
      org.orgId.toString() === task.orgId.toString()
   )

   const isOwner = roleCheck && roleCheck.role.toLowerCase() === 'owner'
   const isAdmin = roleCheck && roleCheck.role.toLowerCase() === 'admin'
   
   return taskOwnerId || isOwner || isAdmin
}

export default { projectRoleCheck, taskRoleCheck, commentRoleCheck }