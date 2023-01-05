const { encrypt } = require("../../../helper/enkrip_id")
const { queryPagination } = require("../../../helper/pagination")
const { search_something } = require("../../../helper/search_regex")
const { ObjectID } = require("bson")


function skin_mystery_table(time_start, time_end, page, item_limit, search_coupon) {
    let query = queryPagination(
        [
            {
                '$match': { '_s': ObjectID('620dc39c8a674596c599c11c') }
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
                                    { 'ep': { '$lte': time_start } },
                                    { 'ep': { '$gte': time_end } },
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
                            '$project': {
                                'data': '$data_coupon'
                            }
                        },
                    ]
                }
            },
            {
                '$addFields': {
                    'amount': { '$ifNull': [{ '$sum': '$payment_data.data.amount' }, { '$toInt': '0' }] },
                    'used': { '$size': '$payment_data' }
                }
            },
            {
                '$match': search_something('nms', search_coupon)
            },
            {
                '$sort': { 'amount': -1 }
            }
        ],
        [
            {
                '$project': {
                    'name': '$nms',
                    'status': {
                        '$cond': {
                            'if': { '$eq': ['$act', true] },
                            'then': 'Active',
                            'else': 'Inactive'
                        }
                    },
                    'amount': '$amount',
                    'used': '$used',
                    'date': {
                        '$dateToString': {
                            'date': { '$toDate': { '$multiply': ['$eps', 1000] } },
                            'format': '%Y-%m-%d',
                            'onNull': '2020-01-01'
                        }
                    },
                    'voucher_id': {
                        '$function': {
                            'body': encrypt,
                            'args': [{ '$toString': '$_id' }, 12],
                            'lang': 'js'
                        }
                    },
                    '_id': 0
                }
            }
        ], page, 3, item_limit
    )

    return query
}

module.exports = { skin_mystery_table }