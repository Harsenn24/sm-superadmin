let express = require("express")
let errorEP = express.Router()

errorEP.get("*", async (req, res, next) => {
    try {
        throw { message: 'Invalid Method' }
    } catch (error) {
        next(error)
    }
})

errorEP.post("*", async (req, res, next) => {
    try {
        throw { message: 'Invalid Method' }
    } catch (error) {
        next(error)
    }
})

errorEP.delete("*", async (req, res, next) => {
    try {
        throw { message: 'Invalid Method' }
    } catch (error) {
        next(error)
    }
})

errorEP.put("*", async (req, res, next) => {
    try {
        throw { message: 'Invalid Method' }
    } catch (error) {
        next(error)
    }
})

errorEP.patch("*", async (req, res, next) => {
    try {
        throw { message: 'Invalid Method' }
    } catch (error) {
        next(error)
    }
})

module.exports = { errorEP }