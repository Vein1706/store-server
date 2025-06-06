const db = require('./db.js');

module.exports = {
  // 连接数据库获取所有的订单id
  GetOrderGroup: async (user_id) => {
    let sql = 'select order_id from orders where user_id = ? order by order_id desc';
    return await db.query(sql, user_id);
  },
  // 连接数据库获取所有的订单详细信息
  GetOrder: async (user_id) => {
    let sql = 'select * from orders where user_id =? order by order_time desc';
    return await db.query(sql, user_id);
  },
  // 连接数据库插入订单信息
  AddOrder: async (length, data) => {
    let sql = 'insert into orders values(null,?,?,?,?,?,?)';
    for (let i = 0; i < length - 1; i++) {
      sql += ",(null,?,?,?,?,?,?)"
    }

    return await db.query(sql, data);
  }
}