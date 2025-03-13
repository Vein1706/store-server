const Router = require('koa-router');
const userController = require('../../controllers/userController')

let userRouter = new Router();

userRouter
  .post('/users/login', userController.Login)
  .post('/users/miniProgramLogin', userController.miniProgramLogin)
  .post('/users/findUserName', userController.FindUserName)
  .post('/users/register', userController.Register)

module.exports = userRouter;