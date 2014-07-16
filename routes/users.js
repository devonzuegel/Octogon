var express = require('express');
var router = express.Router();
// var formidable = require('formidable');
var api_mgr = require('./apiManager');
var request = require("request");

// require (authentication stuff)
var UserModel = require('../models/User.js'),
    passport = UserModel.passport,
    LocalStrategy = require('passport-local').Strategy,
		UserDetails = UserModel.UserDetails;

function require_privileges(req, res, include_msgs, admin_fn, user_fn) {
  if (req.isAuthenticated() && req.session.is_admin) {
    admin_fn(req, res);
  } else {
    if (include_msgs)   req.flash('error', 'You do not have permission to perform that action.');
    if (!req.isAuthenticated()) res.redirect('../login');
    else    user_fn(req, res);
  }
}

router.get('/', function(req, res) {
  require_privileges(req, res, true, 
                     function() {
                          UserDetails.find({}, function(err, all_users) {
                            if (err)    return done(err);
                            res.render('all_users', { title: 'Portfolio', 
                                                      errors: req.flash('error'),
                                                      companies: all_users,
                                                      tab: 'companies',
                                                      username: req.session.username,
                                                      is_admin: true  });
                          });
                      }, function() { 
                          res.redirect('/users/' + req.session.username); 
                      }
  );
});


// add_user methods
router.get('/add_user', function(req, res) {
  require_privileges(req, res, true,
                     function() {  return;  },
                     function() {  return res.redirect('/users/' + req.session.username);  }
  );

  res.render('add_user', { title:"New Company", 
                           is_admin: true, 
                           errors: undefined,
                           username: req.session.username,
                           tab: 'companies' }
  );
});

router.post('/add_user', function(req, res) {

  if (req.body.password2 != req.body.password) {
    res.cookie('errors', ["Please make sure your passwords match."]);
    return res.redirect('/users/add_user');
  }

  if (false/*username_inuse(req.body.username)*/) {
    res.cookie('errors', ["That username is already in use."]);
    return res.redirect('/users/add_user');      
  }

  // console.log('res:  ' + JSON.stringify(req));

  UserDetails.find({'username': req.body.username }, function(err, u) {
    if (err)    return done(err);
    console.log('req.body.init_investmt_date:  %j', req.body.init_investmt_date);
    UserModel.addUser(req.body.username, req.body.password, req.body.init_investmt_date);
    res.redirect('/users/');
  });

});

router.get('/:username', function(req, res) {
  var u_param = req.params.username; // gets :username from the url
  if (u_param == 'add_user')    res.redirect('/users/add_user');
  var u_session = req.session.username;

  require_privileges(req, res, false, 
                     function() { return }, 
                     function() {
                          if (u_session != u_param) {
                            // req.flash('error', 'You do not have permission to perform that action.');
                            res.redirect('/users/' + u_session);
                          }
                      }
  );
  UserDetails.findOne({ 'username': u_param, }, function(err, user) {
    if (err)    return done(err);
    if (user == null  ||  u_param == 'admin') {
      req.flash('error', 'That company doesn\'t exist! Here are your options:.')
      return res.redirect('/users');
    } else {
      // var options = { host: 'api.crunchbase.com/',
      //                 port: 443,
      //                 path: 'v/2/organization/Addepar?user_key=c7653c536c2266d0da1155557600c8a4"',
      //                 method: 'GET',
      //                 headers: { 'Content-Type': 'application/json' }
      //               };
      // api_mgr.getJSON(options, function(res) {
        // I could work with the result html/json here.  I could also just return it
        // console.log("onResult: (" + res.statusCode + ")" + JSON.stringify(result));
        // res.statusCode = statusCode;
        // res.send(result);
        request("http://api.crunchbase.com/v/2/organization/Addepar?user_key=c7653c536c2266d0da1155557600c8a4", function(error, res, body) {
          console.log(body);
        });
        return res.render('users', {errors: req.flash('error'), 
                                    username: req.session.username,
                                    c: user,
                                    title: u_param,
                                    is_admin: (u_session == 'admin'),
                                    tab: (u_session == 'admin') ? 'companies' : ''
                                    }
                          );  
      // });
    }
  });
});


module.exports = router;
module.exports.require_privileges = require_privileges;