const { encrypt } = require("../../../helper/enkrip_id")
const { queryPagination } = require("../../../helper/pagination")
const { search_something } = require("../../../helper/search_regex")
const { ObjectID } = require("bson")

function user_sm_coupon(idDecrypt, search_name, page, item_limit, rt_link) {
    let query = queryPagination(
        [
            {
                '$match': {
                    '$and': [
                        { 'pym.sts': 'settlement' },
                        { 'shp.sts': 'settlement' },
                    ]
                }
            },
            {
                '$addFields': {
                    'data_coupon': {
                        '$first': {
                            '$filter': {
                                'input': {
                                    '$map': {
                                        'input': '$cpn',
                                        'in': {
                                            '$cond': {
                                                'if': { '$eq': ['$$this.typ', 'glo'] },
                                                'then': {
                                                    'id_coupon': '$$this._cp',
                                                    'id_user': '$$this._cu',
                                                    'amount': '$$this.amm'
                                                },
                                                'else': []
                                            }
                                        }
                                    }
                                },
                                'cond': {
                                    '$ne': ['$$this', []]
                                }
                            }
                        }
                    }
                }
            },
            {
                '$lookup': {
                    'from': 'users',
                    'foreignField': '_id',
                    'localField': '_u',
                    'pipeline': [
                        {
                            '$addFields': {
                                'fullName': {
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
                                'user_avatar': { '$concat': [`${rt_link}profile/self/avatar/`, '$dat.usr'] }

                            }
                        }
                    ],
                    'as': 'data_user'
                }
            },
            {
                '$match': { 'data_coupon.id_coupon': ObjectID(idDecrypt) }
            },
            {
                '$match': search_something('name', search_name)
            }
        ],
        [
            {
                '$project': {
                    'invoice': '$inv',
                    'date_bought': {
                        '$dateToString': {
                            'date': { '$toDate': { '$multiply': ['$ep', 1000] } },
                            'format': '%Y-%m-%d',
                            'onNull': '2020-01-01'
                        }
                    },
                    'fullName': { '$ifNull': [{ '$first': '$data_user.fullName' }, '-'] },
                    'user_avatar': { '$ifNull': [{ '$first': '$data_user.user_avatar' }, '-'] },
                    'shippment_payment': '$data_coupon.amount',
                    '_id': {
                        '$function': {
                            'body': encrypt,
                            'args': [{ '$toString': '$_id' }, 12],
                            'lang': 'js'
                        }
                    }
                }
            }
        ], page, 3, item_limit
    )

    return query
}

module.exports = { user_sm_coupon }