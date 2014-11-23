var express = require('express');
var router = express.Router();

var app = require('../app');


/* GET home page. */
router.all('/oauth/code', app.oauth.authCodeGrant());
router.all('/oauth/token', app.oauth.grant());

module.exports = router;
