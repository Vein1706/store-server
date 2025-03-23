const resourcesDao = require('../models/dao/resourcesDao');
module.exports = {
  /**
   * Get carousel data
   * @param {Object} ctx
   */
  Carousel: async ctx => {
    let carousel = await resourcesDao.Carousel();
    ctx.body = {
      code: '001',
      carousel
    }
  }
}