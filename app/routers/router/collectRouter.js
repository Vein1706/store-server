const Router = require('koa-router');
const collectController = require('../../controllers/collectController')

let collectRouter = new Router();

collectRouter
  .post('/user/collect/addCollect', collectController.AddCollect)
  .post('/user/collect/getCollect', collectController.GetCollect)
  .post('/user/collect/deleteCollect', collectController.DeleteCollect)

module.exports = collectRouter;