const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcrypt');
const User = require("../models/user");

module.exports = function(passport) {
    passport.use(
        new LocalStrategy({usernameField : 'email'}, (email, password, done)=> {

            User.findOne({email: email})
            .then((user)=>{
                if(!user) {
                    return done(null,false,{message: 'that email is not registered.'});
                }

            bcrypt.compare(password, user.password,(err, isMatch)=>{
                if(err) throw err;

                if(isMatch){
                    return done(null,user);
                } else {
                    return done(null,false,{message : 'pass incorrect'});
                }
             })
            })
            .catch((err)=> {console.log(err)})
        })
    )

    passport.serializeUser(function(user,done) {
        done(null,user.id);
    })
    passport.deserializeUser(function(id,done){
        User.findById(id,function(err,user){
            done(err,user);
        })
    });
};
