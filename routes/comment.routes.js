const express = require('express');
const router = express.Router();


const { isLoggedIn } = require('../middleware/route-guard');

const Comment = require('../models/Comment.model');
const Book = require('../models/Book.model');


//  POSt- to make comments:
router.post('/books/:bookId/comment', isLoggedIn, (req, res, next) => {


    const { bookId } = req.params;   // book id
    const { content } = req.body;   // comment;
    const userId = req.session.currentUser._id; // user id


    Comment.create({ content, user: userId })
        .then((commentFromDB) => {
            return Book.findByIdAndUpdate(bookId, { $push: { comments: commentFromDB._id } });
        })
        .then((updatedBook) => {
            res.redirect(`/books/${updatedBook._id}`);
        })
        .catch((err) => {
            console.log('Error while creating comment: ', err);
            next(err);
        });


});

module.exports = router;