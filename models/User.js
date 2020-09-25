const mongoose = require('mongoose');
const passportLocalMongoose = require('passport-local-mongoose');

mongoose.Promise = global.Promise;

const userShema = new mongoose.Schema({ 
    name:String, 
    email:String
});

userShema.plugin(passportLocalMongoose, {usernameField: 'email'});

module.exports = mongoose.model('User', userShema);