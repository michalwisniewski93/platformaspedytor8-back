const mongoose = require('mongoose')

const articlesSchema = new mongoose.Schema({
    title: {type: String, required: true},
    description: {type: String, required: true},
    author: {type: String, required: true},
    imageurl: {type: String, required: false},
})

const Articles = mongoose.model("Articles", articlesSchema)

module.exports =  Articles