import Login from "../models/Login.js";

const createBaseUser = async () => {
    const login = process.env.PAGE_LOGIN;
    const password = process.env.PAGE_PASSWORD;

    const user = await Login.findOne({ login: login });

    if (!user) {
        await new Login({ login, password }).save();
    }
}

export { createBaseUser };
