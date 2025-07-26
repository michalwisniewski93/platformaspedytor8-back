const express = require("express");
const mongoose = require("mongoose");
const stripe = require('stripe')(process.env.STRIPE_SECRET);
const cors = require("cors");
const multer = require('multer');
const path = require('path');
require("dotenv").config();

// Models
const Login = require("./models/Login");
const Tickets = require("./models/Tickets");
const Articles = require("./models/Articles");
const Customers = require("./models/Customers");
const Salessites = require("./models/Salessites");
const Orders = require("./models/Orders");
const Taxdatas = require("./models/Taxdatas");
const Invoices = require("./models/Invoices");
const Correctives = require("./models/Correctives");

const app = express();
const port = process.env.PORT || 5000;

// MongoDB connection caching
let isConnected = false;
async function connectToDatabase() {
  if (isConnected) return;
  try {
    const db = await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 30000,
    });
    isConnected = db.connections[0].readyState;
    console.log('✅ MongoDB connected');
  } catch (err) {
    console.error('❌ MongoDB connection error:', err.message);
    throw err;
  }
}

// Middleware: ensure DB connection for every request
app.use(async (req, res, next) => {
  try {
    await connectToDatabase();
    next();
  } catch (err) {
    res.status(500).json({ error: 'Database connection failed' });
  }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use('/static', express.static(path.join(__dirname, 'public/static')));

// Multer config for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'public/static'),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname)),
});
const upload = multer({ storage });

// Helper: reset invoices counter monthly
const resetInvoicesNumber = async () => {
  try {
    const doc = await Taxdatas.findById("6867cecac69b1bd9988c38d8");
    if (!doc) return;
    const today = new Date();
    const lastReset = doc.lastReset ? new Date(doc.lastReset) : null;
    const alreadyReset = lastReset &&
      lastReset.getFullYear() === today.getFullYear() &&
      lastReset.getMonth() === today.getMonth();
    if (!alreadyReset) {
      doc.invoicesactualnumber = 0;
      doc.lastReset = today;
      await doc.save();
      console.log("✅ invoicesactualnumber reset to 0");
    }
  } catch (err) {
    console.error("❌ invoices reset error:", err.message);
  }
};

// Reset invoices counter on startup
eventLoopTick();
async function eventLoopTick() {
  try {
    await connectToDatabase();
    resetInvoicesNumber();
  } catch {};
}

// Routes
app.get('/', (req, res) => res.send('Hello from Express!'));

app.get('/login', async (req, res) => {
  try { const logins = await Login.find(); res.json(logins); }
  catch { res.status(400).send('Error fetching admin logins'); }
});

// Tickets CRUD
app.get('/tickets', async (req, res) => { try { res.json(await Tickets.find()); } catch { res.status(400).send('Error fetching tickets'); } });
app.post('/tickets', async (req, res) => { try { const ticket = await Tickets.create(req.body); res.status(201).json(ticket); } catch { res.status(400).send('Error adding ticket'); } });
app.put('/tickets/:id', async (req, res) => { try { res.json(await Tickets.findByIdAndUpdate(req.params.id, req.body, { new: true })); } catch { res.status(400).send('Error updating ticket'); } });

// File upload
app.post('/upload', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).send('No file uploaded');
  res.json({ imageUrl: `/static/${req.file.filename}` });
});

// Articles
app.get('/articles', async (req, res) => { try { res.json(await Articles.find()); } catch { res.status(400).send('Error fetching articles'); } });
app.post('/articles', async (req, res) => { try { const art = await Articles.create(req.body); res.status(201).json(art); } catch { res.status(400).send('Error adding article'); } });
app.delete('/articles/:id', async (req, res) => { try { res.json({ message: 'Article deleted', doc: await Articles.findByIdAndDelete(req.params.id) }); } catch { res.status(400).send('Error deleting article'); } });

// Customers
app.get('/customers', async (req, res) => { try { res.json(await Customers.find()); } catch { res.status(400).send('Error fetching customers'); } });
app.post('/customers', async (req, res) => { try { res.status(201).json(await Customers.create(req.body)); } catch { res.status(400).send('Error adding customer'); } });
app.put('/customers/:id', async (req, res) => { try { res.json(await Customers.findByIdAndUpdate(req.params.id, req.body, { new: true })); } catch { res.status(400).send('Error updating customer'); } });
app.delete('/customers/:id', async (req, res) => { try { res.json({ message: 'Customer deleted', doc: await Customers.findByIdAndDelete(req.params.id) }); } catch { res.status(400).send('Error deleting customer'); } });

// Salessites
app.get('/salessites', async (req, res) => { try { res.json(await Salessites.find()); } catch { res.status(400).send('Error fetching salessites'); } });
app.post('/salessites', async (req, res) => { try { res.status(201).json(await Salessites.create(req.body)); } catch { res.status(400).send('Error adding sales site'); } });
app.put('/salessites/:id', async (req, res) => { try { res.json(await Salessites.findByIdAndUpdate(req.params.id, req.body, { new: true })); } catch { res.status(400).send('Error updating sales site'); } });
app.delete('/salessites/:id', async (req, res) => { try { res.json({ message: 'Sales site deleted', doc: await Salessites.findByIdAndDelete(req.params.id) }); } catch { res.status(400).send('Error deleting sales site'); } });

// Stripe checkout
app.post('/create-checkout-session', async (req, res) => {
  try {
    const line_items = req.body.items.map(item => ({
      price_data: {
        currency: 'pln',
        product_data: { name: item.title, images: [
          `https://${process.env.VERCEL_URL}/${item.imageurl}`
        ] },
        unit_amount: Math.round(parseFloat(item.price) * 100),
      },
      quantity: 1,
    }));
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card', 'blik'], mode: 'payment',
      line_items, success_url: 'https://spedytorszkolenia.pl/success?session_id={CHECKOUT_SESSION_ID}',
      cancel_url: 'https://spedytorszkolenia.pl/cancel', locale: 'pl',
    });
    res.json({ id: session.id });
  } catch (err) { res.status(500).json({ error: err.message }); }
});
app.get('/check-payment-status', async (req, res) => {
  try {
    const session = await stripe.checkout.sessions.retrieve(req.query.sessionId);
    res.json({ paid: session.payment_status === 'paid' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Orders
app.get('/orders', async (req, res) => { try { res.json(await Orders.find()); } catch { res.status(400).send('Error fetching orders'); } });
app.post('/orders', async (req, res) => { try { res.status(201).json(await Orders.create(req.body)); } catch { res.status(400).send('Error adding order'); } });
app.put('/orders/:id', async (req, res) => { try { res.json(await Orders.findByIdAndUpdate(req.params.id, req.body, { new: true })); } catch { res.status(400).send('Error updating order'); } });
app.delete('/orders/:id', async (req, res) => { try { res.json({ message: 'Order deleted', doc: await Orders.findByIdAndDelete(req.params.id) }); } catch { res.status(400).send('Error deleting order'); } });

// Taxdatas
app.get('/taxdatas', async (req, res) => { try { res.json(await Taxdatas.find()); } catch { res.status(400).send('Error fetching taxdatas'); } });
app.put('/taxdatas/:id', async (req, res) => { try { res.json(await Taxdatas.findByIdAndUpdate(req.params.id, req.body, { new: true })); } catch { res.status(400).send('Error updating taxdata'); } });

// Invoices
app.get('/invoices', async (req, res) => { try { res.json(await Invoices.find()); } catch { res.status(400).send('Error fetching invoices'); } });
app.post('/invoices', async (req, res) => { try { res.status(201).json(await Invoices.create(req.body)); } catch { res.status(400).send('Error adding invoice'); } });
app.put('/invoices/:id', async (req, res) => { try { res.json(await Invoices.findByIdAndUpdate(req.params.id, req.body, { new: true })); } catch { res.status(400).send('Error updating invoice'); } });
app.delete('/invoices/:id', async (req, res) => { try { res.json({ message: 'Invoice deleted', doc: await Invoices.findByIdAndDelete(req.params.id) }); } catch { res.status(400).send('Error deleting invoice'); } });

// Correctives
app.get('/correctives', async (req, res) => { try { res.json(await Correctives.find()); } catch { res.status(400).send('Error fetching correctives'); } });
app.post('/correctives', async (req, res) => { try { res.status(201).json(await Correctives.create(req.body)); } catch { res.status(400).send('Error adding corrective'); } });
app.put('/correctives/:id', async (req, res) => { try { res.json(await Correctives.findByIdAndUpdate(req.params.id, req.body, { new: true })); } catch { res.status(400).send('Error updating corrective'); } });
app.delete('/correctives/:id', async (req, res) => { try { res.json({ message: 'Corrective deleted', doc: await Correctives.findByIdAndDelete(req.params.id) }); } catch { res.status(400).send('Error deleting corrective'); } });

// Start server locally
if (process.env.NODE_ENV !== 'production') {
  app.listen(port, () => console.log(`Server running on http://localhost:${port}`));
}

module.exports = app;
