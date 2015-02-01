//Base SetUp-----------

//Call The packages------------

var express = require('express'); // call express
var app = express(); //define our app using express
var bodyParser = require('body-parser'); // get body-parser
var morgan = require('morgan'); // used to see requests
var mongoose = require('mongoose'); // for working w/ our database
var port = process.env.PORT || 8080; // set the port for our app
var User = require('./model/user');
var jwt = require('jsonwebtoken');
var superSecret = 'Y9ygygAnoopAkila';

// APP CONFIGURATION ---------------------
// use body parser so we can grab information from POST requests
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

// configure our app to handle CORS requests
app.use(function (req, res, next) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST');
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type, \ Authorization');
    next();
});

//connect to our database
mongoose.connect('mongodb://angulardb:RMS1985NY@ds063869.mongolab.com:63869/anoop_angular');

//log all the request to console
app.use(morgan('dev'));

//Routes for our API

//basic route for the home page

app.get('/', function (req, res) {
    res.send('Welcome to the Home Page');
});

var apiRouter = express.Router();// get an instance of the express router

//route for Authentication is placed before middleware because we dont want this to be protected

apiRouter.post('/authenticate', function (req, res) {

    // find the user
    // select the name username and password explicitly
    User.findOne({
        username: req.body.username
    }).select('name username password').exec(function (err, user) {
        if (err) throw err;
        // no user with that username was found
        if (!user) {
            res.json({success: false, message: 'Authentication failed. User not found.'});
        } else if (user) {
            // check if password matches
            var validPassword = user.comparePassword(req.body.password);
            if (!validPassword) {
                res.json({success: false, message: 'Authentication failed. Wrong password.'});
            } else {

                // if user is found and password is right
                // create a token
                var token = jwt.sign({
                    name: user.name,
                    username: user.username
                }, superSecret, {
                    expiresInMinutes: 1440 // expires in 24 hours
                });

                // return the information including token as JSON
                res.json({
                    success: true,
                    message: 'Enjoy your token!',
                    token: token
                });
            }
        }
    });
});

/*// route middleware to verify a token
apiRouter.use(function (req, res, next) {

    // check header or url parameters or post parameters for token
    var token = req.body.token || req.param('token') || req.headers['x-access-token'];

    // decode token
    if (token) {

        // verifies secret and checks exp
        jwt.verify(token, superSecret, function (err, decoded) {
            if (err) {
                return res.status(403).send({success: false, message: 'Failed to authenticate token.'});
            } else {
                // if everything is good, save to request for use in other routes
                req.decoded = decoded;
                console.log("Some one visited out App!!!");
                next();
            }
        });

    } else {
        // if there is no token
        // return an HTTP response of 403 (access forbidden) and an error message
        return res.status(403).send({
            success: false, message: 'No token provided.'
        });

    }
});*/

//test the router if its working

apiRouter.get('/', function (req, res) {
    res.json({message: 'hooray! welcome to our api!'});
});
//More routes for API will happen soon

// api endpoint to get user information
apiRouter.get('/me', function (req, res) {
    res.send(req.decoded);
});

apiRouter.route('/users')

    //get all the users

    .get(function (req, res) {
        User.find(function (err, users) {
            if (err) res.send(err);

            //return all the users

            res.json(users);
        })
    })
//create a user (accessed at POST http://localhost:8080/api/users)
    .post(function (req, res) {

        // create a new instance of the User model
        var user = new User();

        // set the users information (comes from the request)
        user.name = req.body.name;
        user.username = req.body.username;
        user.password = req.body.password;

        // save the user and check for errors
        user.save(function (err) {
            if (err) {
                // duplicate entry
                if (err.code == 11000)
                    return res.json({
                        success: false, message: 'A user with that username already exists. '
                    });
                else
                    return res.send(err);
            }

            res.json({message: 'User created!'});
        });

    });

// on routes that end in /users/:user_id
// ----------------------------------------------------
apiRouter.route('/users/:user_id')

    // get the user with that id // (accessed at GET http://localhost:8080/api/users/:user_id)
    .get(function (req, res) {
        User.findById(req.params.user_id, function (err, user) {
            if (err) res.send(err);

            // return that user
            res.json(user);
        });
    })
    //modify the user Id
    .put(function (req, res) {
        User.findById(req.params.user_id, function (err, user) {
            if (err) res.send(err);

            //Update the user only ifs its present

            if (req.body.name) user.name = req.body.name;
            if (req.body.username) user.username = req.body.username;
            if (req.body.password) user.password = req.body.password;

            // save the user and check for errors
            user.save(function (err) {
                if (err) res.send(err);

                res.json({message: 'User Updated!'});
            });
        });
    })

//delete a User
    .delete(function (req, res) {
        User.remove({
                _id: req.param.user_id
            },
            function (err, user) {
                if (err) return res.send(err);
                res.json({message: 'Successfully deleted'});
            });
    });


//Register our router -----------

app.use('/api', apiRouter);

//Start the Node Js server
app.listen(port);
console.log('Magic happens on port ' + port);