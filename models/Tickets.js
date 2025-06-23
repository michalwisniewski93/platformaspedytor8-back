const mongoose = require('mongoose')

const ticketSchema = new mongoose.Schema({
    nameandsurname: {type: String, required: true},
    email: {type: String, required: true},
    message: {type: String, required: true},
    time: {type: String, required: true},
    status: {type: Boolean, required: true}
})

const Tickets = mongoose.model("Ticket", ticketSchema)

module.exports = Tickets