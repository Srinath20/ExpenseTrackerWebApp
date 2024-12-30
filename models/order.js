const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    paymentId: String,
    orderId: String,
    status: String,
});

module.exports = mongoose.model('Order', orderSchema);