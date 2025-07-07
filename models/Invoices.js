const mongoose = require('mongoose')

const invoicesSchema = new mongoose.Schema({
    invoicenumber: {type: String, required: true},
    invoicedateofissue: {type: String, required: true},
    dateofsale: {type: String, required: true},
    sellercompanyname: {type: String, required: true},
    sellercompanystreet: {type: String, required: true},
    sellercompanypostcode: {type: String, required: true},
    sellercompanycity: {type: String, required: true},
    sellercompanynip: {type: String, required: true},
    sellercompanyregon: {type: String, required: true},
    customername: {type: String, required: true},
    customersurname: {type: String, required: true},
    customerstreet: {type: String, required: true},
    customerpostcode: {type: String, required: true},
    customercity: {type: String, required: true},
    customercompanyname: {type: String, required: false},
    customercompanystreet: {type: String, required: false},   
    customercompanypostcode: {type: String, required: false},
    customercompanycity: {type: String, required: false},
    customerinvoice: {type: Boolean, required: false},   
    customercompanynip: {type: String, required: false},
    customercompanyregon: {type: String, required: false},
    ordercontent: {type: String, required: true},
    orderamount: {type: Number, required: true},
    basisforvatexemption: {type: String, required: true},
    paymentterm: {type: String, required: true},
    ordertime: {type: String, required: true},
    login: {type: String, required: true}
     
    
})

const Invoices = mongoose.model("Invoices", invoicesSchema)

module.exports = Invoices
