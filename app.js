//Any network call should be in service folder like db,s3 and api callss
const fs = require('fs');
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const session = require('express-session');
const expenseRoutes = require('./routes/expenseRoutes');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcrypt');
const app = express();
const mysql = require('mysql');
const AWS = require('aws-sdk');
require('dotenv').config();
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
//smtp
const Sib = require('sib-api-v3-sdk');
const client = Sib.ApiClient.instance;
const apiKey = client.authentications['api-key'];
apiKey.apiKey = process.env.EMAIL_API_KEY;
//end smtp
const htmlContent = require('./template');
const stripe = require('stripe')(process.env.STRIPE_PRIVATE_KEY);
const BUCKET_NAME = process.env.BUCKET_NAME;
const IAM_USER_KEY = process.env.IAM_USER_KEY
const IAM_USER_SECRET = process.env.IAM_USER_SECRET;
const PORT = process.env.PORT
const apiUrl = 'http://52.90.231.173:3000';


app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));
const db = require('./db');
app.use(session({
  secret: 'your_secret_key',
  resave: false,
  saveUninitialized: true,
}));
app.use('/api/expenses', expenseRoutes);
const accessLogStream = fs.createWriteStream(
  path.join(__dirname, 'Logs', 'access.log'),
  { flags: 'a' }
)
app.use(helmet());
app.use(compression());
app.use(morgan('combined', { stream: accessLogStream }));

function uploadToS3(data, filename) {
  const s3Bucket = new AWS.S3({
    accessKeyId: process.env.IAM_USER_KEY,
    secretAccessKey: process.env.IAM_USER_SECRET
  });

  const params = {
    Bucket: BUCKET_NAME,
    Key: filename,
    Body: data,
    ACL: 'public-read'
  };
  return new Promise((resolve, reject) => {
    s3Bucket.upload(params, (err, s3response) => {
      if (err) {
        console.log("Something went wrong", err);
        reject(err);
      } else {
        console.log('Success', s3response.Location);
        resolve(s3response.Location);
      }
    });
  });
}

app.get('/config', (req, res) => {
  res.json({
    apiUrl: process.env.SERVER_url || 'http://52.90.231.173:3000'
  });
});


app.get('/api/expenses/user/download', async (req, res) => {
  let u = req.session.userId;
  if (!u) {
    return res.status(400).json({ error: 'User has to sign in' });
  }

  let q = `SELECT * FROM expenses WHERE user_id = ?`;
  db.query(q, [u], async (err, resu) => {
    if (err) {
      console.error('Error fetching data:', err);
      res.status(500).send('Server error');
      return;
    }

    try {
      const stringifiedExpenses = JSON.stringify(resu);
      const filename = `Expense${u}/${new Date()}.txt`;
      const fileurl = await uploadToS3(stringifiedExpenses, filename);
      const insertQuery = `INSERT INTO downloadedfiles (userid, url, downloaded_at) VALUES (?, ?, NOW())`;
      db.query(insertQuery, [u, fileurl], (insertErr) => {
        if (insertErr) {
          console.error('Error inserting data:', insertErr);
          res.status(500).send('Server error');
          return;
        }
        res.status(200).json({ userId: u, fileurl, success: true });
      });
    } catch (uploadErr) {
      console.error('Error uploading to S3:', uploadErr);
      res.status(500).send('Server error');
    }
  });
});

app.get('/api/expenses/api/user/download-history', (req, res) => {
  let u = req.session.userId;
  if (!u) {
    return res.status(400).json({ error: 'User has to sign in' });
  }

  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;

  const countQuery = `SELECT COUNT(*) AS count FROM downloadedfiles WHERE userid = ?`;
  const dataQuery = `SELECT url, downloaded_at FROM downloadedfiles WHERE userid = ? ORDER BY downloaded_at DESC LIMIT ? OFFSET ?`;

  db.query(countQuery, [u], (err, countResults) => {
    if (err) {
      console.error('Error fetching download history count:', err);
      return res.status(500).send('Server error');
    }

    const totalCount = countResults[0].count;

    db.query(dataQuery, [u, limit, offset], (err, results) => {
      if (err) {
        console.error('Error fetching download history:', err);
        return res.status(500).send('Server error');
      }

      res.status(200).json({ totalCount, data: results });
    });
  });
});

app.get('/api/expenses/api/leaderboard', (req, res) => {
  const query = `SELECT name,totalexpense
    FROM users
    ORDER BY totalexpense DESC`;
  db.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching data:', err);
      res.status(500).send('Server error');
      return;
    }
    res.json(results);
  });
});

app.post('/api/expenses/password/forgotpassword', async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  const userQuery = 'SELECT id FROM users WHERE email = ?';
  db.query(userQuery, [email], (error, results) => {
    if (error) {
      console.error('Error finding user:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }

    if (results.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userId = results[0].id;
    const requestId = uuidv4();
    const insertQuery = 'INSERT INTO forgotpasswordrequests (id, userId, isactive) VALUES (?, ?, ?)';

    db.query(insertQuery, [requestId, userId, true], async (error) => {
      if (error) {
        console.error('Error creating request:', error);
        return res.status(500).json({ error: 'Internal server error' });
      }

      const resetUrl = `${apiUrl}/password/resetpassword/${requestId}`;

      const apiInstance = new Sib.TransactionalEmailsApi();
      const sender = {
        email: "javagalsrinath.619@gmail.com",
        name: "Srinath",
      };
      const receivers = [
        { email: email }
      ];
      const htmlContent = `<p>You requested a password reset. Click the link to reset your password: <a href="${resetUrl}">${resetUrl}</a></p>`;
      const textContent = `You requested a password reset. Click the link to reset your password: ${resetUrl}`;

      try {
        const sendEmail = await apiInstance.sendTransacEmail({
          sender,
          to: receivers,
          subject: "Password Reset Request",
          textContent: textContent,
          htmlContent: htmlContent,
        });
        console.log('Email sent successfully:', sendEmail);
        return res.status(200).json({ message: 'Password reset link sent to your email.' });
      } catch (error) {
        console.error('Error sending email:', error);
        return res.status(500).json({ error: 'Failed to send email' });
      }
    });
  });
});

app.get('/password/resetpassword/:requestId', (req, res) => {
  const { requestId } = req.params;

  const query = 'SELECT * FROM forgotpasswordrequests WHERE id = ? AND isactive = TRUE';
  db.query(query, [requestId], (error, results) => {
    if (error) {
      console.error('Error querying reset request:', error);
      return res.status(500).send('Internal Server Error');
    }

    if (results.length === 0) {
      return res.status(404).send('Invalid or expired reset link');
    }

    res.send(`
          <form action="/password/resetpassword/${requestId}" method="POST">
             New Password: <input type="password" id="newPassword" name="newPassword" required>
              <button type="submit">Reset Password</button>
          </form>
      `);
  });
});

app.post('/password/resetpassword/:requestId', (req, res) => {
  const { requestId } = req.params;
  const { newPassword } = req.body;
  if (!newPassword) {
    return res.status(400).send('New password is required');
  }

  const selectQuery = 'SELECT userId FROM forgotpasswordrequests WHERE id = ? AND isactive = TRUE';
  db.query(selectQuery, [requestId], (error, results) => {
    if (error) {
      console.error('Error querying reset request:', error);
      return res.status(500).send('Internal Server Error');
    }

    if (results.length === 0) {
      return res.status(404).send('Invalid or expired reset link');
    }

    const userId = results[0].userId;

    bcrypt.hash(newPassword, 10, (err, hashedPassword) => {
      if (err) {
        console.error('Error hashing password:', err);
        return res.status(500).send('Internal Server Error');
      }

      const updateQuery = 'UPDATE users SET password = ? WHERE id = ?';
      db.query(updateQuery, [hashedPassword, userId], (error) => {
        if (error) {
          console.error('Error updating password:', error);
          return res.status(500).send('Internal Server Error');
        }

        const deactivateQuery = 'UPDATE forgotpasswordrequests SET isactive = FALSE WHERE id = ?';
        db.query(deactivateQuery, [requestId], (error) => {
          if (error) {
            console.error('Error deactivating reset request:', error);
            return res.status(500).send('Internal Server Error');
          }

          res.send('Password has been reset successfully');
        });
      });
    });
  });
});

app.post('/api/expenses/checkPremium', (req, res) => {
  let q = 'SELECT name,premium FROM users WHERE  email = ?';
  let e = req.body.email;
  db.query(q, e, (err, results) => {
    if (err) {
      console.log(err);
      return res.status(500).json({ error: 'Database error app.js line 43' });
    } else if (results.length === 0) {
      return res.json({ error: 'User not a premium member.' });
    } else {
      let userName = results[0].name;
      return res.json({ name: userName, premium: results[0].premium });
    }
  });
});

app.post('/api/expenses/purchase/premium', async (req, res) => {
  console.log(process.env.SERVER_url);
  try {
    const sess = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: req.body.items.map(item => {
        return {
          price_data: {
            currency: 'INR',
            product_data: {
              name: item.name
            },
            unit_amount: item.priceInCents
          },
          quantity: item.quantity
        }
      }),
      success_url: `${process.env.SERVER_url}/success.html`,
      cancel_url: `${process.env.SERVER_url}/cancel.html`
    })
    res.json({ url: sess.url });
  } catch (e) {
    res.json(e);
  }
})
app.post('/premium', async (req, res) => {
  const userId = req.session.userId;

  if (!userId) {
    return res.status(401).json({ error: 'User not authenticated' });
  }

  try {
    let q = `UPDATE users SET premium = 1 WHERE id = ?`;
    db.query(q, [userId], (err, results) => {
      if (err) {
        console.error('Error updating premium status:', err);
        return res.status(500).json({ error: 'Failed to update premium status' });
      }
      if (results.affectedRows === 0) {
        return res.status(404).json({ error: 'User not found' });
      } else {
        res.json({ message: 'Premium status updated successfully' });
      }
    });
  } catch (error) {
    console.error('Error updating premium status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.use((req, res) => {
  console.log('urll', req.url);
  res.sendFile(path.join(__dirname, `public/${req.url}`));
})


app.listen(PORT, () => {
  console.log(`Server running in ${PORT}`);
});

