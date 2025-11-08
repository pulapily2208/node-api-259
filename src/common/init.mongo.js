const mongoose = require("mongoose");
const config = require("config");
module.exports = () => {
  mongoose.set('bufferCommands', false);
  mongoose
    .connect(config.get("db.mongo.uri"), {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    })
    .then(() => console.log("MongoDB connected!"))
    .catch((err) => {
      console.error("MongoDB connection error:", err);
      process.exit(1);
    });

  mongoose.connection.on('error', err => {
    console.error('MongoDB connection error:', err);
  });

  mongoose.connection.on('disconnected', () => {
    console.log('MongoDB disconnected');
  });

  return mongoose;
};
