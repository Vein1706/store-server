const Router = require('koa-router');
const shoppingCartController = require('../../controllers/shoppingCartController')

let shoppingCartRouter = new Router();

shoppingCartRouter
  .post('/user/shoppingCart/getShoppingCart', shoppingCartController.GetShoppingCart)
  .post('/user/shoppingCart/addShoppingCart', shoppingCartController.AddShoppingCart)
  .post('/user/shoppingCart/deleteShoppingCart', shoppingCartController.DeleteShoppingCart)
  .post('/user/shoppingCart/updateShoppingCart', shoppingCartController.UpdateShoppingCart)

module.exports = shoppingCartRouter;