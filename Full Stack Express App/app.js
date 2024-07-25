const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const expenseRoutes = require('./routes/expenseRoutes');
const app = express();

app.use(bodyParser.json());
app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/api/expenses', expenseRoutes);

app.listen(3000, () => {
  console.log("Server running on port 3000");
});
