const mongoose = require('mongoose')

const ordersSchema = new mongoose.Schema({
    name: {type: String, required: false},
    surname: {type: String, required: false},
    street: {type: String, required: false},
    postcode: {type: String, required: false},
    city: {type: String, required: false},
    companyname: {type: String, required: false},
    companystreet: {type: String, required: false},
    companypostcode: {type: String, required: false},
    companycity: {type: String, required: false},
    email: {type: String, required: false},
    invoice: {type: Boolean, required: false},
    login: {type: String, required: false},
    newsletter: {type: Boolean, required: false},
    password: {type: String, required: false},
    phonenumber: {type: String, required: false},
    regulations: {type: Boolean, required: false},
    companynip: {type: String, required: false},
    companyregon: {type: String, required: false},
    ordercontent: {type: String, required: false},
    orderamount: {type: Number, required: false},
    ordertime: {type: String, required: false},

    
})

const Orders = mongoose.model("Orders", ordersSchema)

module.exports =  Orders
