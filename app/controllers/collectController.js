const collectDao = require('../models/dao/collectDao');
const productDao = require('../models/dao/productDao');
const checkLogin = require('../middleware/checkLogin');

module.exports = {
  /**
   * 添加收藏
   * @param {Object} ctx
   */
  AddCollect: async ctx => {
    let { user_id, product_id } = ctx.request.body;

    // 校验用户是否登录
    if (!checkLogin(ctx, user_id)) {
      return;
    }

    // 判断该用户的收藏列表是否存在该商品
    let tempCollect = await collectDao.FindCollect(user_id, product_id);

    if (tempCollect.length > 0) {
      ctx.body = {
        code: '003',
        msg: 'This item has been added to my favorites, please go to my favorites'
      }
      return;
    }

    // 获取当前时间戳
    const timeTemp = new Date().getTime();
    try {
      // 把收藏商品信息插入数据库
      const result = await collectDao.AddCollect(user_id, product_id, timeTemp);
      // 插入成功
      if (result.affectedRows === 1) {
        ctx.body = {
          code: '001',
          msg: 'Add favorites successfully'
        }
        return;
      }
    } catch (error) {
      reject(error);
    }

    ctx.body = {
      code: '002',
      msg: 'Add favorites failed'
    }
  },
  /**
   * 获取用户的所有收藏商品信息
   * @param {Object} ctx
   */
  GetCollect: async ctx => {
    let { user_id } = ctx.request.body;
    // 校验用户是否登录
    if (!checkLogin(ctx, user_id)) {
      return;
    }
    // 获取所有收藏信息
    const collect = await collectDao.GetCollect(user_id);

    // 该用户没有收藏的商品,直接返回信息
    if (collect.length == 0) {
      ctx.body = {
        code: '002',
        msg: 'The user has no favorites'
      }
      return;
    }

    let collectList = [];
    // 生成收藏商品的详细信息列表
    for (let i = 0; i < collect.length; i++) {
      const temp = collect[i];
      // 获取每个商品详细信息
      const product = await productDao.GetProductById(temp.product_id);
      collectList.push(product[0]);
    }

    ctx.body = {
      code: '001',
      collectList: collectList
    }
  },
  /**
   * 删除用户的收藏商品信息
   * @param {Object} ctx
   */
  DeleteCollect: async ctx => {
    let { user_id, product_id } = ctx.request.body;
    // 校验用户是否登录
    if (!checkLogin(ctx, user_id)) {
      return;
    }

    // 判断该用户的收藏列表是否存在该商品
    let tempCollect = await collectDao.FindCollect(user_id, product_id);

    if (tempCollect.length > 0) {
      // 如果存在则删除
      try {
        const result = await collectDao.DeleteCollect(user_id, product_id);
        // 判断是否删除成功
        if (result.affectedRows === 1) {
          ctx.body = {
            code: '001',
            msg: 'Succeeded in deleting a collection'
          }
          return;
        }
      } catch (error) {
        reject(error);
      }
    } else {
      // 不存在则返回信息
      ctx.body = {
        code: '002',
        msg: 'This item is not on the Favorites list'
      }
    }
  }
}