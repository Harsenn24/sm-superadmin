const { ObjectID } = require("bson")

function seller_income_payment(store_decrypt, payment_decrypt, month_year, rt_link, payment_id) {
    let query = [
        {
            $match: {
                $and: [
                    { 'src': 'member-online' },
                    { 'pym.sts': 'settlement' },
                    { 'cld._s': ObjectID(store_decrypt) }
                ]
            }
        },
        {
            $addFields: {
                'date': {
                    '$dateToString': {
                        'date': { '$toDate': { '$multiply': ['$ep', 1000] } },
                        'format': '%m-%Y',
                        'onNull': '2020-01-01'
                    }
                },
            }
        },
        {
            $match: {
                $and: [
                    { 'date': month_year },
                    { '_id': ObjectID(payment_decrypt) }
                ]
            }
        },
        {
            '$lookup': {
                'from': 'users',
                'as': 'user_data',
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
                'day': {
                    '$dateToString': {
                        'date': { '$toDate': { '$multiply': ['$ep', 1000] } },
                        'format': '%Y-%m-%d',
                        'onNull': '2020-01-01'
                    }
                },
                'hour': {
                    '$dateToString': {
                        'date': { '$toDate': { '$multiply': ['$ep', 1000] } },
                        'format': '%H:%M',
                        'onNull': '00:00'
                    }
                },
                'day_start': {
                    '$dateToString': {
                        'date': { '$toDate': { '$multiply': ['$eps', 1000] } },
                        'format': '%Y-%m-%d',
                        'onNull': '2020-01-01'
                    }
                },
                'day_end': {
                    '$dateToString': {
                        'date': { '$toDate': { '$multiply': ['$epe', 1000] } },
                        'format': '%Y-%m-%d',
                        'onNull': '2020-01-01'
                    }
                },

            }
        },
        {
            '$project': {
                'full_name': { '$ifNull': [{ '$first': '$user_data.full_name' }, '-'] },
                'user_avatar': { '$ifNull': [{ '$first': '$user_data.user_avatar' }, '-'] },
                'order_time': { '$concat': ['$day', ' ', '$hour'] },
                'payment_method': { '$ifNull': [{ '$first': '$bl.methods' }, '-'] },
                'id_order': payment_id,
                'package_type': {
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
                'duration': { '$concat': ['$day_start', ' - ', '$day_end'] },
                'unitprice_subtotal_totalorder_totalpayment': '$prc',
                'commission': '$mon.clm',
                'fee': '$mon.fee',
                'ppn': '$mon.ppn',
                'total_sale': '$prn',
                'invoice': '$inv',
                '_id': 0
            }
        }
    ]

    return query
}

module.exports = { seller_income_payment }