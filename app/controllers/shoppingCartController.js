const shoppingCartDao = require('../models/dao/shoppingCartDao');
const productDao = require('../models/dao/productDao');
const checkLogin = require('../middleware/checkLogin');

let methods = {
  /**
   * Generate detailed shopping cart information
   * @param {Object} data
   */
  ShoppingCartData: async data => {
    let shoppingCartData = [];
    for (let i = 0; i < data.length; i++) {
      const temp = data[i];
      const product = await productDao.GetProductById(temp.product_id);

      let shoppingCartDataTemp = {
        id: temp.id,
        productID: temp.product_id,
        productName: product[0].product_name,
        productImg: product[0].product_picture,
        price: product[0].product_selling_price,
        num: temp.num,
        maxNum: Math.floor(product[0].product_num / 2),
        check: false
      };

      shoppingCartData.push(shoppingCartDataTemp);
    }
    return shoppingCartData;
  }
}

module.exports = {
  /**
   * Get shopping cart information
   * @param {Object} ctx
   */
  GetShoppingCart: async ctx => {
    let { user_id } = ctx.request.body;
    // Validate if the user is logged in
    if (!checkLogin(ctx, user_id)) {
      return;
    }
    // Get shopping cart information
    const shoppingCart = await shoppingCartDao.GetShoppingCart(user_id);
    // Generate detailed shopping cart information
    const data = await methods.ShoppingCartData(shoppingCart);

    ctx.body = {
      code: '001',
      shoppingCartData: data
    }
  },
  /**
   * Add shopping cart information
   * @param {Object} ctx
   */
  AddShoppingCart: async ctx => {
    let { user_id, product_id } = ctx.request.body;
    // Validate if the user is logged in
    if (!checkLogin(ctx, user_id)) {
      return;
    }

    let tempShoppingCart = await shoppingCartDao.FindShoppingCart(user_id, product_id);
    // Check if the user's shopping cart already contains the product
    if (tempShoppingCart.length > 0) {
      // If it exists, increment the quantity by 1
      const tempNum = tempShoppingCart[0].num + 1;

      const product = await productDao.GetProductById(tempShoppingCart[0].product_id);
      const maxNum = Math.floor(product[0].product_num / 2);
      // Check if the quantity exceeds the purchase limit
      if (tempNum > maxNum) {
        ctx.body = {
          code: '003',
          msg: 'The quantity reached the purchase limit ' + maxNum
        }
        return;
      }

      try {
        // Update shopping cart information, increment the quantity by 1
        const result = await shoppingCartDao.UpdateShoppingCart(tempNum, user_id, product_id);

        if (result.affectedRows === 1) {
          ctx.body = {
            code: '002',
            msg: 'The item is already in the cart, quantity +1'
          }
          return;
        }
      } catch (error) {
        reject(error);
      }
    } else {
      // If it does not exist, add it
      try {
        // Insert new shopping cart information
        const res = await shoppingCartDao.AddShoppingCart(user_id, product_id);
        // Check if the insertion was successful
        if (res.affectedRows === 1) {
          // If successful, get the shopping cart information for the product
          const shoppingCart = await shoppingCartDao.FindShoppingCart(user_id, product_id);
          // Generate detailed shopping cart information
          const data = await methods.ShoppingCartData(shoppingCart);

          ctx.body = {
            code: '001',
            msg: 'Add cart successfully',
            shoppingCartData: data
          }
          return;
        }
      } catch (error) {
        reject(error);
      }
    }

    ctx.body = {
      code: '005',
      msg: 'Add cart failed, unknown reason'
    }
  },
  /**
   * Delete shopping cart information
   * @param {Object} ctx
   */
  DeleteShoppingCart: async ctx => {
    let { user_id, product_id } = ctx.request.body;
    // Validate if the user is logged in
    if (!checkLogin(ctx, user_id)) {
      return;
    }

    // Check if the user's shopping cart contains the product
    let tempShoppingCart = await shoppingCartDao.FindShoppingCart(user_id, product_id);

    if (tempShoppingCart.length > 0) {
      // If it exists, delete it
      try {
        const result = await shoppingCartDao.DeleteShoppingCart(user_id, product_id);
        // Check if the deletion was successful
        if (result.affectedRows === 1) {
          ctx.body = {
            code: '001',
            msg: 'Deleted cart successfully'
          }
          return;
        }
      } catch (error) {
        reject(error);
      }
    } else {
      // If it does not exist, return a message
      ctx.body = {
        code: '002',
        msg: 'The item is not in the shopping cart'
      }
    }
  },
  /**
   * Update the quantity of items in the shopping cart
   * @param {Object} ctx
   */
  UpdateShoppingCart: async ctx => {
    let { user_id, product_id, num } = ctx.request.body;
    // Validate if the user is logged in
    if (!checkLogin(ctx, user_id)) {
      return;
    }
    // Check if the quantity is less than 1
    if (num < 1) {
      ctx.body = {
        code: '004',
        msg: 'Illegal quantity'
      }
      return;
    }
    // Check if the user's shopping cart contains the product
    let tempShoppingCart = await shoppingCartDao.FindShoppingCart(user_id, product_id);

    if (tempShoppingCart.length > 0) {
      // If it exists, update it

      // Check if the quantity has changed
      if (tempShoppingCart[0].num == num) {
        ctx.body = {
          code: '003',
          msg: 'The quantity has not changed'
        }
        return;
      }
      const product = await productDao.GetProductById(product_id);
      const maxNum = Math.floor(product[0].product_num / 2);
      // Check if the quantity exceeds the purchase limit
      if (num > maxNum) {
        ctx.body = {
          code: '004',
          msg: 'The quantity reached the purchase limit ' + maxNum
        }
        return;
      }

      try {
        // Update shopping cart information
        const result = await shoppingCartDao.UpdateShoppingCart(num, user_id, product_id);
        // Check if the update was successful
        if (result.affectedRows === 1) {
          ctx.body = {
            code: '001',
            msg: 'Modifying the number of shopping carts succeeded'
          }
          return;
        }
      } catch (error) {
        reject(error);
      }
    } else {
      // If it does not exist, return a message
      ctx.body = {
        code: '002',
        msg: 'The item is not in the shopping cart'
      }
    }
  }
}