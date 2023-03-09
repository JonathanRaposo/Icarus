const express = require('express');
const router = express.Router();
const bycript = require('bcryptjs');
const User = require('../models/User.model');



//middleware to protect routes:
const { isLoggedIn, isLoggedOut } = require('../middleware/route-guard');


//GET route - show signup from  to user:

router.get('/signup', isLoggedOut, (req, res, next) => {
    res.render('auth/signup.hbs');
})

//POST route - process form to create user:

router.post('/signup', isLoggedOut, (req, res, next) => {
    console.log('***form:', req.body)

    const { firstName, lastName, email, password } = req.body;


    //make sure all fields are filled:
    if (!firstName || !lastName || !email || !password) {
        res.status(400).render('auth/signup.hbs', { errorMessage: 'All fields must be filled.' });
        return;
    }
    // make sure email format is correct:

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    if (!emailRegex.test(email)) {
        res.status(400).render('auth/signup.hbs', { errorMessage: 'Provide a valid email address.' });
        return;
    }

    // use regex to validate password format:
    const passwordRegex = /(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,}/;
    if (!passwordRegex.test(password)) {
        res.status(400).render('auth/signup.hbs', { errorMessage: 'Password must have at least 6 chars and contain at least one number, one lowercase and one uppercase.' });
        return;
    }


    //hash password:
    const saltRounds = 10;
    const salt = bycript.genSaltSync(10);
    const hashPassword = bycript.hashSync(password, salt);

    User.create({
        firstName,
        lastName,
        email,
        password: hashPassword
    })
        .then((userFromDB) => {
            console.log('New user created: ', userFromDB)

            // create session with new user:
            req.session.currentUser = userFromDB;

            res.redirect('/userProfile');
        })
        .catch((err) => {
            console.log('Something went wrong creating new user: ', err)
            //if duplicate:
            if (err.code === 11000) {
                res.status(500).render('auth/signup.hbs', { errorMessage: 'Email already exists' })
            }
            else {
                next(err);
            }
        });


});




//GET route -show login form

router.get('/login', isLoggedOut, (req, res) => {
    res.render('auth/login.hbs');
});

// POST route -process login form

router.post('/login', (req, res, next) => {


    const { email, password } = req.body

    // make sure all fields are filled
    if (!email || !password) {
        res.status(400).render('auth/login.hbs', { errorMessage: 'Provide email and password to login.' })
        return;
    }

    User.findOne({ email: email })
        .then((user) => {
            if (!user) {
                res.status(400).render('auth/login.hbs', { errorMessage: 'Email is not registered.Try with another email.' });
                return
            }
            else if (bycript.compareSync(password, user.password)) {

                //save user in the sessioin

                req.session.currentUser = user;
                res.redirect('/userProfile')
            }
            else {
                res.status(400).render('auth/login', { errorMessage: 'Incorrect password.' })
            }
        })
        .catch((err) => {
            console.log('Error logging in', err)
            next(err);
        });

});

// show user profile

router.get('/userProfile', isLoggedIn, (req, res, next) => {


    const { _id } = req.session.currentUser;
    console.log('user id:', _id)
    User.findById(_id)
        .populate('books')
        .then((userFromDB) => {
            console.log('User from DB: ', userFromDB)
            res.render('users/user-profile.hbs', { user: userFromDB, session: req.session.currentUser });
        })



})


// POST route- logout user

router.post('/logout', (req, res, next) => {
    req.session.destroy((err) => {
        if (err) {
            next(err)
        }
        res.redirect('/');
    });
});






module.exports = router;