require('dotenv').config()
const express = require('express');
const app = express();
const hbs = require('hbs');
const path = require('path');
const logger = require('morgan');
const cookieParser = require('cookie-parser')
const session = require('express-session');
const MongoStore = require('connect-mongo');
// connect to database
require('./db/index');



//add session middleware
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: true,
    saveUninitialized: false,
    cookie: {
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
    },
    store: MongoStore.create({
        mongoUrl: process.env.MONGODB_URI || 'mongodb://localhost:27017/Icarus',
        ttl: 60 * 60 * 24
    })

}));



//in development environment the app logs
app.use(logger('dev'));
//to have access to the body property in the request
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(cookieParser());

// Normalizes the path to the views folder
app.set('views', path.join(__dirname, 'views'));
// set view engine to handlebars
app.set('view engine', 'hbs');
// set public folder to accessable througout the app
app.use(express.static(path.join(__dirname, 'public')))


const capitalize = require('./utils/capitalize');
app.locals.appTitle = capitalize('Icarus');
app.locals.year = new Date().getFullYear();

// add routes here


const indexRoutes = require('./routes/index.routes');
app.use('/', indexRoutes);

const BookRoutes = require('./routes/book.routes');
app.use('/', BookRoutes);

const authRoutes = require('./routes/auth.routes');
app.use('/', authRoutes);

const userRoutes = require('./routes/user.routes');
app.use('/', userRoutes);



// this middleware runs whenever requested page is not available 
app.use((req, res, next) => {
    res.status(404).render('not-found')

})

// whenever you call next(err), this middleware will handle error. Always logs the error
app.use((err, req, res, next) => {
    console.error('>>>>>>>middleware caught error: ', req.method, req.path, err);

    // only render if the error ocurred before sending the response
    if (!res.headersSent) {
        res.status(500).render('error')
    }

})

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
})

