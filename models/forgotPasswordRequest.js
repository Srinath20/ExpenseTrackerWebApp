const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const forgotPasswordRequestSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    requestId: {
        type: String,
        unique: true,
        required: true,
        default: uuidv4,
    },
    isActive: {
        type: Boolean,
        default: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model(
    'ForgotPasswordRequest',
    forgotPasswordRequestSchema
);
