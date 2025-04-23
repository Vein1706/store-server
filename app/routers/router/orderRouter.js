const Router = require('koa-router');
const orderController = require('../../controllers/orderController')

let orderRouter = new Router();

orderRouter
  .post('/user/order/getOrder', orderController.GetOrder)
  .post('/user/order/createPayPalOrder', orderController.CreatePayPalOrder)
  .post('/user/order/capturePayPalOrder/:orderID', orderController.CapturePayPalOrder);

module.exports = orderRouter;