/* requires */
	// require (general)
	var express = require('express'),
			router = express.Router(),
		 	app = require('../app.js');

	// hash/crypto stuff
	var bcrypt = require('bcryptjs'),
	    salt = bcrypt.genSaltSync(10),  
	    hash = bcrypt.hashSync("B4c0/\/", salt);

	// require (authentication stuff)
	var UserModel = require('../models/User.js'),
	    passport = UserModel.passport,
	    LocalStrategy = require('passport-local').Strategy,
			UserDetails = UserModel.UserDetails;

// home page
	router.get('/', function(req, res) {
	  res.render('login', {title: 'Login', errors: req.cookies.errors});
	});

// login methods
	router.get('/login', function(req, res) {
	  res.cookie('errors', []);
		// UserModel.printAll(); // prints all User data
	  res.render('login', {title: 'Login', errors: req.cookies.errors});
	});

	router.post('/login', function(req, res, next) {
		passport.authenticate('local', function(err, user, info) {
			if (err)	return next(err);

			if (!user) {		// if can't authenticate, redirect back to login
				res.cookie('errors', ['Invalid username or password.']);
				return res.redirect('/login'); 
			}

			req.logIn(user, function(err) {
				if (err)			return next(err);
				res.cookie('username', user.username);
				res.cookie('errors', []);
				return res.redirect('/users/' + user.username);
			});
		})(req, res, next);
	});

// users
// add_user methods
	router.get('/add_user', function(req, res) {
		// only the admin may add a user
		if (req.cookies.username != 'admin') {
			res.cookie('errors', ['You do not have the right permissions to perform this action.']);
			return res.redirect('/login');
		}
	  res.cookie('errors', []);
	  res.render('add_user', {title:"Add user", errors: req.cookies.errors});
	});

	function username_inuse(username) {
		// return false;
		var u = UserDetails.findOne({ 'username': username, }, 
																function(err, user) { return (!err  &&  user);  });
		console.log("\n\nu= %j\n\n", u);
	}

	router.post('/add_user', function(req, res) {
		if (req.body.password2 != req.body.password) {
			res.cookie('errors', ["Please make sure your passwords match."]);
			return res.redirect('/add_user');
		}

	/* 	UserModel.printAll(); // prints all User data
			// console.log('username_inuse(username)= ' + username_inuse(username));
			// if (username_inuse('a')) {
			// 	console.log('INUSE');
			// 	res.cookie('errors', ['That username has already been used, sorry!']);
			// 	return res.redirect('/register');
			// } else {
	*/
	/*			// bcrypt.genSalt(10, function(err, salt) {
					// bcrypt.hash('k', salt, function(err, hash) {
						// console.log('hash:' + hash);

						// var query = UserDetails.findOne({ 'username': 'Ghost' });
						// // execute the query at a later time
						// query.exec(function (err, u) {
						// 	if (err) return handleError(err);
						//   console.log('%s %s is a %s.', u.name.first, u.name.last, u.occupation) // Space Ghost is a talk show host.
						// })
	*/

						UserDetails.find({'username': req.body.username }, function(err, u) {
				      if (err)    return done(err);
							console.log('u.username= %s', u.username);
							// var users = u; //JSON.stringify(eval("(" + u + ")"));
							// console.log('---\nusers= %s\nreq.body.username= %s', u, req.body.username);
				//       if (u !== '[]')  {
								// console.log('users.username !== undefined');
								// res.cookie('errors', ['That username has already been used, sorry!']);
								// return res.redirect('/register');	
							// } else {
								// console.log('users.username === undefined');
								UserModel.addUser(req.body.username, req.body.username);
								// // UserModel.salt_fn(pw);
								res.redirect('/login');
							// }

			    });
				// });
			// });

		// }
	});

// passport stuff
	passport.serializeUser(function(user, done) {
	  done(null, user);
	});
	 
	passport.deserializeUser(function(user, done) {
	  done(null, user);
	});

	passport.use(new LocalStrategy(function(username, password, done) {
	  process.nextTick(function() {
	    UserDetails.findOne({ 'username': username, }, function(err, user) {
	      if (err)    	done(err);
	      if (!user)  	return done(null, false);

				if (user.password != password)		return done(null, false);
				else	          									return done(null, user);

	    //   bcrypt.compareSync(password, hash, function(err, res) {
	    //   	if (false)		return done(null, false);
	    //   	else 					return done(null, user);
	    // 		// res == true
	  		// });

	/*
	      bcrypt.genSalt(10, function(err, salt) {
	        bcrypt.hash('k', salt, function(err, hash) {
	          console.log('hash:' + hash);
	          console.log('password:' + user.password);
	          // res.redirect('/login');
	          if (user.password != hash)
	            return done(null, false, { message: 'Invalid login credentials' });
	          else
	            return done(null, user);

	        });
	      });
	*/
	    });
	  });
	}));

	// passport.use(new LocalStrategy(function(username, password, done) {
	//   process.nextTick(function() {
	//     // Auth Check Logic
	//   });
	// }));

module.exports = router;
module.exports.salt = salt;
module.exports.hash = hash;