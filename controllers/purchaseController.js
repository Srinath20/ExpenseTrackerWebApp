/* const pool = require('../db');
const Razorpay = require('razorpay');

const purchasepremium = (req,res) =>{
  res.json({url:"Hi"});
}

const updateTransactionStatus = (req, res) => {
  try {
    const { payment_id, order_id } = req.body;

    Order.findOne({ where: { orderid: order_id } })
      .then(order => {
        if (!order) {
          return res.status(404).json({ success: false, message: "Order not found" });
        }
        return order.update({ paymentid: payment_id, status: 'SUCCESSFUL' });
      })
      .then(() => {
        return res.status(202).json({ success: true, message: "Transaction Successful" });
      })
      .catch(err => {
        console.error(err);
        return res.status(500).json({ success: false, message: "An error occurred" });
      });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "An unexpected error occurred" });
  }
};


module.exports = {purchasepremium}; */



// const purchasepremium = (req, res) => {
//   console.log(
//     JSON.stringify(process.env.RAZORPAY_KEYID),process.env.RAZORPAY_KEYSECRET);
//   try {
//     var rzp = new Razorpay({
//       key_id: process.env.RAZORPAY_KEYID,
//       key_secret: process.env.RAZORPAY_KEYSECRET
//     });

//     const amount = 2500;

//     rzp.orders.create({ amount, currency: "INR" }, (err, order) => {
//       try{
//         if (err) {
//           throw new Error(JSON.stringify(err), "line 7878");
//         }
//       }
//       catch(e){
//         console.error(e);
//       }
//       console.log(order);
//       return res.status(201).json({ order, key_id: rzp.key_id });
//       /* req.user.createOrder({ orderid: order.id, status: 'PENDING' }).then(() => {
//           return res.status(201).json({ order, key_id: rzp.key_id }); 
//         }).catch(err => {
//           throw new Error(err);
//         }); */
      
//       /* //  req.user.createOrder({ orderid: order.id, status: 'PENDING' }).then(() => {
//       //   return res.status(201).json({ order, key_id: rzp.key_id }); 
//       // }).catch(err => {
//       //   throw new Error(err);
//       // }); */
//     });
//   } catch (err) {
//     console.log(err);
//     res.status(403).json({ message: 'Something went wrong', error: err.message });
//   }
// };