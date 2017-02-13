var express = require('express');
var path = require('path');
var favicon = require('static-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('express-session');

var passport = require('passport');
var SteamStrategy = require('passport-steam').Strategy;

var stmAPI = '3A3336E7FAEBD22160BB92B7767E4A2D';

var mongo = require('mongo-db');
var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/ihl/users');
var db = mongoose.connection;

db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
  console.log('> We have a connection captain!\n');
});

var userSchema = mongoose.Schema({
  steamid: String,
  displayname: String,
  avatar: String,
  soloRating: Number
});

var User = mongoose.model('User', userSchema);

var routes = require('./routes/index');
var users = require('./routes/users');

passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(obj, done) {
  done(null, obj);
});

passport.use(new SteamStrategy({
    returnURL: 'http://localhost:3000/auth/steam/return',
    realm: 'http://localhost:3000/',
    apiKey: stmAPI
  },
  function(identifier, profile, done) {
    process.nextTick(function () {
      profile.identifier = identifier;
      return done(null, profile);
    });
  }
));

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(session({
    secret: 'weeaboosarefuckingdisgusting',
    resave: true,
    saveUninitialized: true}));

app.use(passport.initialize());
app.use(passport.session());
app.use(express.static(__dirname + '/public'));

app.use(favicon());
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/auth/steam',
  passport.authenticate('steam'),
  function(req, res) {
    // The request will be redirected to Steam for authentication, so
    // this function will not be called.
  });

app.get('/auth/steam/return',
  passport.authenticate('steam', { failureRedirect: '/login' }),
  function(req, res) {
    var steamid = req.user._json.steamid;
    var displayname = req.user._json.personaname;
    var avatar = req.user._json.avatar;
    var authenticatedUser = new User({
      steamid: steamid,
      displayname: displayname,
      avatar: avatar,
      soloRating: 0});
    User.find({steamid: steamid}, function (err, user) {
      if(user.length == 0) {
        authenticatedUser.save();
      }
    });
    res.redirect('/');
});
app.get('/matchmaking/:type')
app.get('/logout', function(req, res){
  req.logout();
  res.redirect('/');
});

app.get('/', function(req, res) {
  var solo = -1;
  if(req.user) {
    var steamid = req.user._json.steamid;
    console.log(steamid);
    User.find({steamid: steamid}, function (err, user) {
      console.log(user);
      solo = user[0].soloRating;
      console.log(solo);
      res.render('index', { title: 'Express', user: req.user, solo: solo });
    });
  }
  else {
    res.render('index', { title: 'Express', user: req.user, solo: solo });
  }
});

// app.use('/', routes);
app.use('/users', users);

/// catch 404 and forwarding to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

/// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});

module.exports = app;
