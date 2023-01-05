const { encrypt } = require("../../../helper/enkrip_id")
const { ObjectID } = require("bson")

function tax_magicmirror_public_detail(idDecrypt, rt_link) {
    let query = [
        {
            '$match': { '_id': ObjectID(idDecrypt) }
        },
        {
            '$lookup': {
                'from': 'users',
                'foreignField': '_id',
                'localField': '_u',
                'pipeline': [
                    {
                        '$addFields': {
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
                            'idUser': {
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
            '$addFields': {
                'full_name': { '$ifNull': [{ '$first': '$data_user.full_name' }, '-'] },
                'user_avatar': { '$ifNull': [{ '$first': '$data_user.user_avatar' }, '-'] },
                'user_id': { '$ifNull': [{ '$first': '$data_user.idUser' }, '-'] },
                'date': {
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
            '$project': {
                'full_name': '$full_name',
                'user_avatar': '$user_avatar',
                'invoice': '$inv',
                'payment': { '$ifNull': [{ '$first': '$mt.methods' }, '-'] },
                'date_bought': { '$concat': ['$date', ' ', '$time_bought'] },
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
                'price': '$prc',
                'fee': '$mon.fee',
                'ppn': '$mon.ppn',
                'dpp': '$mon.dpp',
                '_id': '$user_id'
            }
        },
    ]

    return query
}

module.exports = { tax_magicmirror_public_detail }