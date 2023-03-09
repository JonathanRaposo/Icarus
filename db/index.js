const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/Icarus';


mongoose.connect(MONGO_URI)
    .then((x) => console.log(`Connected to Mongo, database name: ${x.connections[0].name}`))
    .catch((err) => console.log('Error connecting to Mongo, ', err))