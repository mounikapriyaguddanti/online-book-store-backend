const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const port = 8005;

app.use(bodyParser.json());
app.use(cors());



const feedbackSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  message: { type: String, required: true },
  submittedOn: { type: Date, default: Date.now }
});

const Feedback = mongoose.model('Feedback', feedbackSchema);

app.post('/feedback', async (req, res) => {
    const { name, email, message } = req.body;
  
    try {
      const newFeedback = new Feedback({ name, email, message });
      await newFeedback.save();
      res.status(201).json({ message: 'Feedback submitted successfully' });
    } catch (error) {
      console.error('Error submitting feedback:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.get('/feedback', async (req, res) => {
    try {
      const feedbacks = await Feedback.find();
      res.status(200).json(feedbacks);
    } catch (error) {
      console.error('Error fetching feedback:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
  
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

  app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
  });
  