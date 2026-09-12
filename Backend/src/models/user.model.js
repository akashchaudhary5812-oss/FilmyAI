const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
    },

    email: {
        type: String,
        required: true,
        unique: true,
        match: [
            /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
            'Please fill a valid email address'
        ],
        lowercase: true,
    },

    password: {
        type: String,
        required: true,
    },
});

const userModel = mongoose.model('User', userSchema);
module.exports = userModel;