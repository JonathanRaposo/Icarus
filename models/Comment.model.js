const mongoose = require('mongoose');
const { Schema } = mongoose;

const commentSchema = new Schema(
    {
        user: { type: Schema.Types.ObjectId, ref: 'User' },
        content: String
    }
);

module.exports = mongoose.model('Comment', commentSchema);