require('dotenv').config({ path: '../.env' })
const books = require('../data/jsonData.json');
const Book = require('../models/Book.model');
const mongoose = require('mongoose')
const connectDB = require('../db/index');


//connect to DB
connectDB()

Book.create(books)
    .then((booksFromDB) => {
        console.log(`Imported ${booksFromDB.length} books.`)
        mongoose.connection.close();
    })
    .catch((err) => console.log('Error while importing books to DB: ', err))


