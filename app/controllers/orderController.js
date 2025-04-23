const orderDao = require('../models/dao/orderDao');
const shoppingCartDao = require('../models/dao/shoppingCartDao');
const productDao = require('../models/dao/productDao');
const checkLogin = require('../middleware/checkLogin');
const {
  ApiError,
  CheckoutPaymentIntent,
  Client,
  Environment,
  LogLevel,
  OrdersController,
} = require('@paypal/paypal-server-sdk');
const { v4: uuidv4 } = require('uuid');

const { PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET, PORT = 8080 } = process.env;

const client = new Client({
  clientCredentialsAuthCredentials: {
    oAuthClientId: PAYPAL_CLIENT_ID,
    oAuthClientSecret: PAYPAL_CLIENT_SECRET,
  },
  timeout: 0,
  environment: Environment.Sandbox,
  logging: {
    logLevel: LogLevel.Info,
    logRequest: {
      logBody: true,
    },
    logResponse: {
      logHeaders: true,
    },
  },
});

const ordersController = new OrdersController(client);

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
   * Create PayPal order
   */
  CreatePayPalOrder: async (ctx) => {
    const { user_id, cart } = ctx.request.body;
    
    if (!checkLogin(ctx, user_id)) {
      return;
    }

    // Calculate total amount from cart
    let total = 0;
    for (let i = 0; i < cart.length; i++) {
      const temp = cart[i];
      total += temp.price * temp.quantity;
    }
      
    const collect = {
      body: {
        intent: CheckoutPaymentIntent.Capture,
        purchaseUnits: [
          {
            amount: {
              currencyCode: "HKD",
              value: String(total),
            },
          },
        ],
      },
      prefer: "return=minimal",
    };

    try {
      const { body } = await ordersController.createOrder(
        collect
      );

      ctx.body = {
        code: '001',
        orderID: JSON.parse(body).id
      };
    } catch (error) {
      console.error('PayPal order creation error:', error);
      ctx.body = {
        code: '005',
        msg: 'Failed to create PayPal order'
      };
    }
  },

  /**
   * Capture PayPal payment and create order in our system
   */
  CapturePayPalOrder: async (ctx) => {
    const { orderID } = ctx.params;
    const { user_id, products } = ctx.request.body;

    if (!checkLogin(ctx, user_id)) {
      return;
    }

    const collect = {
      id: orderID,
      prefer: "return=minimal",
    };

    try {
      // 1. Capture PayPal payment
      const { body, ...httpResponse } = await ordersController.captureOrder(
        collect
      );

      // 2. Only create order in our system if PayPal capture succeeded
      if (httpResponse.result.status === 'COMPLETED') {
        const timeTemp = new Date().getTime();
        const localOrderID = +("" + user_id + timeTemp);

        let data = [];
        for (let i = 0; i < products.length; i++) {
          const temp = products[i];
          let product = [localOrderID, user_id, temp.productID, temp.num, temp.price, timeTemp];
          data.push(...product);
        }

        // 3. Insert into our database
        const result = await orderDao.AddOrder(products.length, data);
        
        if (result.affectedRows === products.length) {
          // 4. Clear cart
          let rows = 0;
          for (let i = 0; i < products.length; i++) {
            const temp = products[i];
            const res = await shoppingCartDao.DeleteShoppingCart(user_id, temp.productID);
            rows += res.affectedRows;
          }

          ctx.status = httpResponse.statusCode;
          ctx.body = JSON.parse(body);
        }
      }
    } catch (error) {
      console.error('PayPal capture error:', error);
      ctx.body = {
        code: '006',
        msg: 'Failed to capture PayPal payment'
      };
    }
  }


}