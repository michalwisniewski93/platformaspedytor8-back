const mongoose = require('mongoose')

const loginSchema = new mongoose.Schema({
    login: {type: String, required: true},
    password: {type: String, required: true},
})

const Login = mongoose.model("Login", loginSchema)

module.exports = Login