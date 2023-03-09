const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema(
    {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        image_Url: String,
        title: String,
        description: String,
        author: String,
        rating: Number,
        comments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Comment' }]

    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model('Book', bookSchema);