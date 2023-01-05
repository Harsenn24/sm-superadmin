const {decrypt} = require("../helper/enkrip_id")
const { ObjectID } = require("bson")

function data_record(id) {
    const query = [
        [
            {
                '$match': { '_id': ObjectID(id) }
            },
            {
                '$lookup': {
                    'from': 'users',
                    'as': 'user',
                    'localField': '_u',
                    'foreignField': '_id',
                    'pipeline': [
                        {
                            '$project': {
                                'email': {
                                    '$function': {
                                        'body': decrypt,
                                        'args': [{ '$toString': '$dat.eml.val' }, 8],
                                        'lang': 'js'
                                    }
                                },
                                'user_name' : {
                                    '$reduce': {
                                        'input': '$dat.fln',
                                        'initialValue': '',
                                        'in': {
                                            '$concat': [
                                                '$$value',
                                                { '$cond': [{ '$eq': ['$$value', ''] }, '', ' '] },
                                                '$$this'
                                            ]
                                        }
                                    }
                                },
                            }
                        },
                    ]
                }
            },
            {
                '$lookup': {
                    'from': 'stores',
                    'as': 'store',
                    'localField': '_s',
                    'foreignField': '_id',
                    'pipeline': [
                        {
                            '$project': {
                                'email': {
                                    '$function': {
                                        'body': decrypt,
                                        'args': [{ '$toString': '$ctc.eml' }, 8],
                                        'lang': 'js'
                                    }
                                },
                                'store_name' : {
                                    '$reduce': {
                                        'input': '$det.nme',
                                        'initialValue': '',
                                        'in': {
                                            '$concat': [
                                                '$$value',
                                                { '$cond': [{ '$eq': ['$$value', ''] }, '', ' '] },
                                                '$$this'
                                            ]
                                        }
                                    }
                                },
                            }
                        },
                    ]
                }
            },
            {
                '$project': {
                    'status': '$sts',
                    'client_email': { '$ifNull': [{ '$first': '$user.email' }, '-'] },
                    'client_name': { '$ifNull': [{ '$first': '$user.user_name' }, '-'] },

                    'store_email': { '$ifNull': [{ '$first': '$store.email' }, '-'] },
                    'store_name': { '$ifNull': [{ '$first': '$store.store_name' }, '-'] },

                    '_id': 0
                }
            }
        ]
    ]

    return query
}


module.exports = { data_record }