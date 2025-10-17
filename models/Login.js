const mongoose = require('mongoose')

const loginSchema = new mongoose.Schema({
    login: {type: String, required: true, select: false},
    password: { type: String, required: true, select: false },
})

const Login = mongoose.model("Login", loginSchema)

module.exports = Login
