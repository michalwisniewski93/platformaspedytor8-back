const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");


const multer = require('multer');
const path = require('path');




require("dotenv").config();

//models
const Login = require("./models/Login");
const Tickets = require("./models/Tickets")




const app = express();
const port = process.env.PORT || 5000;










// Middleware
app.use(cors());
app.use(express.json());


const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/static'); // Folder static
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // Unikalna nazwa pliku
  }
});

const upload = multer({ storage: storage });


app.use(express.static('public'));


// MongoDB połączenie
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.log("MongoDB connection error:", err));


app.get("/", (req, res) => {
  res.send("Hello from Express!");
});

app.get("/login", async (req, res) => {
  try {
    const logins = await Login.find();
    res.json(logins);
    
  } catch (err) {
    res.status(400).send("Error fetching admin logins");
  }
});

app.get("/tickets", async (req, res) => {
  try {
    const tickets = await Tickets.find();
    res.json(tickets);
    
  } catch (err) {
    res.status(400).send("Error fetching tickets");
  }
});


app.post('/tickets', async (req, res) => {
  const newTickets = new Tickets({
    nameandsurname: req.body.nameandsurname,
    email: req.body.email,
    message: req.body.message,
    time: req.body.time,
  })
  try {
    await newTickets.save();
    res.status(201).json(newTickets);
  } catch (err) {
    res.status(400).send("Error adding ticket");
  }
})


// Uruchamiamy serwer
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});