const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const port = 5005;

const app = express();
app.use(bodyParser.json());
app.use(cors()); // Enable CORS for all routes

// Connect to MongoDB
const db = "mongodb+srv://mounikapriyaguddanti:jSm1hOv8mJylaDIH@cluster0.eviujnw.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

mongoose.connect(db)
  .then(() => {
    console.log("Connection to MongoDB successful");
  })
  .catch((err) => {
    console.log("Error connecting to MongoDB:", err);
  });

// Create a schema for the inquiry
const inquirySchema = new mongoose.Schema({
  name: String,
  email: String,
  address: String,
  phoneNo: String,
  message: String
});

const Inquiry = mongoose.model('Inquiry', inquirySchema);

// API routes
app.post('/api/inquiries', async (req, res) => {
  try {
    const inquiry = new Inquiry(req.body);
    await inquiry.save();
    res.status(201).json(inquiry);
  } catch (error) {
    res.status(400).json({ error: 'Error submitting inquiry' });
  }
});

app.get('/api/inquiries', async (req, res) => {
  try {
    const inquiries = await Inquiry.find();
    res.json(inquiries);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching inquiries' });
  }
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
  });
  