const mysql = require('mysql2');
require('dotenv').config(); // Load environment variables from .env file

// Create a connection pool (recommended for performance)
const pool = mysql.createPool({
  host: 'localhost',  // Replace with your MySQL host
  user: 'root',       // Replace with your MySQL username
  password: 'Srinathg99',   // Replace with your MySQL password
  database: 'expensetracker' // Replace with your MySQL database name
});

// Export the pool to be reused across the application
module.exports = pool.promise(); // Using promise wrapper for async/await support
