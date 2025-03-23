module.exports = {
  /**
   * Validate whether the user information meets the rules
   * @param {Object} ctx
   * @param {string} userName
   * @param {string} password
   * @return: 
   */
  checkUserInfo: (ctx, userName = '', password = '') => {
    // userName = userName ? userName : '';
    // password = password ? password : '';
    // Check if empty
    if (userName.length === 0 || password.length === 0) {
      ctx.body = {
        code: '002',
        msg: 'The user name or password cannot be empty'
      }
      return false;
    }
    // Username validation rules
    const userNameRule = /^[a-zA-Z][a-zA-Z0-9_]{4,15}$/;
    if (!userNameRule.test(userName)) {
      ctx.body = {
        code: '003',
        msg: 'Invalid user name (Start with a letter, allow 5-16 bytes, allow alphanumeric underscores)'
      }
      return false;
    }
    // Password validation rules
    const passwordRule = /^[a-zA-Z]\w{5,17}$/;
    if (!passwordRule.test(password)) {
      ctx.body = {
        code: '003',
        msg: 'The password is invalid. (It must start with a letter and contain only letters, digits, and underscores.)'
      }
      return false;
    }

    return true;
  },
  /**
   * Validate whether the username meets the rules
   * @param {type} 
   * @return: 
   */
  checkUserName: (ctx, userName = '') => {
    // Check if empty
    if (userName.length === 0) {
      ctx.body = {
        code: '002',
        msg: 'The user name cannot be empty'
      }
      return false;
    }
    // Username validation rules
    const userNameRule = /^[a-zA-Z][a-zA-Z0-9_]{4,15}$/;
    if (!userNameRule.test(userName)) {
      ctx.body = {
        code: '003',
        msg: 'Invalid user name (Start with a letter, allow 5-16 bytes, allow alphanumeric underscores)'
      }
      return false;
    }

    return true;
  }
}