const mongoose = require('mongoose')

const ordersSchema = new mongoose.Schema({
    name: {type: String, required: true},
    surname: {type: String, required: true},
    street: {type: String, required: true},
    postcode: {type: String, required: true},
    city: {type: String, required: true},
    companyname: {type: String, required: true},
    companystreet: {type: String, required: true},
    companypostcode: {type: String, required: true},
    companycity: {type: String, required: true},
    email: {type: String, required: true},
    invoice: {type: Boolean, required: true},
    login: {type: String, required: true},
    newsletter: {type: Boolean, required: true},
    password: {type: String, required: true},
    phonenumber: {type: String, required: true},
    regulations: {type: Boolean, required: true},
    companynip: {type: String, required: true},
    companyregon: {type: String, required: true},
    ordercontent: {type: String, required: true},
    orderamount: {type: Number, required: true},
    ordertime: {type: String, required: true},

    
})

const Orders = mongoose.model("Orders", ordersSchema)

module.exports =  Orders
