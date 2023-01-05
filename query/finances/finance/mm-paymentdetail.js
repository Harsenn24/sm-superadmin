const { ObjectID } = require("bson")
const { encrypt } = require("../../../helper/enkrip_id")
const rt_link = process.env.rt_link


function mm_payment(subs_decrypt, subs_id) {


    const query = [
        {
            '$match': { '_id': ObjectID(subs_decrypt) },
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
            '$lookup': {
                'from': 'stores',
                'localField': 'cld._s',
                'foreignField': '_id',
                'as': 'st',
                'pipeline': [
                    {
                        '$project': {
                            'store_name': {
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
                            'store_id': {
                                '$function': {
                                    'body': encrypt,
                                    'args': [{ '$toString': '$_id' }, 12],
                                    'lang': 'js'
                                }
                            },
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
                'store_name': { '$ifNull': [{ '$first': '$st.store_name' }, '-'] },
                'store_id': { '$ifNull': [{ '$first': '$st.store_id' }, '-'] },
                'date_bought': { '$concat': ['$date_bought', ' ', '$time_bought'] },
                'start_periode': {
                    '$dateToString': {
                        'date': { '$toDate': { '$multiply': ['$eps', 1000] } },
                        'format': '%Y-%m-%d',
                        'onNull': '2020-01-01'
                    }
                },
                'end_periode': {
                    '$dateToString': {
                        'date': { '$toDate': { '$multiply': ['$epe', 1000] } },
                        'format': '%Y-%m-%d',
                        'onNull': '2020-01-01'
                    }
                },
                'payment_method': { '$ifNull': [{ '$first': '$bl.methods' }, '-'] },
                'id_order': subs_id,
                'product': 'Cermin Ajaib',
                'total': { '$toInt': '1' },
                'type': {
                    '$cond': {
                        'if': { '$eq': ['$typ', 'daily'] },
                        'then': '1 Hari',
                        'else': {
                            '$cond': {
                                'if': { '$eq': ['$typ', 'monthly'] },
                                'then': '1 Bulan',
                                'else': {
                                    '$cond': {
                                        'if': { '$eq': ['$typ', 'yearly'] },
                                        'then': '1 Tahun',
                                        'else': '-'
                                    }
                                }
                            }
                        }
                    }
                },
                'unit_price': '$prc',
                'sub_total': { '$multiply': ['$prc', { '$toInt': 1 }] },
                'income_detail': {
                    'price': '$prc',
                    'fee': '$mon.fee',
                    'total': '$prb'
                },
                'payment_detail': {
                    'price': '$prc',
                    'fee': { '$toInt': '0' },
                    'total': { '$subtract': ['$prc', { '$toInt': '0' }] }
                },
                '_id': 0,
            }
        },
    ]

    return query
}

module.exports = mm_payment