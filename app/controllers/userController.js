const rp = require('request-promise');
const userDao = require('../models/dao/userDao');
const { checkUserInfo, checkUserName } = require('../middleware/checkUserInfo');

module.exports = {

  /**
   * User login
   * @param {Object} ctx
   */
  Login: async ctx => {

    let { userName, password } = ctx.request.body;

    // Validate whether the user information meets the rules
    if (!checkUserInfo(ctx, userName, password)) {
      return;
    }

    // Connect to the database and query user information based on username and password
    let user = await userDao.Login(userName, password);
    // If the result set length is 0, it means the user does not exist
    if (user.length === 0) {
      ctx.body = {
        code: '004',
        msg: 'Incorrect username or password'
      }
      return;
    }

    // The database ensures the username is unique
    // If the result set length is 1, it means the user exists
    if (user.length === 1) {

      const loginUser = {
        user_id: user[0].user_id,
        userName: user[0].userName
      };
      // Save user information to session
      ctx.session.user = loginUser;

      ctx.body = {
        code: '001',
        user: loginUser,
        msg: 'Login successfully'
      }
      return;
    }

    // The database ensures the username is unique
    // If user.length != 1 || user.length != 0
    // Return an unknown error
    // This should not normally occur
    ctx.body = {
      code: '500',
      msg: 'Unknown error'
    }
  },
  /**
   * Mini Program user login
   * @param {Object} ctx
   */
  miniProgramLogin: async ctx => {
    const appid = 'wxeb6a44c58ffde6c6';
    const secret = '9c40f33cf627f2e3a42f38b25e0687cc';
    let { code } = ctx.request.body;

    const api = `https://api.weixin.qq.com/sns/jscode2session?appid=${ appid }&secret=${ secret }&js_code=${ code }&grant_type=authorization_code`;
    // After obtaining the temporary login credential code through the wx.login interface,
    // send it to the developer server to call this interface and complete the login process.
    const res = await rp.get({
      json: true,
      uri: api
    })
    const { session_key, openid } = res;

    // Connect to the database and query user information based on username
    let user = await userDao.FindUserName(openid);
    if (user.length === 0) {
      // If the result set length is 0, it means the user does not exist, register first
      try {
        // Connect to the database and insert user information
        let registerResult = await userDao.Register(openid, openid);
        if (registerResult.affectedRows === 1) {
          // If the number of rows affected by the operation is 1, it means registration was successful
          await login(); // Login
        }
      } catch (error) {
        console.log(error)
      }
    } else if (user.length === 1) {
      // If the user already exists, log in directly
      await login();
    } else {
      ctx.body = {
        code: '500',
        msg: 'Unknown error'
      }
    }
    async function login () {
      // Connect to the database and query user information based on username and password
      let tempUser = await userDao.Login(openid, openid);
      if (tempUser.length === 0) {
        // Login failed
        ctx.body = {
          code: '004',
          msg: 'Login failed'
        }
        return;
      }
      if (tempUser.length === 1) {
        // Login successful
        const loginUser = {
          user_id: tempUser[0].user_id,
          openId: openid,
          sessionKey: session_key
        };
        // Save user information to session
        ctx.session.user = loginUser;

        ctx.body = {
          code: '001',
          userId: tempUser[0].user_id,
          msg: 'Login succeeded'
        }
        return;
      }
    }
  },
  /**
   * Check if a username exists, used for front-end validation during registration
   * @param {Object} ctx
   */
  FindUserName: async ctx => {
    let { userName } = ctx.request.body;

    // Validate whether the username meets the rules
    if (!checkUserName(ctx, userName)) {
      return;
    }
    // Connect to the database and query user information based on username
    let user = await userDao.FindUserName(userName);
    // If the result set length is 0, it means the user does not exist and can register
    if (user.length === 0) {
      ctx.body = {
        code: '001',
        msg: 'The user name does not exist. You can sign up'
      }
      return;
    }

    // The database ensures the username is unique
    // If the result set length is 1, it means the user exists and cannot register
    if (user.length === 1) {
      ctx.body = {
        code: '004',
        msg: 'The user name already exists and cannot be signed up'
      }
      return;
    }

    // The database ensures the username is unique
    // If user.length != 1 || user.length != 0
    // Return an unknown error
    // This should not normally occur
    ctx.body = {
      code: '500',
      msg: 'Unknown error'
    }
  },
  Register: async ctx => {
    let { userName, password } = ctx.request.body;

    // Validate whether the user information meets the rules
    if (!checkUserInfo(ctx, userName, password)) {
      return;
    }
    // Connect to the database and query user information based on username
    // First, check if the user already exists
    let user = await userDao.FindUserName(userName);

    if (user.length !== 0) {
      ctx.body = {
        code: '004',
        msg: 'The user name already exists and cannot be signed up'
      }
      return;
    }

    try {
      // Connect to the database and insert user information
      let registerResult = await userDao.Register(userName, password);
      // If the number of rows affected by the operation is 1, it means registration was successful
      if (registerResult.affectedRows === 1) {
        ctx.body = {
          code: '001',
          msg: 'Sign up successfully'
        }
        return;
      }
      // Otherwise, registration failed
      ctx.body = {
        code: '500',
        msg: 'Sign up failed, unknown reason'
      }
    } catch (error) {
      reject(error);
    }
  }
};