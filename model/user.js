const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    // username: { type: String, required: true },
    name: { type: String, required: true, minLength: 2 },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: false },
    role: { type: String, enum: ['user', 'seller', 'admin'], default: 'user' },
    deliveryAddress: { type: String, required: false },
    googleId: { type: String, unique: true },
    facebookId: { type: String, unique: true },
    refreshToken: { type: String }
});


const User = mongoose.model('User', userSchema);

module.exports = User;