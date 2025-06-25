const mongoose = require('mongoose')

const salessitesSchema = new mongoose.Schema({
    title: {type: String, required: true},
    imageurl: {type: String, required: false},
    numberoflessons: {type: Number, required: true},
    price: {type: Number, required: true},
    pricebeforethirtydays: {type: Number, required: true},
    salescontent: {type: String, required: true},
    linktoyoutube: {type: String, required: true},
    contentlist: {type: String, required: true},
    author: {type: String, required: true},
    coursecontent: {type: String, required: true},
    courselinks: {type: String, required: true},
    accesscode: {type: String, required: true},
})

const Salessites = mongoose.model("Salessites", salessitesSchema)

module.exports =  Salessites