/**
 * User Model
 * 
 * Stores user account information for authentication.
 * Passwords are hashed using bcryptjs before saving.
 * 
 * Fields:
 *   - name: User's display name
 *   - email: Unique email address for login
 *   - password: Hashed password (bcrypt)
 *   - createdAt: Account creation timestamp
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

/**
 * Pre-save hook: Hash password before saving to database
 * Only hashes if the password field has been modified (not on every save)
 */
userSchema.pre('save', async function (next) {
  // Skip hashing if password hasn't changed
  if (!this.isModified('password')) {
    return next();
  }

  // Generate a salt and hash the password
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

/**
 * Instance method: Compare a plain-text password with the stored hash
 * Used during login to verify credentials
 */
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
