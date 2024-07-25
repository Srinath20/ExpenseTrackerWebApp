const mysql = require('mysql2');

const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'Srinathg99',
  database: 'expensetracker'
});

db.connect(err => {
  if (err) throw err;
  console.log('Connected to the database.');
});

exports.getAllExpenses = (req, res) => {
  const sql = 'SELECT * FROM expenses';
  db.query(sql, (err, results) => {
    if (err) throw err;
    res.json(results);
  });
};

exports.createExpense = (req, res) => {
  const { amount, description, category } = req.body;
  const sql = 'INSERT INTO expenses (amount, description, category) VALUES (?, ?, ?)';
  db.query(sql, [amount, description, category], (err, result) => {
    if (err) throw err;
    res.json({ id: result.insertId, amount, description, category });
  });
};

exports.updateExpense = (req, res) => {
  const { id } = req.params;
  const { amount, description, category } = req.body;
  const sql = 'UPDATE expenses SET amount = ?, description = ?, category = ? WHERE id = ?';
  db.query(sql, [amount, description, category, id], (err) => {
    if (err) throw err;
    res.json({ id, amount, description, category });
  });
};

exports.deleteExpense = (req, res) => {
  const { id } = req.params;
  const sql = 'DELETE FROM expenses WHERE id = ?';
  db.query(sql, [id], (err) => {
    if (err) throw err;
    res.json({ message: 'Expense deleted' });
  });
};
