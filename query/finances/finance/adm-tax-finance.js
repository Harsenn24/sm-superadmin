
const { queryPagination } = require("../../../helper/pagination")
const { rt_link } = process.env
const { ObjectID } = require("bson")
const { mon_fee } = require("../../../helper/count")
const { search_something } = require("../../../helper/search_regex")

function admin_tax_finance(time, idDecrypt, query) {

    let filter = 0
    if (query.type === 'product') {
        filter = { 'shp.sts': 'settlement' }
    } else {
        filter = {}
    }
    return queryPagination(
        [
            {
                '$addFields': {
                    'date': {
                        '$dateToString': {
                            'date': { '$toDate': { '$multiply': ['$ep', 1000] } },
                            'format': '%m-%Y',
                            'onNull': '2020-01-01'
                        }
                    },
                    'full_date': {
                        '$dateToString': {
                            'date': { '$toDate': { '$multiply': ['$ep', 1000] } },
                            'format': '%Y-%m-%d',
                            'onNull': '2020-01-01'
                        }
                    },
                    'full_time': {
                        '$dateToString': {
                            'date': { '$toDate': { '$multiply': ['$ep', 1000] } },
                            'format': '%H:%M',
                            'onNull': '2020-01-01'
                        }
                    },
                }
            },
            {
                '$match': {
                    '$and': [
                        { '_s': ObjectID(idDecrypt) },
                        { 'pym.sts': 'settlement' },
                        filter,
                        { 'date': time }
                    ]
                }
            },
            {
                '$lookup': {
                    'from': 'users',
                    'localField': '_u',
                    'foreignField': '_id',
                    'as': 'us',
                    'pipeline': [
                        {
                            '$sort': { '_id': -1 }
                        },
                        {
                            '$addFields': {
                                'name': {
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
                                'user_img': { '$concat': [`${rt_link}profile/self/avatar/`, '$dat.usr'] },
                            }
                        }
                    ]
                }
            },
            {
                '$addFields': {
                    'buyerName': { '$ifNull': [{ '$first': '$us.name' }, { '$toInt': '0' }] },
                    'user_img': { '$ifNull': [{ '$first': '$us.user_img' }, { '$toInt': '0' }] },
                }
            },
            {
                '$lookup': {
                    'from': 'cfg_payment_list',
                    'localField': 'pym.chn',
                    'foreignField': 'code',
                    'as': 'bl',
                    'pipeline': [
                        {
                            '$sort': { '_id': -1 }
                        },
                        {
                            '$addFields': {
                                'methods': {
                                    '$concat': ['$bank', " ", '$title']
                                }
                            }
                        }
                    ]
                }
            },
            {
                '$addFields': {
                    'methods': { '$ifNull': [{ '$first': '$bl.methods' }, { '$toInt': '0' }] },
                    'total_order': '$mon.amm',
                    'admin_fee': mon_fee(),
                    'shippment': { '$subtract': ['$shp.det.amm', '$shp.det.bmm'] },
                }
            },
            {
                '$addFields': {
                    'total_sell': { '$subtract': ['$total_order', { '$add': ['$admin_fee', '$shippment'] }] },
                }
            },
            {
                '$match': search_something('buyerName', query.username)
            },
            {
                '$sort': { '_id': -1 }
            },
        ],
        [
            {
                '$project': {
                    'methods': '$methods',
                    'buyer_name': '$buyerName',
                    'user_avatar': '$user_img',
                    'order_number': '$inv',
                    'total_order': '$total_order',
                    'admin_fee': '$admin_fee',
                    'shippment': '$shippment',
                    'total_sell': '$total_sell',
                    '_id': 0,
                    'date_time': { '$concat': ['$full_date', ' ', '$full_time'] }
                }
            }
        ], query.page, 3, query.item_limit
    )
}

function get_month_year(query, idDecrypt) {

    let filter = 0
    if (query.type === 'product') {
        filter = { 'shp.sts': 'settlement' }
    } else {
        filter = {}
    }



    return queryPagination(
        [
            {
                '$match': {
                    '$and': [
                        { '_s': ObjectID(idDecrypt) },
                        { 'pym.sts': 'settlement' },
                        filter,
                    ]
                }
            },
            {
                '$project': {
                    'month_year': {
                        '$dateToString': {
                            'date': { '$toDate': { '$multiply': ['$ep', 1000] } },
                            'format': '%m-%Y',
                            'onNull': '2020-01'
                        }
                    },
                }
            },
            {
                '$group': {
                    '_id': '$month_year'
                }
            },
            {
                '$sort': { '_id': -1 }
            }
        ],
        [
            {
                '$project': {
                    'month_year': '$_id',
                    'label': 'month-year',
                    '_id': 0
                }
            }
        ], query.page, 3, query.item_limit
    )
}

function store_full_name(idDecrypt) {
    return (
        [
            {
                '$match': { '_id': ObjectID(idDecrypt) }
            },
            {
                '$project': {
                    'store': {
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
            }
        ]
    ) 
}


module.exports = { admin_tax_finance, get_month_year, store_full_name }