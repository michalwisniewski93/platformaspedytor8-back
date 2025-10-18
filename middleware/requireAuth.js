module.exports = function (req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // "Bearer token"

    if (!token) return res.status(401).json({ message: 'Brak tokenu, odmowa dostępu' });
    const secret = (process.env.JWT_ACCESS_SECRET || '').trim();
    if (!secret) return res.status(500).json({ message: 'JWT secret missing' });

    jwt.verify(token, secret, (err, user) => {
        if (err) return res.status(401).json({ message: 'Nieprawidłowy token' });
        req.user = user;
        next();
    });
};

const jwt = require('jsonwebtoken');
