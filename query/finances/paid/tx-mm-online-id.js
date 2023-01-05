const { encrypt } = require("../../../helper/enkrip_id")
const { ObjectID } = require("bson")

function tax_magicmirror_online_id(subs_decrypt, rt_link, source) {


    let query = [
        {
            '$match': { '_id': ObjectID(subs_decrypt) }
        },
        {
            '$lookup': {
                'from': 'cfg_payment_list',
                'foreignField': 'code',
                'localField': 'pym.chn',
                'as': 'mt',
                'pipeline': [
                    {
                        '$project': {
                            'methods': { '$concat': ['$title', ' ', '$bank'] }
                        }
                    }
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
                            'user_avatar': { '$concat': [`${rt_link}profile/self/avatar/`, '$dat.usr'] },
                            '_id': {
                                '$function': {
                                    'body': encrypt,
                                    'args': [{ '$toString': '$_id' }, 12],
                                    'lang': 'js'
                                }
                            }
                        }
                    }
                ]
            }
        },
        {
            '$addFields': {
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
                },
            }
        },
        {
            '$project': {
                'user_data': {
                    'full_name': { '$ifNull': [{ '$first': '$us.full_name' }, '-'] },
                    'avatar': { '$ifNull': [{ '$first': '$us.user_avatar' }, '-'] },
                    '_id': { '$ifNull': [{ '$first': '$us._id' }, '-'] },
                },
                'payment': {
                    'invoice': '$inv',
                    'payment_method': { '$ifNull': [{ '$first': '$mt.methods' }, '-'] },
                    'date_bought': { '$concat': ['$date', ' ', '$time'] },
                    'type': {
                        '$cond': {
                            'if': { '$eq': ['$typ', 'daily'] },
                            'then': 'Cermin Ajaib 1 Hari',
                            'else': {
                                '$cond': {
                                    'if': { '$eq': ['$typ', 'monthly'] },
                                    'then': 'Cermin Ajaib 1 Bulan',
                                    'else': {
                                        '$cond': {
                                            'if': { '$eq': ['$typ', 'yearly'] },
                                            'then': 'Cermin Ajaib 1 Tahun',
                                            'else': '-'
                                        }
                                    }
                                }
                            }
                        }
                    },
                },
                'tax': {
                    'total_payment': '$prc',
                    'ppn': '$mon.ppn',
                    'fee': '$mon.clm',
                    'dpp': '$mon.dpp'
                },
                '_id': 0
            }
        }
    ]

    return query
}

module.exports = { tax_magicmirror_online_id }