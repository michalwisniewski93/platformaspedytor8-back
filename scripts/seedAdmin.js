require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Login = require('../models/Login');

(async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        const [login, pass] = process.argv.slice(2);
        if (!login || !pass) {
            console.error('Usage: node scripts/seedLogin.js admin StrongPass123!');
            process.exit(1);
        }

        const existing = await Login.findOne({ login });
        if (existing) {
            console.log('Login already exists:', login);
        } else {
            const hash = await bcrypt.hash(pass, 12);
            await Login.create({ login, password: hash });
            console.log('Login created:', login);
        }

        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
})();