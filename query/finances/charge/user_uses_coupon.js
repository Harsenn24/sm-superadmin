const { queryPagination } = require("../../../helper/pagination")
const { search_something } = require("../../../helper/search_regex")


function user_uses_coupon(store_decrypt, coupon_decrypt,page, item_limit, search_name, rt_link ) {
    let query = queryPagination(
        [
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
                                                'if': { '$eq': ['$$this.typ', 'tlo'] },
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
                '$match': {
                    '$and': [
                        { '_s': ObjectID(store_decrypt) },
                        { 'data_coupon.id_coupon': ObjectID(coupon_decrypt) },
                    ]
                }
            },
            {
                '$lookup': {
                    'from': 'users',
                    'as': 'us',
                    'localField': '_u',
                    'foreignField': '_id',
                    'pipeline': [
                        {
                            '$project': {
                                'full_name': {
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
                    ]
                }
            },
            {
                '$addFields': {
                    'full_name': { '$ifNull': [{ '$first': '$us.full_name' }, '-'] },
                    'user_avatar': { '$ifNull': [{ '$first': '$us.user_avatar' }, '-'] },
                    'date': {
                        '$dateToString': {
                            'date': { '$toDate': { '$multiply': ['$ep', 1000] } },
                            'format': '%Y-%m-%d',
                            'onNull': '2020-01-01'
                        }
                    },
                    'time': {
                        '$dateToString': {
                            'date': { '$toDate': { '$multiply': ['$ep', 1000] } },
                            'format': '%H:%M',
                            'onNull': '2020-01-01'
                        }
                    }
                }
            },

            {
                '$sort': { '_id': -1 }
            },
            {
                '$match': search_something('full_name', search_name)
            }
        ],
        [
            {
                '$project': {
                    'full_name': '$full_name',
                    'user_avatar': '$user_avatar',
                    'shipping_amount': '$data_coupon.amount',
                    '_id': {
                        '$function': {
                            'body': encrypt,
                            'args': [{ '$toString': '$_id' }, 12],
                            'lang': 'js'
                        }
                    },
                    'date_bought': { '$concat': ['$date', ' ', '$time'] }

                }
            }

        ], page, 3, item_limit
    )

    return query
}

module.exports = { user_uses_coupon }