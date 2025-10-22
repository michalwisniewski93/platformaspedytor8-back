const router = require('express').Router();
const { signAccess, signRefresh, verifyRefresh } = require('../utils/jwt');
const rateLimit = require('express-rate-limit');
const Customers = require("../models/Customers");
const authLimiter = rateLimit({ windowMs: 15*60*1000, max: 100 });
const isProd = process.env.NODE_ENV === 'production';

router.use(authLimiter);

router.post('/login', async (req, res) => {
    const { login, password } = req.body;
    if (!login || !password)
        return res.status(400).json({ message: 'Login i hasło są wymagane' });

    const user = await Customers.findOne({ login });
    if (!user)
        return res.status(401).json({ message: 'Nieprawidłowy login lub hasło' });

    const ok = password === user.password;
    if (!ok)
        return res.status(401).json({ message: 'Nieprawidłowy login lub hasło' });

    const payload = { id: user._id.toString(), login: user.login };
    const accessToken = signAccess(payload);
    const refreshToken = signRefresh(payload);
    const isProd = process.env.NODE_ENV === 'production';

    res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: isProd,
        sameSite: isProd ? 'none' : 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({ accessToken, user: { login: user.login } });
});

router.post('/refresh', (req, res) => {
    const token = req.cookies?.refreshToken;
    if (!token) return res.status(401).json({ message: 'Brak refresh tokena' });

    try {
        const data = verifyRefresh(token);
        const accessToken = signAccess({ id: data.id, login: data.login });
        res.json({ accessToken, user: { login: data.login } });
    } catch {
        res.status(401).json({ message: 'Refresh wygasł lub nieprawidłowy' });
    }
});

router.post('/logout', (req, res) => {
    res.clearCookie('refreshToken', {
        httpOnly: true,
        secure: isProd,
        sameSite: isProd ? 'none' : 'lax',
    });
    res.json({ ok: true });
});

module.exports = router;