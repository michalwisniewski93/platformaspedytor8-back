const Customers = require('../models/Customers');

const createBaseUser = async () => {
    const login = process.env.PAGE_LOGIN;
    const password = process.env.PAGE_PASSWORD;

    if (!login || !password) {
        throw Error('Nie podano danych bazowego użytkownika')
    }

    const user = await Customers.findOne({ login: login });

    if (!user) {
        await new Customers({ login, password }).save({ validateBeforeSave: false });
    }
}

module.exports = { createBaseUser };
