const express = require('express');
const router = express.Router()
const Book = require('../models/Book.model');
const User = require('../models/User.model');
const Comment = require('../models/Comment.model')

const { isLoggedIn } = require('../middleware/route-guard');

// load fileuploader:
const fileUploader = require('../config/cloudinary.config');


// GET route - display form to create book:

router.get('/books/create', isLoggedIn, (req, res) => {
    res.render('books/book-create.hbs');
})



//POST route - Process form to actually create book:

router.post('/books/create', fileUploader.single('image-cover'), (req, res, next) => {
    console.log('request body: ', req.body);
    console.log('File object: ', req.file)

    const { _id } = req.session.currentUser; // user id

    const { title, description, author, rating } = req.body;

    if (!title || !description || !author || !rating) {
        res.status(400).render('books/book-create.hbs', { errorMessage: 'Provide itle, author, description and rating.' })

    }

    let imageUrl;
    if (req.file) {
        imageUrl = req.file.path;
    } else {
        imageUrl = '';
    }



    Book.create({
        image_Url: imageUrl,
        title,
        description,
        author,
        rating,
        user: _id
    })
        .then((bookFromDB) => {
            console.log('New book created: ', bookFromDB);

            return User.findByIdAndUpdate(_id, { $push: { books: bookFromDB._id } })
        })
        .then(() => {
            res.redirect('/books')
        })
        .catch((err) => {
            console.log('Error while creating book: ', err)
            next(err)
        });


})

// GET route -display the form to update a specific book:

router.get('/books/edit', isLoggedIn, (req, res, next) => {

    const { bookId } = req.query;

    Book.findById(bookId)
        .then((bookToEdit) => {

            res.render('books/book-edit.hbs', { book: bookToEdit });
        })
        .catch((err) => {
            next(err)
        });
})
// POST route - process the form to update a specific book

router.post('/books/edit', fileUploader.single('image-cover'), (req, res, next) => {
    console.log('Query params: ', req.query);
    console.log('File object:', req.file)
    console.log('request Body: ', req.body)

    const { bookId } = req.query;
    const { title, author, description, existingImage } = req.body;

    if (!title || !description || !author) {
        res.render('books/book-edit.hbs', { errorMessage: 'Provide title, author and description.' });
        return;
    }
    let imageUrl;

    if (req.file) {
        imageUrl = req.file.path;
    } else {
        imageUrl = existingImage;
    }
    Book.findByIdAndUpdate(bookId,
        {
            title,
            author,
            description,
            image_Url: imageUrl
        },
        { new: true })
        .then((updatedBook) => {
            res.redirect(`/books/${updatedBook._id}`)
        })
        .catch((err) => next(err));
});



//POST route -  delete a book 

router.post('/books/:bookId/delete', (req, res, next) => {

    const { bookId } = req.params;

    Book.findById(bookId)
        .then((bookFromDB) => {
            console.log('book to be deleted: ', bookFromDB);

            //get user who posted the book
            const userId = bookFromDB.user;

            return User.findByIdAndUpdate(userId, { $pull: { books: bookFromDB._id } })

        })
        .then(() => {
            return Book.findByIdAndRemove(bookId)
        })
        .then(() => {
            res.redirect('/books');
        })
        .catch((err) => next(err));
});

//  GET route - retrieve all books
router.get('/books', (req, res, next) => {

    Book.find()
        .populate('user')
        .then((booksFromDB) => {
            res.render('books/books-list.hbs', { books: booksFromDB })
        })
        .catch((err) => {
            console.log('Error while getting books: ', err)
            next(err)
        })
});


//GET route- search query by author or title:

router.get('/books/search', (req, res, next) => {


    const { q: query } = req.query;

    Book.find({
        $or: [
            { title: { '$regex': query, '$options': 'i' } },
            { author: { '$regex': query, '$options': 'i' } }

        ]
    })
        .then((results) => {
            console.log('Results: ', results)
            res.status(200).render('books/book-search-results.hbs', { books: results, query: query })
        })
        .catch((err) => {
            console.log('Error while searching for book: ', err);
            next(err);
        });
});



// GET route - retrieve a specific books

router.get('/books/:bookId', (req, res, next) => {


    const { bookId } = req.params;
    Book.findOne({ _id: bookId })
        .populate('user comments')
        .populate({
            path: 'comments',
            populate: {
                path: 'user',
                model: 'User'

            }
        })
        .then((theBook) => {
            console.log('details ======>', theBook)
            res.render('books/book-details.hbs', theBook)
        })
        .catch((err) => {
            console.log('Error while retrieving book details: ', err);
            next(err)
        })
})

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