const express = require("express");
const mongoose = require("mongoose");
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const cors = require("cors");


const multer = require('multer');
const path = require('path');




require("dotenv").config();

//models
const Login = require("./models/Login");
const Tickets = require("./models/Tickets")
const Articles = require("./models/Articles")
const Customers = require("./models/Customers")
const Salessites = require("./models/Salessites")




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
    status: req.body.status,
  })
  try {
    await newTickets.save();
    res.status(201).json(newTickets);
  } catch (err) {
    res.status(400).send("Error adding ticket");
  }
})

app.put("/tickets/:id", async (req, res) => {
  try {
    const updatedTicket = await Tickets.findByIdAndUpdate(
      req.params.id,  // Znajdź element po ID
      { nameandsurname: req.body.nameandsurname, email: req.body.email, message: req.body.message, time: req.body.time, status: req.body.status },  // Zaktualizuj dane
      { new: true }  // Zwróć zaktualizowany obiekt
    );
    res.json(updatedTicket);
  } catch (err) {
    res.status(400).send("Error updating ticker");
  }
});




app.post('/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).send('No file uploaded');
  }

  // Zwracamy pełną ścieżkę do pliku
  res.json({ imageUrl: `/static/${req.file.filename}` });
});



app.get("/articles", async (req, res) => {
  try {
    const articles = await Articles.find();
    res.json(articles);
    
  } catch (err) {
    res.status(400).send("Error fetching articles");
  }
});


app.post('/articles', async (req, res) => {
  const newArticles = new Articles({
    title: req.body.title,
    description: req.body.description,
    author: req.body.author,
    imageurl: req.body.imageurl,
    
  })
  try {
    await newArticles.save();
    res.status(201).json(newArticles);
  } catch (err) {
    res.status(400).send("Error adding article");
  }
})

app.delete("/articles/:id", async (req, res) => {
  try {
    const articles = await Articles.findByIdAndDelete(req.params.id);
    res.json({ message: "Article deleted", articles });
  } catch (err) {
    res.status(400).send("Error deleting article");
  }
});


app.get("/customers", async (req, res) => {
  try {
    const customers = await Customers.find();
    res.json(customers);
    
  } catch (err) {
    res.status(400).send("Error fetching customers");
  }
});

app.post('/customers', async (req, res) => {
  const newCustomers = new Customers({
    name: req.body.name,
    surname: req.body.surname,
    street: req.body.street,
    postcode: req.body.postcode,
    city: req.body.city,
    companyname: req.body.companyname, 
    companystreet: req.body.companystreet,
    companypostcode: req.body.companypostcode,
    companycity: req.body.companycity,
    email: req.body.email,
    invoice: req.body.invoice,
    login: req.body.login,
    newsletter: req.body.newsletter,
    password: req.body.password,
    phonenumber: req.body.phonenumber,
    regulations: req.body.regulations,
    companynip: req.body.companynip,
    companyregon: req.body.companyregon,
    accesses: req.body.accesses
  })
  try {
    await newCustomers.save();
    res.status(201).json(newCustomers);
  } catch (err) {
    res.status(400).send("Error adding customer");
  }
})

app.delete("/customers/:id", async (req, res) => {
  try {
    const customers = await Customers.findByIdAndDelete(req.params.id);
    res.json({ message: "Customer deleted", customers });
  } catch (err) {
    res.status(400).send("Error deleting customer");
  }
});


app.put("/customers/:id", async (req, res) => {
  try {
    const updatedCustomer = await Customers.findByIdAndUpdate(
      req.params.id,  // Znajdź element po ID
      { name: req.body.name, surname: req.body.surname, street: req.body.street, postcode: req.body.postcode, city: req.body.city, companyname: req.body.companyname, companystreet: req.body.companystreet, companypostcode: req.body.companypostcode, companycity: req.body.companycity, email: req.body.email, invoice: req.body.invoice, login: req.body.login, newsletter: req.body.newsletter, password: req.body.password, phonenumber: req.body.phonenumber, regulations: req.body.regulations, companynip: req.body.companynip, companyregon: req.body.companyregon, accesses: req.body.accesses },  // Zaktualizuj dane
      { new: true }  // Zwróć zaktualizowany obiekt
    );
    res.json(updatedCustomer);
  } catch (err) {
    res.status(400).send("Error updating customer");
  }
});






app.get("/salessites", async (req, res) => {
  try {
    const salessites = await Salessites.find();
    res.json(salessites);
    
  } catch (err) {
    res.status(400).send("Error fetching salessites");
  }
});


app.post('/salessites', async (req, res) => {
  const newSalessites = new Salessites({
    title: req.body.title,
    imageurl: req.body.imageurl,
    numberoflessons: req.body.numberoflessons,
    price: req.body.price,
    pricebeforethirtydays: req.body.pricebeforethirtydays,
    salescontent: req.body.salescontent,
    linktoyoutube: req.body.linktoyoutube,
    contentlist: req.body.contentlist,
    author: req.body.author,
    coursecontent: req.body.coursecontent,
    courselinks: req.body.courselinks,
    accesscode: req.body.accesscode,
  })
  try {
    await newSalessites.save();
    res.status(201).json(newSalessites);
  } catch (err) {
    res.status(400).send("Error adding sales site");
  }
})

app.delete("/salessites/:id", async (req, res) => {
  try {
    const salessites = await Salessites.findByIdAndDelete(req.params.id);
    res.json({ message: "Sales site deleted", salessites });
  } catch (err) {
    res.status(400).send("Error deleting sales sites");
  }
});


app.put("/salessites/:id", async (req, res) => {
  try {
    const updatedSalessite = await Salessites.findByIdAndUpdate(
      req.params.id,  // Znajdź element po ID
      { title: req.body.title, imageurl: req.body.imageurl, numberoflessons: req.body.numberoflessons, price: req.body.price, pricebeforethirtydays: req.body.pricebeforethirtydays, salescontent: req.body.salescontent, linktoyoutube: req.body.linktoyoutube, contentlist: req.body.contentlist, author: req.body.author, coursecontent: req.body.coursecontent, courselinks: req.body.courselinks, accesscode: req.body.accesscode },  // Zaktualizuj dane
      { new: true }  // Zwróć zaktualizowany obiekt
    );
    res.json(updatedSalessite);
  } catch (err) {
    res.status(400).send("Error updating sales site");
  }
});


app.post('/create-checkout-session', async (req, res) => {
  const items = req.body.items;

  const line_items = items.map(item => ({
    price_data: {
      currency: 'pln',
      product_data: {
        name: item.title,
        images: [`http://localhost:5000/${item.imageurl}`],
      },
      unit_amount: Math.round(parseFloat(item.price) * 100), // zł -> grosze
    },
    quantity: 1,
  }));

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card', 'blik'],
      mode: 'payment',
      line_items,
      success_url: 'http://localhost:3000/success?session_id={CHECKOUT_SESSION_ID}',
      cancel_url: 'http://localhost:3000/cancel',
      locale: 'pl',  
    });

    res.json({ id: session.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/check-payment-status', async (req, res) => {
  const sessionId = req.query.sessionId;

  if (!sessionId) return res.status(400).json({ error: 'Brak sessionId' });

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status === 'paid') {
      return res.json({ paid: true });
    } else {
      return res.json({ paid: false });
    }
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});


// Uruchamiamy serwer
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});