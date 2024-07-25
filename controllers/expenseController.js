const mysql = require('mysql2');

const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'Srinathg99',
  database: 'expensetracker'
});

db.connect(err => {
  if (err) throw err;
  console.log('Connected to the database from expenseController.');
});

exports.getAllExpenses = (req, res) => {
  const username = req.session.userName;
  console.log(" expenseController line 17");
  if (!username) {
    return res.status(401).json({ error: 'User not authenticated' });
  }
  const userId = req.session.userId;
  console.log(" expenseController line 22");
  const sql = 'SELECT * FROM expenses WHERE user_id = ?';
  db.query(sql, [userId], (err, results) => {
    if (err) throw err;
    res.json(results);
  });
};

exports.createExpense = (req, res) => {
  const { amount, description, category } = req.body;
  const username = req.session.userName;
  const userId = req.session.userId;

  if (!username) {
    return res.status(401).json({ error: 'User not authenticated' });
  }

  const sql = 'INSERT INTO expenses (amount, description, category, user_id) VALUES (?, ?, ?, ?)';
  db.query(sql, [amount, description, category, userId], (err, result) => {
    if (err) throw err;
    res.json({ id: result.insertId, amount, description, category, user_id: username });
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
