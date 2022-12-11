const express = require('express');
const router = express.Router();
const app = express();
const mongoose = require('mongoose');
const expressEjsLayout = require('express-ejs-layouts');
const flash = require('connect-flash');
const session = require('express-session');
const passport = require('passport');

require("./config/passport")(passport);

mongoose.connect('mongodb://localhost/test', {useNewUrlParser: true, useUnifiedTopology:true})
.then(() => console.log('Connected to MDB'))
.catch((err)=> console.log(err));

app.set('view engine', 'ejs');
app.use(expressEjsLayout);

app.use(express.urlencoded({extended: false}));

app.use(session({
  secret: 'secret',
  resave: true,
  saveUninitialized: true
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());
app.use((req,res,next) => {
  res.locals.success_msg = req.flash('success_msg');
  res.locals.error_msg = req.flash('error_msg');
  res.locals.error = req.flash('error');
next();
})

app.use(express.static(__dirname + "/public/"));

app.use('/', require('./routes/index'));
app.use('/users', require('./routes/users'))


app.listen(3001, function() {
  console.log("Server started on port 3001.");
});
