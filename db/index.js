const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGO_URI

const connectDB = async () => {
    try {
        const x = await mongoose.connect(MONGO_URI);
        console.log('Connected to Mongo:', x.connections[0].name);

    } catch (err) {
        console.log('Error connecting to Mongo: ', err)
    }
}

module.exports = connectDB;