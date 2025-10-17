const mongoose = require('mongoose')

const customersSchema = new mongoose.Schema({
    name: {type: String, required: true},
    surname: {type: String, required: true},
    street: {type: String, required: true},
    postcode: {type: String, required: true},
    city: {type: String, required: true},
    companyname: {type: String, required: false},
    companystreet: {type: String, required: false},
    companypostcode: {type: String, required: false},
    companycity: {type: String, required: false},
    email: {type: String, required: true},
    invoice: {type: Boolean, required: true},
    login: {type: String, required: true},
    newsletter: {type: Boolean, required: false},
    password: {type: String, required: true},
    phonenumber: {type: String, required: true},
    regulations: {type: Boolean, required: true},
    companynip: {type: Number, required: false},
    companyregon: {type: Number, required: false},
    accesses: {type: String, required: true},
})

const Customers = mongoose.model("Customers", customersSchema)

const bcrypt = require('bcryptjs');

customersSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

customersSchema.pre('findOneAndUpdate', async function(next){
  const update = this.getUpdate();
  if (update.password) update.password = await bcrypt.hash(update.password, 12);
  next();
});


module.exports = Customers
