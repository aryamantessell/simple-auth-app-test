const express = require('express');
const passport = require('passport');
const OIDCStrategy = require('passport-azure-ad').OIDCStrategy;
const session = require('express-session');

const app = express();
const port = process.env.PORT || 3000;

// Use session middleware
app.use(session({
  secret: 'your_secret_key',
  resave: false,
  saveUninitialized: true
}));

app.use(passport.initialize());
app.use(passport.session());

// Azure AD B2C Configuration
const b2cOptions = {
  identityMetadata: `https://azuretenanttest2.b2clogin.com/azuretenanttest2.onmicrosoft.com/B2C_1_SignUpSignInTest/v2.0/.well-known/openid-configuration`,
  clientID: 'c3104b88-52f4-4515-819f-0318e0a431e7',
  clientSecret: process.env.B2C_CLIENT_SECRET,  // Use environment variable
  responseType: 'code id_token',
  responseMode: 'form_post',
  redirectUrl: 'https://testapp123456-g6c2a5hng6etcsa5.eastus-01.azurewebsites.net/auth/callback',
  allowHttpForRedirectUrl: true,
  validateIssuer: false,
  passReqToCallback: false,
  scope: ['openid', 'profile'],
  loggingLevel: 'info',
  isB2C: true
};


passport.use(new OIDCStrategy(b2cOptions, (iss, sub, profile, accessToken, refreshToken, done) => {
  if (!profile.oid) {
    return done(new Error("No OID found in user profile."));
  }
  // Save user profile info
  return done(null, profile);
}));

// Serialize user to the session
passport.serializeUser((user, done) => {
  done(null, user);
});

// Deserialize user from the session
passport.deserializeUser((user, done) => {
  done(null, user);
});

// Routes

// Home route
app.get('/', (req, res) => {
  if (req.isAuthenticated()) {
    res.send(`Hello, ${req.user.displayName}! You are authenticated!`);
  } else {
    res.send('Hello! Please <a href="/login">login</a>.');
  }
});

// Login route
app.get('/login', passport.authenticate('azuread-openidconnect'));

// Callback route
app.post('/auth/callback', 
  passport.authenticate('azuread-openidconnect', { failureRedirect: '/' }),
  (req, res) => {
    res.redirect('/');
  }
);

// Logout route
app.get('/logout', (req, res) => {
  req.logout(() => {
    res.redirect('/');
  });
});

// Start the server
app.listen(port, () => {
  console.log(`App listening on port ${port}`);
});
