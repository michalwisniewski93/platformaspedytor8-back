const express = require("express");
const crypto = require("crypto");
const mongoose = require("mongoose");
const stripe = require('stripe')(process.env.STRIPE_NEW_SECRET);

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
const Orders = require("./models/Orders")
const Taxdatas = require("./models/Taxdatas")
const Invoices = require("./models/Invoices")
const Correctives = require("./models/Correctives")
const Referral = require("./models/Referral")



const app = express();
const port = process.env.PORT || 5000;










// Middleware


const allowedOrigins = [
  'https://platformaspedytor24-front.vercel.app',
  'https://spedytorszkolenia.pl',
  'https://www.spedytorszkolenia.pl',
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);

    // 🧼 Usuń końcowy ukośnik
    const normalizedOrigin = origin.replace(/\/$/, '');
    console.log(`CORS check: origin=${origin} | normalized=${normalizedOrigin}`);

    if (allowedOrigins.includes(normalizedOrigin)) {
      console.log('✅ Origin allowed');
      return callback(null, true);
    }

    console.warn(`❌ Origin blocked: ${origin}`);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));






app.use(express.json());



// 🔑 Zmienne środowiskowe
const TPAY_CLIENT_ID = process.env.TPAY_CLIENT_ID;
const TPAY_SECRET = process.env.TPAY_SECRET;
const TPAY_WEBHOOK_SECRET = process.env.TPAY_WEBHOOK_SECRET;

// osobno front i backend
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";
const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:5000";


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


// ============================================================
// 1. Pobranie access_token
// ============================================================
async function getAccessToken() {
  const response = await fetch("https://api.tpay.com/oauth/auth", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: TPAY_CLIENT_ID,
      client_secret: TPAY_SECRET,
      grant_type: "client_credentials",
    }),
  });

  if (!response.ok) {
    throw new Error("Błąd podczas pobierania access_token");
  }

  const data = await response.json();
  return data.access_token;
}






// === POMOCNICZA FUNKCJA DO RESETOWANIA invoicesactualnumber ===
const resetInvoicesNumber = async () => {
  try {
    const doc = await Taxdatas.findById("6867cecac69b1bd9988c38d8");
    if (!doc) return;

    const today = new Date();
    const firstDayThisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastReset = doc.lastReset ? new Date(doc.lastReset) : null;

    const alreadyReset = lastReset &&
      lastReset.getFullYear() === today.getFullYear() &&
      lastReset.getMonth() === today.getMonth();

    if (!alreadyReset) {
      doc.invoicesactualnumber = 0;
      doc.lastReset = today;
      await doc.save();
      console.log("✅ invoicesactualnumber zresetowane na 0");
    } else {
      console.log("ℹ️ Już było zresetowane w tym miesiącu");
    }
  } catch (err) {
    console.error("❌ Błąd resetowania invoicesactualnumber:", err);
  }
};





// MongoDB połączenie
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log("Connected to MongoDB");
    resetInvoicesNumber(); // <<< WYWOŁANIE FUNKCJI PO POŁĄCZENIU
  })
  .catch((err) => console.log("MongoDB connection error:", err));

app.get("/", (req, res) => {
  res.send("Hello from Express!");
});

app.get('/test-cors', (req, res) => {
  res.json({ success: true, origin: req.headers.origin });
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
        
      },
      unit_amount: Math.round(parseFloat(item.price) * 100), // zł -> grosze
    },
    quantity: 1,
  }));

  // Pobierz domenę z nagłówka lub ustaw domyślną
  const domain = req.headers.origin?.startsWith('https://') 
    ? req.headers.origin 
    : 'https://spedytorszkolenia.pl'; // fallback, jeśli brak nagłówka

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card', 'blik'],
      mode: 'payment',
      line_items,
      success_url: `${domain}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${domain}/cancel`,
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



app.get("/orders", async (req, res) => {
  try {
    const orders = await Orders.find();
    res.json(orders);
    
  } catch (err) {
    res.status(400).send("Error fetching orders");
  }
});


app.post('/orders', async (req, res) => {
  try {
    const {
      name, surname, street, postcode, city,
      companyname, companystreet, companypostcode, companycity,
      email, invoice, login, newsletter, password, phonenumber,
      regulations, companynip, companyregon, ordercontent, orderamount, ordertime,
      transactionId // to jest "ta_…" z frontendu
    } = req.body;

    if (!email) return res.status(400).json({ error: "Brak email" });
    if (!orderamount || isNaN(orderamount)) return res.status(400).json({ error: "Niepoprawny orderamount" });

    let parsedOrderContent = Array.isArray(ordercontent) ? ordercontent : JSON.parse(ordercontent || "[]");

    const newOrder = new Orders({
      name, surname, street, postcode, city,
      companyname, companystreet, companypostcode, companycity,
      email, invoice, login, newsletter, password, phonenumber,
      regulations, companynip, companyregon,
      ordercontent: parsedOrderContent,
      orderamount,
      ordertime,
      transactionId,
      paid: false, // domyślnie
    });

    await newOrder.save();
    res.status(201).json(newOrder);

  } catch (err) {
    console.error("Błąd przy dodawaniu zamówienia:", err);
    res.status(500).json({ error: "Błąd serwera przy dodawaniu zamówienia", details: err.message });
  }
});




app.put("/orders/:id", async (req, res) => {
  try {
    const updatedOrder = await Orders.findByIdAndUpdate(
      req.params.id,  // Znajdź element po ID
      { name: req.body.name,
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
    ordercontent: req.body.ordercontent,
    orderamount: req.body.orderamount,
    ordertime: req.body.ordertime  },  // Zaktualizuj dane
      { new: true }  // Zwróć zaktualizowany obiekt
    );
    res.json(updatedOrder);
  } catch (err) {
    res.status(400).send("Error updating order");
  }
});


app.delete("/orders/:id", async (req, res) => {
  try {
    const orders = await Orders.findByIdAndDelete(req.params.id);
    res.json({ message: "Orders deleted", orders });
  } catch (err) {
    res.status(400).send("Error deleting orders");
  }
});


app.get("/taxdatas", async (req, res) => {
  try {
    const taxdatas = await Taxdatas.find();
    res.json(taxdatas);
    
  } catch (err) {
    res.status(400).send("Error fetching taxdatas");
  }
});



app.put("/taxdatas/:id", async (req, res) => {
  try {
    const updatedTaxdata = await Taxdatas.findByIdAndUpdate(
      req.params.id,  // Znajdź element po ID
      { sellercompanyname: req.body.sellercompanyname,
        sellercompanystreet: req.body.sellercompanystreet,
        sellercompanypostcode: req.body.sellercompanypostcode,
        sellercompanycity: req.body.sellercompanycity,
        sellercompanynip: req.body.sellercompanynip,
        sellercompanyregon: req.body.sellercompanyregon,
        invoicesactualnumber: req.body.invoicesactualnumber,
        vatpercentage: req.body.vatpercentage,
        basisforvatexemption: req.body.basisforvatexemption,
    },  // Zaktualizuj dane
      { new: true }  // Zwróć zaktualizowany obiekt
    );
    res.json(updatedTaxdata);
  } catch (err) {
    res.status(400).send("Error updating taxdata");
  }
});


app.get("/invoices", async (req, res) => {
  try {
    const invoices = await Invoices.find();
    res.json(invoices);
    
  } catch (err) {
    res.status(400).send("Error fetching invoices");
  }
});


app.post('/invoices', async (req, res) => {
  const newInvoices = new Invoices({
    
    invoicenumber: req.body.invoicenumber,
    invoicedateofissue: req.body.invoicedateofissue,
    dateofsale: req.body.dateofsale,
    sellercompanyname: req.body.sellercompanyname, 
    sellercompanystreet: req.body.sellercompanystreet,
    sellercompanypostcode: req.body.sellercompanypostcode,
    sellercompanycity: req.body.sellercompanycity,
    sellercompanynip: req.body.sellercompanynip,
    sellercompanyregon: req.body.sellercompanyregon,
    customername: req.body.customername,
    customersurname: req.body.customersurname,
    customerstreet: req.body.customerstreet,
    customerpostcode: req.body.customerpostcode,
    customercity: req.body.customercity,
    customercompanyname: req.body.customercompanyname,
    customercompanystreet: req.body.customercompanystreet,   
    customercompanypostcode: req.body.customercompanypostcode,
    customercompanycity: req.body.customercompanycity,
    customerinvoice: req.body.customerinvoice,   
    customercompanynip: req.body.customercompanynip,
    customercompanyregon: req.body.customercompanyregon,
    ordercontent: req.body.ordercontent,
    orderamount: req.body.orderamount,
    basisforvatexemption: req.body.basisforvatexemption,
    paymentterm: req.body.paymentterm,
    ordertime: req.body.ordertime,
    login: req.body.login,
     
  })
  try {
    await newInvoices.save();
    res.status(201).json(newInvoices);
  } catch (err) {
    res.status(400).send("Error adding invoice");
  }
})



app.put("/invoices/:id", async (req, res) => {
  try {
    const updatedInvoice = await Invoices.findByIdAndUpdate(
      req.params.id,  // Znajdź element po ID
      { invoicenumber: req.body.invoicenumber,
    invoicedateofissue: req.body.invoicedateofissue,
    dateofsale: req.body.dateofsale,
    sellercompanyname: req.body.sellercompanyname, 
    sellercompanystreet: req.body.sellercompanystreet,
    sellercompanypostcode: req.body.sellercompanypostcode,
    sellercompanycity: req.body.sellercompanycity,
    sellercompanynip: req.body.sellercompanynip,
    sellercompanyregon: req.body.sellercompanyregon,
    customername: req.body.customername,
    customersurname: req.body.customersurname,
    customerstreet: req.body.customerstreet,
    customerpostcode: req.body.customerpostcode,
    customercity: req.body.customercity,
    customercompanyname: req.body.customercompanyname,
    customercompanystreet: req.body.customercompanystreet,   
    customercompanypostcode: req.body.customercompanypostcode,
    customercompanycity: req.body.customercompanycity,
    customerinvoice: req.body.customerinvoice,   
    customercompanynip: req.body.customercompanynip,
    customercompanyregon: req.body.customercompanyregon,
    ordercontent: req.body.ordercontent,
    orderamount: req.body.orderamount,
    basisforvatexemption: req.body.basisforvatexemption,
    paymentterm: req.body.paymentterm,
    ordertime: req.body.ordertime,
    login: req.body.login
    },  // Zaktualizuj dane
      { new: true }  // Zwróć zaktualizowany obiekt
    );
    res.json(updatedInvoice);
  } catch (err) {
    res.status(400).send("Error updating invoice");
  }
});



app.delete("/invoices/:id", async (req, res) => {
  try {
    const invoices = await Invoices.findByIdAndDelete(req.params.id);
    res.json({ message: "Invoices deleted", invoices });
  } catch (err) {
    res.status(400).send("Error deleting invoices");
  }
});



app.get("/correctives", async (req, res) => {
  try {
    const correctives = await Correctives.find();
    res.json(correctives);
    
  } catch (err) {
    res.status(400).send("Error fetching correctives");
  }
});


app.post('/correctives', async (req, res) => {
  const newCorrectives = new Correctives({
    numberofcorrectiveinvoice: req.body.numberofcorrectiveinvoice,
    dateofissuecorrectiveinvoice: req.body.dateofissuecorrectiveinvoice,
    dateofsale: req.body.dateofsale,
    numberofnativeinvoice: req.body.numberofnativeinvoice,
    sellercompanyname: req.body.sellercompanyname,
    sellercompanystreet: req.body.sellercompanystreet,
    sellercompanypostcode: req.body.sellercompanypostcode,
    sellercompanycity: req.body.sellercompanycity,
    sellercompanynip: req.body.sellercompanynip,
    sellercompanyregon: req.body.sellercompanyregon,
    customername: req.body.customername,
    customersurname: req.body.customersurname,
    customerstreet: req.body.customerstreet,
    customerpostcode: req.body.customerpostcode,
    customercity: req.body.customercity,
    customercompanyname: req.body.customercompanyname,
    customercompanystreet: req.body.customercompanystreet,
    customercompanypostcode: req.body.customercompanypostcode,
    customercompanycity: req.body.customercompanycity,
    invoice: req.body.invoice,
    customercompanynip: req.body.customercompanynip,
    customercompanyregon: req.body.customercompanyregon,
    correctionreason: req.body.correctionreason,
    correcteditems: req.body.correcteditems,
    summary: req.body.summary,
    orderamount: req.body.orderamount,
    basisforvatexemption: req.body.basisforvatexemption,
    paymentterm: req.body.paymentterm,
    ordertime: req.body.ordertime,
    login: req.body.login,
  
     
  })
  try {
    await newCorrectives.save();
    res.status(201).json(newCorrectives);
  } catch (err) {
    res.status(400).send("Error adding corrective");
  }
})



app.put("/correctives/:id", async (req, res) => {
  try {
    const updatedCorrective = await Correctives.findByIdAndUpdate(
      req.params.id,  // Znajdź element po ID
      { 
    
    numberofcorrectiveinvoice: req.body.numberofcorrectiveinvoice,
    dateofissuecorrectiveinvoice: req.body.dateofissuecorrectiveinvoice,
    dateofsale: req.body.dateofsale,
    numberofnativeinvoice: req.body.numberofnativeinvoice,
    sellercompanyname: req.body.sellercompanyname,
    sellercompanystreet: req.body.sellercompanystreet,
    sellercompanypostcode: req.body.sellercompanypostcode,
    sellercompanycity: req.body.sellercompanycity,
    sellercompanynip: req.body.sellercompanynip,
    sellercompanyregon: req.body.sellercompanyregon,
    customername: req.body.customername,
    customersurname: req.body.customersurname,
    customerstreet: req.body.customerstreet,
    customerpostcode: req.body.customerpostcode,
    customercity: req.body.customercity,
    customercompanyname: req.body.customercompanyname,
    customercompanystreet: req.body.customercompanystreet,
    customercompanypostcode: req.body.customercompanypostcode,
    customercompanycity: req.body.customercompanycity,
    invoice: req.body.invoice,
    customercompanynip: req.body.customercompanynip,
    customercompanyregon: req.body.customercompanyregon,
    correctionreason: req.body.correctionreason,
    correcteditems: req.body.correcteditems,
    summary: req.body.summary,
    orderamount: req.body.orderamount,
    basisforvatexemption: req.body.basisforvatexemption,
    paymentterm: req.body.paymentterm,
    ordertime: req.body.ordertime,
    login: req.body.login,
    },  // Zaktualizuj dane
      { new: true }  // Zwróć zaktualizowany obiekt
    );
    res.json(updatedCorrective);
  } catch (err) {
    res.status(400).send("Error updating corrective");
  }
});



app.delete("/correctives/:id", async (req, res) => {
  try {
    const correctives = await Correctives.findByIdAndDelete(req.params.id);
    res.json({ message: "Correctives deleted", correctives });
  } catch (err) {
    res.status(400).send("Error deleting correctives");
  }
});


app.post("/api/track", async (req, res) => {
  const { source } = req.body;

  if (!source) return res.status(400).json({ error: "Brak źródła" });

  await Referral.findOneAndUpdate(
    { source },
    { $inc: { count: 1 } },
    { upsert: true }
  );

  res.json({ message: "Zapisano" });
});

// 📌 API do pobrania statystyk
app.get("/api/stats", async (req, res) => {
  const stats = await Referral.find({});
  res.json(stats);
});
// ============================================================
// 2. Tworzenie transakcji (Tpay)
// ============================================================
app.post("/tpay/create-transaction", async (req, res) => {
  try {
    const { items, totalPrice, email } = req.body;

    console.log("DEBUG: items z frontendu:", items);
    console.log("DEBUG: totalPrice z frontendu:", totalPrice);
    console.log("DEBUG: email z frontendu:", email);

    if (!totalPrice || isNaN(totalPrice)) {
      throw new Error(`Niepoprawna wartość totalPrice: ${totalPrice}`);
    }

    const accessToken = await getAccessToken();
    console.log("DEBUG: accessToken Tpay:", accessToken);

    // Pobierz domenę z nagłówka lub ustaw domyślną
    const domain = req.headers.origin?.startsWith('https://') 
      ? req.headers.origin 
      : 'https://spedytorszkolenia.pl';

    const requestBody = {
      amount: parseFloat(totalPrice).toFixed(2), // np. "438.00"
      currency: "PLN",
      description: "Zakup kursów online",
      hiddenDescription: "Platforma spedytor",
      payer: {
        email: email || "test@example.com",
      },
      callbacks: {
        notification: [
          { url: `${BACKEND_URL}/tpay/webhook`, method: "POST" }
        ]
      },
      returnUrl: `${domain}/success`, // przekierowanie po udanej płatności
      cancelUrl: `${domain}/cancel`   // przekierowanie po anulowanej lub nieudanej płatności
    };

    console.log("DEBUG: requestBody do Tpay:", JSON.stringify(requestBody, null, 2));

    const response = await fetch("https://api.tpay.com/transactions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(requestBody),
    });

    const data = await response.json();
    console.log("DEBUG: pełna odpowiedź Tpay:", JSON.stringify(data, null, 2));

    if (!data || !data.transactionPaymentUrl) {
      console.error("❌ Brak transactionPaymentUrl w odpowiedzi Tpay");
      return res.status(400).json({ 
        error: "Brak transactionPaymentUrl z Tpay", 
        tpayData: data
      });
    }

    res.json({
      transactionId: data.transactionId,
      title: data.title,
      transactionPaymentUrl: data.transactionPaymentUrl,
    });

  } catch (err) {
    console.error("Błąd przy tworzeniu transakcji:", err);
    res.status(500).json({ error: "Błąd przy tworzeniu transakcji", details: err.message });
  }
});




// ============================================================
// 3. Sprawdzenie statusu
// ============================================================
app.get("/tpay/check-status/:transactionId", async (req, res) => {
  try {
    const accessToken = await getAccessToken();
    const { transactionId } = req.params;

    const response = await fetch(
      `https://api.tpay.com/transactions/${transactionId}`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error("Błąd przy sprawdzaniu statusu:", err);
    res.status(500).json({ error: "Błąd przy sprawdzaniu statusu transakcji" });
  }
});





// ============================================================
// 4. Webhook Tpay
// ============================================================
// Parser tylko dla webhooka (x-www-form-urlencoded)
app.use("/tpay/webhook", express.urlencoded({ extended: false }));

app.post("/tpay/webhook", async (req, res) => {
  try {
    console.log("===== NOWY WEBHOOK =====");
    console.log("Body:", req.body);

    // Sprawdzenie tr_crc
    const expectedCrc = "Platforma spedytor";
    if (req.body.tr_crc !== expectedCrc) {
      console.warn("❌ Niepoprawny tr_crc!");
      return res.status(400).send("Invalid CRC");
    }

    // Status płatności
    if (req.body.tr_status === "TRUE" || req.body.tr_status === "PAID") {
      console.log("💰 Transakcja opłacona, nadaję dostęp użytkownikowi...");

      // Szukamy zamówienia po tr_id lub e-mailu + amount
      const order = await Orders.findOne({
        tr_id: req.body.tr_id
      });

      if (!order) {
        console.warn("⚠️ Nie znaleziono zamówienia dla tr_id:", req.body.tr_id);
        return res.send("TRUE"); // Tpay wymaga odpowiedzi, nawet jeśli nie znaleziono
      }

      // Aktualizacja zamówienia
      order.paid = true;
      order.tr_id = req.body.tr_id; // zapis tr_id z webhooka
      await order.save();

      console.log("✅ Zamówienie oznaczone jako opłacone:", order._id);
    } else {
      console.log("ℹ️ Status transakcji:", req.body.tr_status);
    }

    // Tpay wymaga odpowiedzi "TRUE"
    res.send("TRUE");

  } catch (err) {
    console.error("Błąd w webhooku:", err);
    res.status(500).send("FALSE");
  }
});









// Uruchamiamy serwer
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
