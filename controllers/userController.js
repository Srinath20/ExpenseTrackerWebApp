const mongoose = require('mongoose');
const User = require('../models/user');
const bcrypt = require('bcrypt');

exports.signupUser = async (req, res) => {
  const { name, email, password } = req.body;

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already taken' });
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const newUser = new User({ name, email, password: hashedPassword });
    await newUser.save();

    res.json({ id: newUser._id, name, email });
  } catch (err) {
    console.error('Error creating user:', err);
    res.status(500).json({ error: 'Error creating user' });
  }
};

exports.loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const match = await bcrypt.compare(password, user.password);
    if (match) {
      req.session.userName = user.name;
      req.session.userId = user._id;
      res.json({ id: user._id, name: user.name, email: user.email });
    } else {
      res.status(400).json({ error: 'User not authorized' });
    }
  } catch (err) {
    console.error('Error logging in user:', err);
    res.status(500).json({ error: 'Error logging in user' });
  }
};