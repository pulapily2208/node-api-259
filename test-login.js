require('dotenv').config();
const bcrypt = require("bcrypt");
const mongoose = require("mongoose");
const config = require("config");

// Define User model directly
const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['admin', 'member'], default: 'member', required: true },
  },
  { timestamps: true }
);
const UserModel = mongoose.model("Users", userSchema, "users");

async function checkUser() {
  try {
    // Connect to MongoDB
    await mongoose.connect(config.get("db.mongo.uri"), {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("✅ MongoDB connected");
    
    const email = "admin@gmail.com";
    const user = await UserModel.findOne({ email });
    
    if (!user) {
      console.log(`❌ User ${email} NOT FOUND in database`);
      console.log("\n📝 You need to create an admin user first.");
      console.log("Run this command to register:");
      console.log(`curl -X POST http://localhost:3000/api/v3/auth/users/register -H "Content-Type: application/json" -d '{"fullName":"Admin","email":"admin@gmail.com","password":"admin123"}'`);
    } else {
      console.log("✅ User found:", {
        id: user._id,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt
      });
      
      // Test password comparison
      console.log("\n🔐 Testing password from your screenshot:");
      console.log("Password hash in DB:", user.password);
      
      // The password in the screenshot looks like a bcrypt hash itself
      // Let's test if the actual plaintext password works
      const testPasswords = [
        "admin123",
        "123456",
        "password"
      ];
      
      for (const pwd of testPasswords) {
        const match = await bcrypt.compare(pwd, user.password);
        console.log(`  Password "${pwd}" => ${match ? "✅ MATCH!" : "❌ no match"}`);
      }
      
      console.log("\n💡 TIP: If none match, the password might have been hashed twice.");
      console.log("Try logging in with the original plaintext password you used during registration.");
    }
    
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error.message);
    await mongoose.disconnect();
    process.exit(1);
  }
}

checkUser();
