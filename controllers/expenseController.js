const mysql = require('mysql2');
const db = require('../db');

exports.getAllExpenses = (req, res) => {
  const username = req.session.userName;
  if (!username) {
    return res.status(401).json({ error: 'User not authenticated' });
  }
  const userId = req.session.userId;
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
  db.beginTransaction(err => {
    if (err) {
      return res.status(500).json({ error: 'Failed to start transaction' });
    }
    const insertExpenseQuery = 'INSERT INTO expenses (amount, description, category, user_id) VALUES (?, ?, ?, ?)';
    db.query(insertExpenseQuery, [amount, description, category, userId], (err, result) => {
      if (err) {
        return db.rollback(() => {
          res.status(500).json({ error: 'Failed to add expense' });
        });
      }
      const updateTotalExpenseQuery = `
        UPDATE users 
        SET totalexpense = IFNULL(totalexpense, 0) + ?
        WHERE id = ?;
      `;
      db.query(updateTotalExpenseQuery, [amount, userId], (err) => {
        if (err) {
          return db.rollback(() => {
            res.status(500).json({ error: 'Failed to update total expense' });
          });
        }
        db.commit(err => {
          if (err) {
            return db.rollback(() => {
              res.status(500).json({ error: 'Failed to commit transaction' });
            });
          }

          res.json({ 
            id: result.insertId, 
            amount, 
            description, 
            category, 
            user_id: username 
          });
        });
      });
    });
  });
};


exports.updateExpense = (req, res) => {
  const { id } = req.params;
  const { amount, description, category } = req.body;

  const getUserIdQuery = 'SELECT user_id FROM expenses WHERE id = ?';
  const getTotalExpenseQuery = 'SELECT SUM(amount) AS total FROM expenses WHERE user_id = ?';
  const updateExpenseQuery = 'UPDATE expenses SET amount = ?, description = ?, category = ? WHERE id = ?';
  const updateUserTotalExpenseQuery = 'UPDATE users SET totalExpense = ? WHERE id = ?';

  db.beginTransaction((transactionErr) => {
    if (transactionErr) {
      return res.status(500).json({ error: 'Transaction initiation failed' });
    }

    db.query(getUserIdQuery, [id], (err, result) => {
      if (err) {
        return db.rollback(() => {
          res.status(500).json({ error: 'Failed to fetch user ID' });
        });
      }

      const userId = result[0].user_id;

      db.query(updateExpenseQuery, [amount, description, category, id], (updateErr) => {
        if (updateErr) {
          return db.rollback(() => {
            res.status(500).json({ error: 'Failed to update expense' });
          });
        }

        db.query(getTotalExpenseQuery, [userId], (sumErr, sumResult) => {
          if (sumErr) {
            return db.rollback(() => {
              res.status(500).json({ error: 'Failed to calculate total expense' });
            });
          }

          const totalExpense = sumResult[0].total;

          db.query(updateUserTotalExpenseQuery, [totalExpense, userId], (updateUserErr) => {
            if (updateUserErr) {
              return db.rollback(() => {
                res.status(500).json({ error: 'Failed to update user total expense' });
              });
            }

            db.commit((commitErr) => {
              if (commitErr) {
                return db.rollback(() => {
                  res.status(500).json({ error: 'Transaction commit failed' });
                });
              }

              res.json({ id, amount, description, category, totalExpense });
            });
          });
        });
      });
    });
  });
};



exports.deleteExpense = (req, res) => {
  const { id } = req.params;
  const getExpenseSql = 'SELECT user_id, amount FROM expenses WHERE id = ?';
  db.query(getExpenseSql, [id], (err, results) => {
    if (err) return res.status(500).json({ error: 'Database error' });

    if (results.length === 0) return res.status(404).json({ message: 'Expense not found' });

    const { user_id, amount } = results[0];
    const deleteExpenseSql = 'DELETE FROM expenses WHERE id = ?';
    db.query(deleteExpenseSql, [id], (err) => {
      if (err) return res.status(500).json({ error: 'Failed to delete expense' });

      // Update the totalExpense column in the users table
      const updateTotalExpenseSql = 'UPDATE users SET totalExpense = totalExpense - ? WHERE id = ?';
      db.query(updateTotalExpenseSql, [amount, user_id], (err) => {
        if (err) {
          // Rollback: Restore the expense if updating totalExpense fails
          const restoreExpenseSql = 'INSERT INTO expenses (id, user_id, amount) VALUES (?, ?, ?)';
          db.query(restoreExpenseSql, [id, user_id, amount], (restoreErr) => {
            if (restoreErr) return res.status(500).json({ error: 'Database rollback error' });

            return res.status(500).json({ error: 'Failed to update total expense, rolled back changes' });
          });
        } else {
          res.json({ message: 'Expense deleted and totalExpense updated' });
        }
      });
    });
  });
};





/* 
exports.deleteExpense = (req, res) => {
  const { id } = req.params;
  const sql = 'DELETE FROM expenses WHERE id = ?';
  db.query(sql, [id], (err) => {
    if (err) throw err;
    res.json({ message: 'Expense deleted' });
  });
}; */
