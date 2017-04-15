var express = require('express');
const _ = require('lodash');
const validator = require('validator');
var exphbs = require('express-handlebars');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser'); //to parse json
var mongo = require('mongodb');
const {ObjectID} = require('mongodb');


var router = express.Router();

var {User} = require('../models/user');


var {authenticate} = require('../middleware/authenticate');

// POST /users
router.post('/', (req, res) => {
  var body = _.pick(req.body, ['email', 'password']);
  var user = new User(body);

  user.save().then(() => {
    return user.generateAuthToken();
  }).then((token) => {
    var response={"status":"success","user":{"_id":user._id,"email":user.email}};
    res.header('x-auth', token).send(response);
  }).catch((e) => {
    res.status(400).send(e);
  })
});

router.get('/me', authenticate, (req, res) => {
  res.send(req.user);
});

router.post('/login', (req, res) => {
  var body = _.pick(req.body, ['email', 'password']);

  User.findByCredentials(body.email, body.password).then((user) => {
    return user.generateAuthToken().then((token) => {

    var response={"status":"success","user":{"_id":user._id,"email":user.email}};
      res.header('x-auth', token).send(response);
    });
  }).catch((e) => {
    res.status(400).send();
  });
});

router.delete('/me/token', authenticate, (req, res) => {
  req.user.removeToken(req.token).then(() => {
    res.status(200).send({"status":"success"});
  }, () => {
    res.status(400).send();
  });
});


module.exports = router;
