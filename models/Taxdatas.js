const mongoose = require('mongoose')

const taxdatasSchema = new mongoose.Schema({
    sellercompanyname: {type: String, required: true},
    sellercompanystreet: {type: String, required: true},
    sellercompanypostcode: {type: String, required: true},
    sellercompanycity: {type: String, required: true},
    sellercompanynip: {type: String, required: true},
    sellercompanyregon: {type: String, required: true},
    invoicesactualnumber: {type: Number, required: true},
    vatpercentage: {type: Number, required: true},
    basisforvatexemption: {type: String, required: true},
    lastReset: { type: String, required: false }, 
    
})

const Taxdatas = mongoose.model("Taxdatas", taxdatasSchema)

module.exports = Taxdatas
