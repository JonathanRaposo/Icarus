const mongoose = require('mongoose');


const userSchema = new mongoose.Schema(
    {
        profile_image: String,
        firstName: String,
        lastName: String,

        email: {
            type: String,
            required: [true, '>>>mongoose error:Email is required.'],
            unique: true,
            lowercase: true,
            trim: true
        },
        password: {
            type: String,
            required: [true, '>>>mongoose error:Password is required.']
        },
        books: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Book' }],
        books_id: []
    },

    {
        timestamps: true
    }
);

module.exports = mongoose.model('User', userSchema);