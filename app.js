const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const session = require('express-session');
const expenseRoutes = require('./routes/expenseRoutes');
const { error } = require('console');
const app = express();
const mysql = require('mysql');
require('dotenv').config(); 
//smtp
const Sib = require('sib-api-v3-sdk');
const client = Sib.ApiClient.instance;
const apiKey = client.authentications['api-key'];
apiKey.apiKey = process.env.EMAIL_API_KEY;
//end smtp
const { name } = require('ejs');
const htmlContent = require('./template');
const stripe = require('stripe')(process.env.STRIPE_PRIVATE_KEY);

app.use(express.json());
app.use(bodyParser.json());
app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
  secret: 'your_secret_key',
  resave: false,
  saveUninitialized: true,
}));
app.use('/api/expenses', expenseRoutes);

const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'Srinathg99',
  database: 'expensetracker'
});


app.use('/api/expenses', expenseRoutes);

app.get('/api/leaderboard', (req, res) => {
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
   /* const query = `
    SELECT users.name, SUM(expenses.amount) AS total_expenses
    FROM users
    JOIN expenses ON users.id = expenses.user_id
    GROUP BY users.id
    ORDER BY total_expenses DESC;
  `; */
});

app.post('/password/forgotpassword', async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
}
  console.log("API_KEY:"+process.env.API_KEY);
  const apiInstance = new Sib.TransactionalEmailsApi();
  const sender = {
      email: "javagalsrinath.619@gmail.com",
      name: "Srinath",
  };
  const receivers = [
      { email: email }
  ];
  try {
    const sendEmail = await apiInstance.sendTransacEmail({
      sender,
      to:receivers,
      subject:"Test mail for password reset",
      textContent:"This is a test mail for password reset",
      htmlContent,
    })
    return res.send(sendEmail);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: 'Failed to send email' });
  }
  
  tranEmailApi.sendTransacEmail({
      sender,
      to: receivers,
      subject: 'Password Reset Request',
      textContent: `
          This is a dummy mail for password reset for the expense tracker project.
      `,
  })
  .then(response => {
      console.log('Email sent successfully:', response);
      res.status(200).json({ message: 'Password reset link sent to your email.' });
  })
  .catch(error => {
      console.error('Error sending email:', error);
     
  });
});



app.post('/api/expenses/checkPremium', (req, res) => { //premium = 1 AND
  let q = 'SELECT name,premium FROM users WHERE  email = ?';
  console.log(req.body);
  let e = req.body.email;
  console.log(e);
  db.query(q, e, (err, results) => {
    if (err) {
      console.log(err);
      return res.status(500).json({ error: 'Database error app.js line 43' });
    } else if (results.length === 0) {
      return res.json({ error: 'User not a premium member.' });
    } else {
      console.log(results);
      let userName = results[0].name;
      return res.json({ name: userName , premium: results[0].premium});
    }
  });
});

app.post('/premium', async (req, res) => {
  console.log(req.body.premium, "app.js line 60");
  console.log("app.js line 64");
  if (req.body.premium === 1) {
    const user = req.session.userId;
    if (!user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    console.log(user, "app.js line 61");
    let q = `UPDATE users SET premium = 1 WHERE id = ?`;
    db.query(q, [user], (err, results) => {
      if (err) {
        console.error('Error updating premium status:', err);
        return res.status(500).json({ error: 'Failed to update premium status' });
      }
      if (results.affectedRows === 0) {
        return res.status(404).json({ error: 'User not found' });
      } else {
        console.log(req.session, "app.js line 69");
        res.json({ message: 'Premium status updated successfully'});
      }
    });
  } else {
    res.json({ message: "Payment failed" });
  }
});

app.post('/purchase/premium',async (req,res)=>{
  try {  
    const sess = await stripe.checkout.sessions.create({
      payment_method_types:['card'],
      mode:'payment',
      line_items:req.body.items.map(item =>{
        // const storeItem = items[item]
        return{
          price_data:{
            currency:'INR',
            product_data:{
              name:item.name
            },
            unit_amount:item.priceInCents
          },
          quantity:item.quantity
        }
      }),
      success_url:`${process.env.SERVER_url}/success.html`,
      cancel_url:`${process.env.SERVER_url}/cancel.html`
    })
    res.json({url:sess.url});
  } catch (e) {
    console.log(e)
    res.json(e);
  }
})
app.post('/premium', async (req, res) => {
  console.log(req.body.premium, "app.js line 60");
  if (req.body.premium === 1) {
    const user = req.session.userId;
    if (!user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    console.log(user, "app.js line 61");
    let q = `UPDATE users SET premium = 1 WHERE id = ?`;
    db.query(q, [user], (err, results) => {
      if (err) {
        console.error('Error updating premium status:', err);
        return res.status(500).json({ error: 'Failed to update premium status' });
      }
      if (results.affectedRows === 0) {
        return res.status(404).json({ error: 'User not found' });
      } else {
        console.log(req.session, "app.js line 69");
        res.json({ message: 'Premium status updated successfully' });
      }
    });
  } else {
    res.json({ message: "Payment failed" });
  }
});



app.listen(3000, () => {
  console.log("Server running on port 3000");
});


/* app.use((req, res, next) => {
  if (req.session && req.session.userName) {
    console.log("locals: ",res.locals)
    res.locals.welcomeMessage = `<h1 style="text-align: center; font-weight: bold;">Welcome ${req.session.userName}</h1>`;
  } else {
    res.locals.welcomeMessage = '';
  }
  next();
}); */