export const catchAsync = fn => {
   return (req, res, next) => {
      fn(req, res, next).catch(err => 
         console.log('CatchAsync Error:', err),
         next(err)
      )
   }
}

export default catchAsync