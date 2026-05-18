const passport = require('passport')

var GoogleStrategy = require('passport-google-oauth2').Strategy;

var FacebookStrategy = require('passport-facebook').Strategy;


passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: "http://localhost:3001/api/auth/google/callback",
  passReqToCallback: true
},
  function (request, accessToken, refreshToken, profile, done) {
    // User.findOrCreate({ googleId: profile.id }, function (err, user) {
    //   return done(err, user);
    // });
    return done(null, profile)
  }
));

passport.use(new FacebookStrategy({
  clientID: process.env.FACEBOOK_APP_ID,
  clientSecret: process.env.FACEBOOK_APP_SECRET,
  callbackURL: "http://localhost:3001/api/auth/facebook/callback",
  passReqToCallback: true,
  profileFields: ["id", "email", "name", "displayName", "picture.type(large)"]
},
  function (request, accessToken, refreshToken, profile, done) {

    return done(null, profile)
  }
));

// module.exports = passport