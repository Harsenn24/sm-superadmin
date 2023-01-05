const { ObjectID } = require("bson")
const { decryptId } = require("../helper/enkrip_id")
const { User, Store } = require("../model")
const { npwp_doc, siup_doc, cbto_doc } = process.env
const path = require('path');
const global_path = path.resolve()



class DocumentController {
    static async npwp(req, res, next) {
        try {
            const { store_id } = req.query

            const idDecrypt = decryptId(store_id, 12)

            const findTime = await Store.aggregate(
                [
                    {
                        '$match': { '_id': ObjectID(idDecrypt) }
                    },
                    {
                        '$project': {
                            'date': {
                                '$dateToString': {
                                    'date': { '$toDate': { '$multiply': ['$ep', 1000] } },
                                    'format': '%Y/%m/%d',
                                    'onNull': '2020-01-01'
                                }
                            },
                        }
                    }
                ]
            )


            const dateId = findTime[0].date

            res.sendFile(`${idDecrypt}.jpg`, { root: `${npwp_doc}/${dateId}` })

        } catch (error) {
            console.log(error)
            next(error)
        }
    }

    static async siup(req, res, next) {
        try {
            const { store_id } = req.query

            const idDecrypt = (decryptId(store_id, 12))

            const findTime = await Store.aggregate(
                [
                    {
                        '$match': { '_id': ObjectID(idDecrypt) }
                    },
                    {
                        '$project': {
                            'date': {
                                '$dateToString': {
                                    'date': { '$toDate': { '$multiply': ['$ep', 1000] } },
                                    'format': '%Y/%m/%d',
                                    'onNull': '2020-01-01'
                                }
                            },
                        }
                    }
                ]
            )

            const dateId = findTime[0].date

            res.sendFile(`${idDecrypt}.jpg`, { root: `${siup_doc}/${dateId}` })

        } catch (error) {
            console.log(error)
            next(error)
        }
    }

    static async cbto(req, res, next) {
        try {
            const { store_id } = req.query

            const idDecrypt = (decryptId(store_id, 12))

            const findTime = await Store.aggregate(
                [
                    {
                        '$match': { '_id': ObjectID(idDecrypt) }
                    },
                    {
                        '$project': {
                            'date': {
                                '$dateToString': {
                                    'date': { '$toDate': { '$multiply': ['$ep', 1000] } },
                                    'format': '%Y/%m/%d',
                                    'onNull': '2020-01-01'
                                }
                            },
                        }
                    }
                ]
            )

            if (findTime.length === 0) { res.sendFile(`default.jpg`, { root: `/sm-app/placeholder` }) }


            const dateId = findTime[0].date

            res.sendFile(`${idDecrypt}.jpg`, { root: `${cbto_doc}/${dateId}` });

        } catch (error) {
            console.log(error)
            next(error)
        }
    }

    static async testing_pict(req, res, next) {
        try {
            res.sendFile(`harsenn.jpg`, { root: `${global_path}/images/gambar` })
        } catch (error) {
            console.log(error);
        }
    }
}

module.exports = DocumentController