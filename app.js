// Node Modules

var express = require('express');
var path = require('path');
var favicon = require('static-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('express-session');
var request = require('request');
var passport = require('passport');
var SteamStrategy = require('passport-steam').Strategy;

//Database Initialization

var mongo = require('mongo-db');
var mongoose = require('mongoose');

var db = mongoose.createConnection('mongodb://localhost/ihl/users');
var hb = mongoose.createConnection('mongodb://localhost/ihl/heros');

db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
  console.log('> We have a connection to users captain!');
});
hb.on('error', console.error.bind(console, 'connection error:'));
hb.once('open', function() {
  console.log('> We have a connection to heroes captain!');
});

// Creation of the User Schema and Model

var userSchema = new mongoose.Schema({
  steamid: String,
  displayname: String,
  avatar: String,
  soloRating: Number,
  rank: Number,
  ass: String,
  badges: [String],
  cabRating: Number,
  cabRemain: Number
});
var User = db.model('User', userSchema);

// Creation of the Hero Schema and Model

var heroSchema = new mongoose.Schema({
  id : Number,
  name : String,
  localized_name : String,
  img : String,
  hero_id : Number,
  GPM_cal: Number,
  XPM_cal: Number,
  KPM_cal: Number,
  LHM_cal: Number,
  HDM_cal: Number,
  HHM_cal: Number,
  TD_cal: Number,
  scr_cal: String
});
var Hero = hb.model('Hero', heroSchema);

// Steam Stuff
var stmAPI = '3A3336E7FAEBD22160BB92B7767E4A2D';

// Application Administrators
var admins = ["76561198078862008", ""]
function isAdmin(user) {
  if (user) {
    var steamid = user._json.steamid;
    var ex = false;
    for (var i = 0; i < admins.length; i++) {
      if(admins[i] == steamid) {
        ex = true;
      }
    }
    return ex;
  }
  else {
    return false;
  }
}

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

app.get('/auth/steam', passport.authenticate('steam'), function(req, res) {console.log("Authenticating User");});
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
      soloRating: 0,
      rank: 1,
      ass: "Under Review",
      badges: [],
      cabRating: 0,
      cabRemain: 10
    });
    User.find({steamid: steamid}, function (err, user) {
      if(user.length == 0) {
        authenticatedUser.save();
      }
    });
    if(isAdmin(req.user)) { console.log("Admin has logged in!"); }
    res.redirect('/');
});
app.get('/logout', function(req, res){
  req.logout();
  res.redirect('/');
});

//Administration Router
app.get('/admin', function(req, res) {
  if(req.user && isAdmin(req.user)) {
    res.render('admin');
  }
  else {
    res.redirect('/');
  }
});

// Calibration Settings Handlers
app.get('/calibration', function(req,res) {
  if(req.user && isAdmin(req.user)) {
    Hero.find({}, function(err, heroes){
      heroes.sort(function(a, b) {
        return a.localized_name.localeCompare(b.localized_name);
      });
      res.render('calibration', {heroes: heroes});
    })
  }
  else {
    res.redirect('/');
  }
});
app.get('/calibration/post', function(req, res) {
  if(req.user && isAdmin(req.user)) {
    Hero.update({hero_id: req.query.hid},
      {$set: {GPM_cal: req.query.GPM, XPM_cal: req.query.XPM, KPM_cal: req.query.KPM, LHM_cal: req.query.LHM, HDM_cal: req.query.HDM, HHM_cal: req.query.HHM, TD_cal: req.query.TD, scr_cal: req.query.scr}},
      function(e) {
        console.log(req.query.hid + ": Updated!");
      });
    }
  res.redirect('/calibration');
});

// Game MMR Settings Handler


// Index Page Handler
app.get('/', function(req, res) {
  var solo = -1;
  var rank = 0;
  var acc = "N/A";
  var color = "red";
  if(req.user) {
    var steamid = req.user._json.steamid;
    User.find({steamid: steamid}, function (err, user) {
      solo = user[0].soloRating;
      rank = user[0].rank;
      acc = user[0].ass;
      switch(acc) {
        case "Banned":
          color = "red";
          break;
        case "Suspended":
          color = "orange";
          break;
        case "Active":
          color = "green";
          break;
        case "Under Review":
          color = "yellow";
          break;
      }
      res.render('index', { title: 'Express', user: req.user, solo: solo, rank: rank, ass: acc, color: color});
    });
  }
  else {
    res.render('index', { title: 'Express', user: req.user, solo: solo, rank: rank, ass: acc, color: color });
  }
});

// Index Page Loader Handler
app.get('/pageloader', function(req, res) {
  if(req.xhr) {
    res.render('pages/' + req.query.page + '.ejs');
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
