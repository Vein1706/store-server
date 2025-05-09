const RateLimit = require('koa2-ratelimit').RateLimit;
const { flowLimit } = require('../../config');

const limiter = RateLimit.middleware({
    interval: flowLimit.duration, // time window
    max: flowLimit.max,           // limit each IP to max requests
    message: 'Too many requests, please try again later.',
});

module.exports = limiter;
