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
const Orders = require("./models/Orders")
const Taxdatas = require("./models/Taxdatas")
const Invoices = require("./models/Invoices")
const Correctives = require("./models/Correctives")



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
  try {
    console.log('REQ BODY:', req.body);
    const { items } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ error: 'Brak produktów w koszyku' });
    }

    // Mapowanie koszyka do formatu Stripe
    const line_items = items.map(item => ({
      price_data: {
        currency: 'pln',
        product_data: {
          name: item.title,
          description: item.author,
          images: [`https://platformaspedytor8-back-production.up.railway.app/${item.imageurl}`]
        },
        unit_amount: Math.round(parseFloat(item.price) * 100), // w groszach
      },
      quantity: 1,
    }));

    // Tworzymy sesję Checkout
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items,
      mode: 'payment',
      success_url: 'https://spedytorszkolenia.pl/success',
      cancel_url: 'https://spedytorszkolenia.pl/cancel',
    });

    res.json({ id: session.id });

  } catch (error) {
    console.error('Błąd Stripe:', error);
    res.status(500).json({ error: 'Błąd przy tworzeniu sesji Stripe' });
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
  const newOrders = new Orders({
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
    ordercontent: req.body.ordercontent,
    orderamount: req.body.orderamount,
    ordertime: req.body.ordertime,
  })
  try {
    await newOrders.save();
    res.status(201).json(newOrders);
  } catch (err) {
    res.status(400).send("Error adding order");
  }
})



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


// Uruchamiamy serwer
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
