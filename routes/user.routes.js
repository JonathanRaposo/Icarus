// GET route 
const express = require('express');
const router = express.Router();
const User = require('../models/User.model');

const fileUploader = require('../config/cloudinary.config');



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



router.post('/users/:id/profileImage', fileUploader.single('profile-image'), (req, res, next) => {
    console.log('params: ', req.params)
    const { id } = req.params;

    // if (!req.file) {
    //     res.render('users/user-profile-error.hbs', { errorMessage: 'You have not selected any picture yet. Click on the camera icon to upload.', user: req.session.currentUser });
    //     return;
    // }

    let profileImage;
    if (req.file) {
        profileImage = req.file.path;
    } else {
        profileImage = '';
    }

    User.findOne({ _id: id })
        .then((userFromDB) => {
            console.log('user: ', userFromDB.createdAt)

            const updatedUser = {
                _id: userFromDB._id,
                profile_image: profileImage,
                firstName: userFromDB.firstName,
                lastName: userFromDB.lastName,
                email: userFromDB.email,
                password: userFromDB.password,
                books: userFromDB.books,
                createdAt: userFromDB.createdAt,
                updatedAt: userFromDB.updatedAt


            }
            console.log('updated: user:', updatedUser)
            return User.findByIdAndUpdate(id, updatedUser, { new: true })

        })
        .then(() => {
            res.redirect('/userProfile');
        })
        .catch((err) => console.log('Error while updating user: ', err));
});

module.exports = router;