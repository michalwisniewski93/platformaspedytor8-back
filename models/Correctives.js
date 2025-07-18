const mongoose = require('mongoose')

const correctivesSchema = new mongoose.Schema({

    numberofcorrectiveinvoice: {type: String, required: false},
    dateofissuecorrectiveinvoice: {type: String, required: false},
    dateofsale: {type: String, required: false},
    numberofnativeinvoice: {type: String, required: false},
    sellercompanyname: {type: String, required: false},
    sellercompanystreet: {type: String, required: false},
    sellercompanypostcode: {type: String, required: false},
    sellercompanycity: {type: String, required: false},
    sellercompanynip: {type: String, required: false},
    sellercompanyregon: {type: String, required: false},
    customername: {type: String, required: false},
    customersurname: {type: String, required: false},
    customerstreet: {type: String, required: false},
    customerpostcode: {type: String, required: false},
    customercity: {type: String, required: false},
    customercompanyname: {type: String, required: false},
    customercompanystreet: {type: String, required: false},
    customercompanypostcode: {type: String, required: false},
    customercompanycity: {type: String, required: false},
    invoice: {type: Boolean, required: false},
    customercompanynip: {type: String, required: false},
    customercompanyregon: {type: String, required: false},
    correctionreason: {type: String, required: false},
    correcteditems: {type: String, required: false},
    summary: {type: String, required: false},
    orderamount: {type: Number, required: false},
    basisforvatexemption: {type: String, required: false},
    paymentterm: {type: String, required: false},
    ordertime: {type: String, required: false},
    login: {type: String, required: false}
    
})

const Correctives = mongoose.model("Correctives", correctivesSchema)

module.exports = Correctives
