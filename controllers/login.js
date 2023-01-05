const { date2number } = require("../helper/date2number")
const { hashPassword, createToken, checkPassword, verifyToken, LatteJWT } = require("../helper/jwtbcrypt")
const { jsonData } = require("../middleware/sucess")
const { Sa_user, Sa_activity_log } = require("../model")

class LoginController {
    static async register(req, res) {
        try {
            let { usr, eml, password, acs } = req.body

            let pwd = hashPassword(password)

            let insertData = { usr, eml, pwd, acs }

            const newSuperAdmin = new Sa_user(insertData)
            newSuperAdmin.save(function (err) {
                if (err) {
                    throw new (err)
                } else {
                    res.status(200).json(jsonData("success insert data"))
                }
            })

        } catch (error) {
            console.log(error)
            res.status(500).json("Failed insert data")
        }
    }

    static async login(req, res, next) {
        try {
            let { username_email, password } = req.body


            if (!username_email) {
                throw { message: 'username or email is required' }
            }

            if (!password) {
                throw { message: 'password is required' }
            }

            let findUser

            if (username_email.split("@").length > 1) {
                findUser = await Sa_user.findOne({ eml: username_email })
            }

            if (username_email.split("@").length === 1) {
                findUser = await Sa_user.findOne({ usr: username_email })
            }

            if (!findUser) {
                throw { message: "Invalid email/password" };
            }

            const checkPass = checkPassword(password, findUser.pwd);


            if (!checkPass) {
                throw { message: "Invalid email/password" };
            }

            const payload = {
                id: findUser._id,
                eml: findUser.eml,
                acs: findUser.acs
            };

            const resultToken = LatteJWT(payload, 'encrypt')

            const result = {
                token : resultToken
            }

            const addData = new Sa_activity_log(
                {
                    eml: findUser.eml,
                    usr: findUser.usr,
                    act: 'Login ke Super Admin',
                    ep: date2number('')
                }
            )

            addData.save((err) => {
                if (err) {
                    console.log(err);
                    next(err)
                } else {
                    res.status(200).json(jsonData(result));
                }
            })

        } catch (error) {
            console.log(error)
            next(error)
        }
    }

    static async edit_pass(req, res) {
        try {
            const { oldPass, newPass, confirmPass } = req.body

            if (newPass !== confirmPass) {
                throw { message: "Your password can't be different" }
            }

            const { access_token } = req.headers

            const email_logged = verifyToken(access_token).eml

            const findUser = await Sa_user.findOne({
                eml: email_logged
            })

            const checkPass = checkPassword(oldPass, findUser.password)


            if (checkPass === false) {
                throw { message: 'passowrd is invalid' }
            }

            const hashNewPass = hashPassword(newPass)


            const edit_user = await Sa_user.findOneAndUpdate(
                { 'eml': email_logged }, { '$set': { 'password': hashNewPass } }
            )

            res.status(200).json(jsonData("Success Change Password"))

        } catch (error) {
            console.log(error)
        }
    }
}

module.exports = LoginController