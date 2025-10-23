module.exports = async function(req, res, next) {
    const originHeader = req.headers['origin'];
    const authHeader = req.headers['authorization'];

    // Jeśli token jest już dodany, lub request pochodzi z strony, która nie powinna mieć dostępu
    // nie przyznawaj / nie nadpisuj tokenu
    if (authHeader || !ALLOWED_ORIGINS.includes(originHeader)) {
        next();
        return;
    }

    // Request pochodzi ze strony mogącej wykonywać zapytania, więc można przyznać jej token
    const user = await Customers.findOne({ login: process.env.PAGE_LOGIN });

    if (!user) {
        throw Error('Bazowy użytkownik nie istnieje')
    }

    const isPasswordOk = process.env.PAGE_PASSWORD === user.password;
    if (isPasswordOk) {
        const payload = { id: user._id.toString(), login: user.login };
        req.accessToken = signAccess(payload);
    }

    next();
};

const ALLOWED_ORIGINS = require("../consts/allowedOrigins");
const { signAccess } = require("../utils/jwt");
const Customers = require("../models/Customers");
