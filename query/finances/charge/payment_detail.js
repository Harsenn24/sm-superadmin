const { ObjectID } = require("bson")

function payment_detail(store_decrypt, coupon_decrypt, payment_decrypt, rt_link) {
    let query = [
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
                    { '_id': ObjectID(payment_decrypt) }
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
                        'date': { '$toDate': { '$multiply': ['$shp.tme.shp', 1000] } },
                        'format': '%Y-%m-%d',
                        'onNull': '2020-01-01'
                    }
                },
                'time': {
                    '$dateToString': {
                        'date': { '$toDate': { '$multiply': ['$shp.tme.shp', 1000] } },
                        'format': '%H:%M',
                        'onNull': '2020-01-01'
                    }
                }
            }
        },
        {
            '$project': {
                'full_name': '$full_name',
                'user_avatar': '$user_avatar',
                'invoice': '$inv',
                'shipping_time': { '$concat': ['$date', ' ', '$time'] },
                'shipping_service': '$shp.chn',
                'product_weight': { '$concat': [{ '$toString': { '$sum': '$dat.dim.wh' } }, ' Gr'] },
                'shipping_cost': '$shp.det.bmm',
                'insurance_fee': '$shp.det.inf',
                'seller_shipping_cost': '$data_coupon.amount',
                'address': {
                    'origin': { '$concat': ['$shp.org.nme', ', ', '$shp.org.des', ', ', '$shp.org.zip'] },
                    'destination': { '$concat': ['$shp.des.nme', ', ', '$shp.des.des', ', ', '$shp.des.zip'] },
                },
                _id: 0
            }
        }
    ]

    return query
}

module.exports = { payment_detail }