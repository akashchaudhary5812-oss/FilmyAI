const userModel = require('../models/user.model');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');

async function registerUser(req, res) {
    const { username, email, password } = req.body;

    const user = await userModel.findOne({ email: email });

    if (user) {
        res.status(400).send({ message: 'User already exists' });
        return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new userModel({
        username,
        email,
        password: hashedPassword
    });

    const savedUser = await newUser.save();

    res.status(201).json({ message: 'User registered successfully', user: savedUser });
}

async function loginUser(req, res) {

    const { email, password } = req.body;

    const user = await userModel.findOne({ email: email });

    if (!user) {
        res.status(400).send({ message: 'User does not exist' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
        res.status(400).send({ message: 'Invalid password' });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.cookie('token', token);

    res.status(200).send({ message: 'Login successful', token });
}

module.exports = { registerUser, loginUser };