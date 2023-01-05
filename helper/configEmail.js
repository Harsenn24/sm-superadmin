const { configMongo } = require("../config/index")


const configTrasnport1 = {
    host: configMongo['email']['host'],
    port: configMongo['email']['port'],
    auth: {
        user: configMongo['email']['user'],
        pass: configMongo['email']['password']
    }
}

const configTrasnport2 = {
    service: 'gmail',
    auth: {
        user: configMongo['email2']['user'],
        pass: configMongo['email2']['password']
    }
}

module.exports = {
    configTrasnport1,
    configTrasnport2
}