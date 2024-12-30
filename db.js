const mongoose = require('mongoose');
require('dotenv').config();
const connectionString = process.env.MONGODB_URI;

mongoose.connect(connectionString)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('Error connecting to MongoDB:', err));

module.exports = mongoose;