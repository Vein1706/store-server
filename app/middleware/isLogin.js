module.exports = async (ctx, next) => {
  if (ctx.url.startsWith('/user/')) {
    if (!ctx.session.user) {
      ctx.body = {
        code: '401',
        msg: 'User is not logged in, please log in before proceeding'
      }
      return;
    }
  }
  await next();
}