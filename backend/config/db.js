/**
 * Database Configuration
 * 
 * Connects to MongoDB using Mongoose.
 * The connection string is read from the MONGO_URI environment variable.
 * If the connection fails, the process exits with an error.
 */

const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // Connect to MongoDB using the URI from environment variables
    const conn = await mongoose.connect(process.env.MONGO_URI);

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    // Exit the process if we can't connect to the database
    process.exit(1);
  }
};

module.exports = connectDB;
