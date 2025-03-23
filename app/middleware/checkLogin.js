/**
 * Verify whether the user is logged in
 * @param {Object} ctx
 * @param {int} user_id
 * @returns
 */
module.exports = function (ctx, user_id) {
  // Check if the user ID passed in the request matches the user ID in the session
  if (user_id != ctx.session.user.user_id) {
    ctx.body = {
      code: '401',
      msg: 'The user name is not logged in. Please log in and try again'
    }
    return false;
  }
  return true;
}