const Koa = require('koa');
const KoaStatic = require('koa-static');
const KoaBody = require('koa-body');
const Session = require('koa-session');
const cors = require('@koa/cors');
require('dotenv').config();

let { Port, staticDir } = require('./config');

let app = new Koa();

const corsOptions = {
  origin: '*', // Allow all origins (adjust as needed for security)
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // Allowed HTTP methods
  allowHeaders: ['Content-Type', 'Authorization'], // Allowed headers
};

// defense csrf
app.use(cors(corsOptions));

// handle error
const error = require('./app/middleware/error');
app.use(error);

// flow limit
const flowLimit = require('./app/middleware/flowLimit');
app.use(flowLimit);

// rewrite url for static resources
const rewriteUrl = require('./app/middleware/rewriteUrl');
app.use(rewriteUrl);
app.use(KoaStatic(staticDir));

// session
const CONFIG = require('./app/middleware/session');
app.keys = ['session app keys'];
app.use(Session(CONFIG, app));

// islogin
const isLogin = require('./app/middleware/isLogin');
app.use(isLogin);

app.use(async (ctx, next) => {
  ctx.state.user = ctx.session.user;
  await next();
});

// handle request
const koaBodyConfig = require('./app/middleware/koaBodyConfig');
app.use(KoaBody(koaBodyConfig));

// router middleware
const Routers = require('./app/routers');
app.use(Routers.routes()).use(Routers.allowedMethods());

app.listen(Port, () => {
  console.log(`server start at port ${ Port }`);
});