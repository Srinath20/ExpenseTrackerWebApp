const mysql = require('mysql2');
const bcrypt = require('bcrypt');
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'Srinathg99',
  database: 'expensetracker'
});

db.connect(err => {
  if (err) throw err;
  console.log('Connected to the database from userController.');
});

exports.signupUser = async (req, res) => {
  const { name, email, password } = req.body;
  const checkEmailSql = 'SELECT * FROM users WHERE email = ?';
  
  db.query(checkEmailSql, [email], async (err, results) => {
    if (err) throw err;
    if (results.length > 0) {
      return res.status(400).json({ error: 'Email already taken' });
    } else {
      try {
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        const sql = 'INSERT INTO users (name, email, password) VALUES (?, ?, ?)';
        
        db.query(sql, [name, email, hashedPassword], (err, result) => {
          if (err) throw err;
          res.json({ id: result.insertId, name, email });
        });
      } catch (err) {
        res.status(500).json({ error: 'Error hashing password' });
      }
    }
  });
};

exports.loginUser = (req, res) => {
  const { email, password } = req.body;
 // console.log(email+"  "+ password);
  const sql = 'SELECT * FROM users WHERE email = ?';
  
  db.query(sql, [email], async (err, results) => {
    if (err) throw err;
    if (results.length === 0) {
      return res.status(404).json({ error: 'User not found.' });
    } else {
      console.log(results,"User controller line 50");
      const user = results[0];
      const match = await bcrypt.compare(password, user.password);

      console.log(req.session," userController 57");
      if (match) {
        req.session.userName = user.name;
        req.session.userId = user.id;

      console.log(req.session,"usercontroller line 62");
 

        res.json({ id: user.id, name: user.name, email: user.email }); 
        
     } else res.status(400).json({ error: 'User not authorized' });
      
    }
  });
};


