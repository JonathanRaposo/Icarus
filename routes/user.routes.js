// GET route 
const express = require('express');
const router = express.Router();
const User = require('../models/User.model');


router.get('/users/:userId/books', (req, res, next) => {
    console.log('user params: ', req.params)
    const { userId } = req.params;
    User.findById(userId)
        .populate('books')
        .then((userFromDB) => {
            console.log('user: ', userFromDB)
            res.render('users/user-book-list.hbs', { user: userFromDB })
        })

        .catch((err) => {
            console.log('Error while retrieving user from DB: ', err);
            next(err);
        });

});


module.exports = router;