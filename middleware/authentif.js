const { verifyToken, LatteJWT } = require("../helper/jwtbcrypt.js");
const { Sa_user } = require("../model/index.js");

const authentif = async (req, res, next) => {
    try {
        const { authorization } = req.headers;

        if (authorization.split(' ')[0] !== 'Super') {
            throw { message: "JSON Web Token Error" };
        }

        const payload = LatteJWT(authorization, 'decrypt');

        const userLogged = await Sa_user.findOne(
            {
                _id: payload.id,
                acs: payload.acs,
                eml: payload.eml
            },
        );

        if (!userLogged) {
            throw { message: "JSON Web Token Error" };
        }

        req.user = {
            email: userLogged.eml,
            username: userLogged.usr,
        };
        next();
    } catch (error) {
        console.log(error);
        next(error)
    }
};

module.exports = {
    authentif,
};
