const { encrypt } = require("../../../helper/enkrip_id")
const { ObjectID } = require("bson")

function tax_admin_product_detail(store_id, payment_id, rt_link) {
    let query = [
        {
            '$match': {
                '$and': [
                    { '_s': ObjectID(store_id) },
                    { 'pym.sts': 'settlement' },
                    { 'shp.sts': 'settlement' },
                    { '_id': ObjectID(payment_id) },
                ]
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
                            'user_avatar': { '$concat': [`${rt_link}profile/self/avatar/`, '$dat.usr'] },
                            'user_id': {
                                '$function': {
                                    'body': encrypt,
                                    'args': [{ '$toString': '$_id' }, 12],
                                    'lang': 'js'
                                }
                            },
                        }
                    }
                ],
                'as': 'data_user'
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
                'date_bought': {
                    '$dateToString': {
                        'date': { '$toDate': { '$multiply': ['$ep', 1000] } },
                        'format': '%Y-%m-%d',
                        'onNull': '2020-01-01'
                    }
                },
                'time_bought': {
                    '$dateToString': {
                        'date': { '$toDate': { '$multiply': ['$ep', 1000] } },
                        'format': '%H:%M',
                        'onNull': '2020-01-01'
                    }
                },
            }
        },
        {
            '$project': {
                'fullName': { '$ifNull': [{ '$first': '$data_user.fullName' }, '-'] },
                'user_avatar': { '$ifNull': [{ '$first': '$data_user.user_avatar' }, '-'] },
                'id_user': { '$ifNull': [{ '$first': '$data_user.user_id' }, '-'] },
                'invoice': '$inv',
                'payment': {
                    'id_order': payment_id,
                    'payment_method': { '$ifNull': [{ '$first': '$bl.methods' }, '-'] },
                    'date_bought': { '$concat': ['$date_bought', ' ', '$time_bought'] },
                    'type': 'Produk'
                },
                'tax': {
                    'total_order': '$mon.amm',
                    'admin_fee': '$mon.fee',
                    'dpp': '$mon.dpp',
                    'total_tax': { '$add': ['$mon.ppn', '$mon.pph'] },
                    'ppn': '$mon.ppn',
                    'pph': '$mon.pph'
                },
                '_id': 0
            }
        }
    ]

    return query
}

module.exports = { tax_admin_product_detail }