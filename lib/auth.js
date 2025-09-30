const jwt = require('jsonwebtoken');

// --- DEBUGGING LINE ADDED ---
// This will print the secret to the Vercel logs when the server starts.
console.log(`DEBUG: The JWT_SECRET loaded by the server is: "${process.env.JWT_SECRET}"`);

function sign(user) {
  return jwt.sign({ uid: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
}

function requireAuth(req, res) {
  const token = (req.headers.authorization || '').replace('Bearer ', '');
  if (!token) {
    // Log the reason for failure
    console.error('Auth Error: No token provided.');
    res.status(401).send('No token');
    return null;
  }
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  }
  catch (err) {
    // Log the specific verification error
    console.error('Auth Error: Token verification failed.', err.message);
    res.status(401).send('Bad token');
    return null;
  }
}

module.exports = { sign, requireAuth };
