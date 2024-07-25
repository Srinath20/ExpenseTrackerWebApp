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