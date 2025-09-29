const { connect } = require('../../lib/db');
const User = require('../../models/User');
const bcrypt = require('bcrypt');
const { sign } = require('../../lib/auth');

module.exports = async (req, res) => {
  try {
    if (req.method !== 'POST') {
      return res.status(405).send('Method Not Allowed');
    }

    // Check if the request body is present
    if (!req.body) {
      console.error("Login Error: Request body is missing. Ensure express.json() middleware is used.");
      return res.status(400).send('Bad Request: Missing login credentials.');
    }
    
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).send('Email and password are required.');
    }

    await connect();

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).send('Authentication failed: User not found.');
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(400).send('Authentication failed: Incorrect password.');
    }

    // If everything is correct, send the token
    res.json({ token: sign(user), user: { id: user._id, email: user.email } });

  } catch (err) {
    // Log any unexpected errors and send a generic error response
    console.error('FATAL LOGIN ERROR:', err);
    res.status(500).send('An internal server error occurred.');
  }
};