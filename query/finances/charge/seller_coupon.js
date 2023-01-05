const { encrypt } = require("../../../helper/enkrip_id")
const { queryPagination } = require("../../../helper/pagination")
const { search_something } = require("../../../helper/search_regex")
const { status_coupon_v2 } = require("../../../helper/sts_coupon")
const { ObjectID } = require("bson")

function seller_coupon(idDecrypt, page, item_limit, search_name) {
    let query = queryPagination(
        [
            {
                '$match': { '_s': ObjectID(idDecrypt) }
            },

            {
                '$lookup': {
                    'from': 'sys_payment',
                    'foreignField': 'cpn._cp',
                    'localField': '_id',
                    'as': 'payment_data',
                    'pipeline': [
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
                                    { 'data_coupon.amount': { '$gt': 0 } },
                                ]
                            }
                        },
                        {
                            '$project': {
                                'data': '$data_coupon'
                            }
                        },

                    ]
                }
            },
            {
                '$addFields': {
                    'used_time': { '$size': '$payment_data' },
                    'shipping_amount': { '$sum': '$payment_data.data.amount' }
                }
            },
            {
                '$sort': { 'shipping_amount': -1 }
            },
            {
                '$match': search_something('nms', search_name)
            }
        ],
        [
            {
                '$project': {
                    'coupon_name': '$nms',
                    'status': status_coupon_v2(),
                    'used_time': '$used_time',
                    'shipping_amount': '$shipping_amount',
                    '_id': {
                        '$function': {
                            'body': encrypt,
                            'args': [{ '$toString': '$_id' }, 12],
                            'lang': 'js'
                        }
                    },

                }
            }

        ], page, 3, item_limit
    )

    return query
}

module.exports = { seller_coupon }