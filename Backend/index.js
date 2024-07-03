

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

// MongoDB connection string
const db = "mongodb+srv://mounikapriyaguddanti:jSm1hOv8mJylaDIH@cluster0.eviujnw.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

// Connect to MongoDB
mongoose.connect(db)
  .then(() => {
    console.log("Connection to MongoDB successful");
  })
  .catch((err) => {
    console.log("Error connecting to MongoDB:", err);
  });

// User schema definition
const userSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phoneNumber: { type: String, required: true, unique: true },
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  userType: { type: String, enum: ['user', 'admin'], default: 'user' },
  registeredOn: { type: Date, default: Date.now },  // When user registered
  loginHistory: [{ 
    loginTime: { type: Date },
    logoutTime: { type: Date }
  }]
});

const User = mongoose.model('User', userSchema);

// Registration route
app.post('/register', async (req, res) => {
  const { fullName, email, phoneNumber, username, password } = req.body;

  try {
    // Check if user already exists
    const existingUser = await User.findOne({ $or: [{ email }, { phoneNumber }, { username }] });
    if (existingUser) {
      return res.status(400).json({ error: "User already exists" });
    }

    // Determine user type based on email domain
    const userType = email.endsWith('@numetry.com') ? 'admin' : 'user';

    const newUser = await User.create({
      fullName,
      email,
      phoneNumber,
      username,
      password,  
      userType,
      registeredOn: new Date()
    });

    res.json({ message: "Registration successful", user: newUser });
  } catch (err) {
    console.log("Error creating user:", err);
    res.status(500).json({ error: "Could not create user" });
  }
});

// Login route
app.post("/login", async (req, res) => {
  const { username, password } = req.body;

  try {
    // Find user by username and password (direct comparison - NOT SECURE)
    const user = await User.findOne({ username, password });

    if (!user) {
      return res.status(404).json({ error: "User not found or incorrect password" });
    }

    // Record login time
    const loginTime = new Date();
    user.loginHistory.push({ loginTime });
    await user.save();

    res.json({ 
      message: "Login successful", 
      user: {
        fullName: user.fullName,
        email: user.email,
        username: user.username,
        userType: user.userType
      }, 
      isAdmin: user.userType === 'admin' 
    });
  } catch (err) {
    console.log("Error finding user:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Logout route
app.post("/logout", async (req, res) => {
  const { username } = req.body;

  try {
    const user = await User.findOne({ username });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Record logout time
    const lastLogin = user.loginHistory[user.loginHistory.length - 1];
    lastLogin.logoutTime = new Date();
    await user.save();

    res.json({ message: "Logout successful" });
  } catch (err) {
    console.log("Error logging out user:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Route to get all regular users with login history (for admin dashboard)
app.get("/users", async (req, res) => {
  try {
    const users = await User.find(
      { userType: 'user' },
      {
        fullName: 1,
        email: 1,
        phoneNumber: 1,
        username: 1,
        registeredOn: 1,
        loginHistory: 1,
      }
    );
    res.json(users);
  } catch (err) {
    console.log("Error fetching users:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Update user
app.put('/users/:id', async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(user);
  } catch (error) {
    res.status(500).send('Server error');
  }
});

// Delete user
app.delete('/users/:id', async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ msg: 'User deleted' });
  } catch (error) {
    res.status(500).send('Server error');
  }
});

// Route to get user registration data
app.get("/api/user-registrations", async (req, res) => {
  try {
    const registrations = await User.aggregate([
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$registeredOn" } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const labels = registrations.map(item => item._id);
    const values = registrations.map(item => item.count);

    res.json({ labels, values });
  } catch (err) {
    console.log("Error fetching user registrations:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// User Statistics
app.get("/api/user-statistics", async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const adminUsers = await User.countDocuments({ userType: 'admin' });
    const regularUsers = await User.countDocuments({ userType: 'user' });
    res.json({ totalUsers, adminUsers, regularUsers });
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});
// User Login Count (excluding admins)
app.get("/api/user-login-count", async (req, res) => {
  try {
    const users = await User.aggregate([
      { $match: { userType: 'user' } },  // Only include users, not admins
      {
        $project: {
          username: 1,
          loginCount: { $size: "$loginHistory" }
        }
      },
      { $sort: { loginCount: -1 } },
      { $limit: 10 }
    ]);

    const usernames = users.map(user => user.username);
    const loginCounts = users.map(user => user.loginCount);

    res.json({ usernames, loginCounts });
  } catch (err) {
    console.error('Error fetching user login count:', err);
    res.status(500).json({ error: "Internal server error" });
  }
});
// Start the server
app.listen(8000, () => {
  console.log('Server started on port 8000');
});
