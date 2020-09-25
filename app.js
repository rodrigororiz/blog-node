const express = require('express');
const mustache = require('mustache-express');
const cookieParse = require('cookie-parser');
const session = require('express-session');
const flash = require('express-flash');

const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;

const router = require('./routes/index');
const helpers = require('./helpers')
const errorHandler = require('./handlers/errorHandler')

//Configuracoes
const app = express();

app.use(express.json());
app.use(express.urlencoded({extended:true}));

app.use(express.static(__dirname + '/public'));

app.use(cookieParse(process.env.SECRET));
app.use(session({
    secret:process.env.SECRET,
    resave:false,
    saveUninitialized:false
}));
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());

app.use((req, res, next)=>{
    res.locals.h  = {...helpers};
    res.locals.flashes = req.flash();
    res.locals.user = req.user; 

    if(req.isAuthenticated()) {
        //filtrar menu para guest ou logged
        res.locals.h.menu = res.locals.h.menu.filter(i=>i.logged);
    } else {
        //filtrar menu para guest
        res.locals.h.menu = res.locals.h.menu.filter(i=>i.guest);
    }

    next();
});


const User = require('./models/User');
passport.use(new LocalStrategy(User.authenticate())); 
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use('/', router);

app.use(errorHandler.notFound);

app.engine('mst', mustache(__dirname + '/views/partials', '.mst'));
app.set('view engine', 'mst');
app.set('views', __dirname + '/views');

module.exports = app;