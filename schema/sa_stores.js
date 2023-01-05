
const { ObjectID } = require("bson")

const sa_store = {
    _s: {type: ObjectID},
    ep: { type: Number },
    epd: { type: Number },
    tkn: { type: String },
    use: { type: Boolean }
}

module.exports = sa_store