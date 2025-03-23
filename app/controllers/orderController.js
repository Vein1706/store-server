const orderDao = require('../models/dao/orderDao');
const shoppingCartDao = require('../models/dao/shoppingCartDao');
const productDao = require('../models/dao/productDao');
const checkLogin = require('../middleware/checkLogin');

module.exports = {
  /**
   * Get all order information for a user
   * @param {Object} ctx
   */
  GetOrder: async ctx => {
    let { user_id } = ctx.request.body;
    // Verify if the user is logged in
    if (!checkLogin(ctx, user_id)) {
      return;
    }
    // Get all order IDs
    const ordersGroup = await orderDao.GetOrderGroup(user_id);

    // If the user has no orders, return the information directly
    if (ordersGroup.length == 0) {
      ctx.body = {
        code: '002',
        msg: 'The user does not have order information'
      }
      return;
    }

    // Get all detailed order information
    const orders = await orderDao.GetOrder(user_id);

    let ordersList = [];
    // Generate a detailed information list for each order
    for (let i = 0; i < ordersGroup.length; i++) {
      const orderID = ordersGroup[i];
      let tempOrder = [];

      for (let j = 0; j < orders.length; j++) {
        const order = orders[j];

        if (orderID.order_id == order.order_id) {
          // Get detailed information for each product
          const product = await productDao.GetProductById(order.product_id);
          order.product_name = product[0].product_name;
          order.product_picture = product[0].product_picture;

          tempOrder.push(order);
        }
      }
      ordersList.push(tempOrder);
    }

    ctx.body = {
      code: '001',
      orders: ordersList
    }

  },
  /**
   * Add order information for a user
   * @param {Object} ctx
   */
  AddOrder: async (ctx) => {
    let { user_id, products } = ctx.request.body;
    // Verify if the user is logged in
    if (!checkLogin(ctx, user_id)) {
      return;
    }

    // Get the current timestamp
    const timeTemp = new Date().getTime();
    // Generate order ID: user ID + timestamp (string)
    const orderID = +("" + user_id + timeTemp);

    let data = [];
    // Generate field information based on the database table structure
    for (let i = 0; i < products.length; i++) {
      const temp = products[i];
      let product = [orderID, user_id, temp.productID, temp.num, temp.price, timeTemp];
      data.push(...product);
    }

    try {
      // Insert order information into the database
      const result = await orderDao.AddOrder(products.length, data);

      // If insertion is successful
      if (result.affectedRows == products.length) {
        // Delete items from the shopping cart
        let rows = 0;
        for (let i = 0; i < products.length; i++) {
          const temp = products[i];
          const res = await shoppingCartDao.DeleteShoppingCart(user_id, temp.productID);
          rows += res.affectedRows;
        }
        // Check if the shopping cart was updated successfully
        if (rows != products.length) {
          ctx.body = {
            code: '002',
            msg: 'The purchase was successful, but the shopping cart was not updated successfully'
          }
          return;
        }

        ctx.body = {
          code: '001',
          msg: 'Purchase succeeded'
        }
      } else {
        ctx.body = {
          code: '004',
          msg: 'Purchase failed, unknown reason'
        }
      }
    } catch (error) {
      reject(error);
    }
  }
}