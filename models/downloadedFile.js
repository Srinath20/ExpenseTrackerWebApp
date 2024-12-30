const mongoose = require('mongoose');

const downloadedFileSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    url: String,
    downloadedAt: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model('DownloadedFile', downloadedFileSchema);