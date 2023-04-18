const express = require('express');
const router = express.Router()
const Book = require('../models/Book.model');
const User = require('../models/User.model');
const Comment = require('../models/Comment.model');

// load middlware to protect routes:
const { isLoggedIn } = require('../middleware/route-guard');

// load fileuploader:
const fileUploader = require('../config/cloudinary.config');

// load id generator: 
const { v4: uuuidV4 } = require('uuid');

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


    let newBook;
    Book.create({
        image_Url: imageUrl,
        title,
        description,
        author,
        rating,
        user: _id,
        book_id: uuuidV4()
    })
        .then((bookFromDB) => {
            console.log('New book created: ', bookFromDB);
            newBook = bookFromDB;

            return User.findByIdAndUpdate(_id, { $push: { books: bookFromDB._id } })
        })
        .then(() => {
            return User.findByIdAndUpdate(_id, { $push: { books_id: newBook.book_id } })


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

router.post('/books/delete', (req, res, next) => {

    console.log('Query Params: ', req.query)
    const { original } = req.query;
    const { custom } = req.query;
    const { _id } = req.session.currentUser;
    console.log('current user id: ', _id)

    let user_FromDB;
    User.findById(_id)
        .populate('books')
        .then((userfromDB) => {
            user_FromDB = userfromDB;
            console.log('current user info: ', userfromDB)
            const books = userfromDB.books;

            for (let i = 0; i < books.length; i++) {
                if (books[i].book_id === custom) {
                    let book_fromDB
                    Book.findById(original)
                        .then((bookFromDB) => {
                            book_fromDB = bookFromDB;
                            return User.findByIdAndUpdate(_id, { $pull: { books: bookFromDB._id } })
                        })
                        .then(() => {

                            return User.findByIdAndUpdate(_id, { $pull: { books_id: book_fromDB.book_id } })
                        })
                        .then(() => {
                            return Book.findByIdAndRemove(original)

                        })
                        .then(() => {
                            console.log(`Book # ${original} was removed`)
                            res.redirect('/books')
                        })
                    return;
                } else if (books[i].book_id !== custom) {
                    console.log('You are not authorized to delete this book.')
                    res.render('books/book-unauthorized.hbs');
                    return;


                } else if (user_FromDB.books === 0) {
                    return;
                }
            }

        })
        .catch((err) => {
            console.log('Error while deleting book: ', err);
            next(err)
        })

});

//  GET route - retrieve all books
router.get('/books', (req, res, next) => {

    Book.find()
        .populate('user comments')
        .then((booksFromDB) => {
            console.log('Book list: ', booksFromDB)
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
            console.log('Book details ===>>>:', theBook)
            res.render('books/book-details.hbs', { book: theBook })
        })
        .catch((err) => {
            console.log('Error while retrieving book details: ', err);
            next(err)
        })
})


module.exports = router;