const userModel = require('../models/user.model');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');

async function registerUser(req, res) {
    try {
        const { username, email, password } = req.body;
        if (!username || !email || !password) return res.status(400).json({ message: 'Username, email, and password are required' });
        const normalizedEmail = email.trim().toLowerCase();
        if (await userModel.findOne({ email: normalizedEmail })) return res.status(409).json({ message: 'User already exists' });

        const savedUser = await new userModel({ username: username.trim(), email: normalizedEmail, password: await bcrypt.hash(password, 10) }).save();
        return res.status(201).json({ message: 'User registered successfully', user: { _id: savedUser._id, username: savedUser.username, email: savedUser.email } });
    } catch (error) {
        return res.status(500).json({ message: 'Unable to register user' });
    }
}

async function loginUser(req, res) {
    try {
        const { email, password } = req.body;
        if (!email || !password) return res.status(400).json({ message: 'Email and password are required' });
        if (!process.env.JWT_SECRET) return res.status(500).json({ message: 'Server authentication is not configured' });

        const user = await userModel.findOne({ email: email.trim().toLowerCase() });
        if (!user || !(await bcrypt.compare(password, user.password))) return res.status(401).json({ message: 'Invalid email or password' });

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
        res.cookie('token', token, { httpOnly: true, sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', secure: process.env.NODE_ENV === 'production', maxAge: 60 * 60 * 1000 });
        return res.status(200).json({ message: 'Login successful', token, user: { _id: user._id, username: user.username, email: user.email } });
    } catch (error) {
        return res.status(500).json({ message: 'Unable to log in' });
    }
}

module.exports = { registerUser, loginUser };
