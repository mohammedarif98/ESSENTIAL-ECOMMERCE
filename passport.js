
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const dotenv = require('dotenv');
dotenv.config({path:".env"}); 


passport.serializeUser((user,cb)=>{
    cb(null,user);
});

passport.deserializeUser(function(user,cb){
    cb(null,user);
});

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID, 
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "http://localhost:4000/auth/google/callback",
      passReqToCallback: true, 
    },
    function (request, accessToken, refreshToken, profile, cb) {
      console.log('hello from here ',profile);
      return cb(null, profile);
    }
  )
);