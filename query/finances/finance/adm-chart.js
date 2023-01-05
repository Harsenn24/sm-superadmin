const { mon_fen } = require("../../../helper/count")

function admin_chart(time_start, time_end) {
    const query = [
        {
            '$limit': 1
        },
        {
            '$lookup': {
                'from': 'sys_payment',
                'as': 'pay',
                'pipeline': [
                    {
                        '$sort': { 'id': -1 }
                    },
                    {
                        '$facet': {
                            'data_a': [
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
                                        'date': {
                                            '$dateToString': {
                                                'date': { '$toDate': { '$multiply': ['$ep', 1000] } },
                                                'format': '%Y-%m-%d',
                                                'onNull': '2020-01-01'
                                            }
                                        },
                                        'total_prc': { '$sum': mon_fen() }
                                    }
                                },
                                {
                                    '$project': {
                                        'total': { '$ifNull': ['$total_prc', { '$toInt': '0' }] },
                                        'date': { '$ifNull': ['$date', '-'] },
                                        '_id': 0
                                    }
                                },

                            ],
                        }
                    },
                    {
                        '$project': {
                            'admin_payment': '$data_a',
                            '_id': 0
                        }
                    },
                ]
            }
        },
        {
            '$lookup': {
                'from': 'sys_vouchers',
                'as': 'vch',
                'pipeline': [
                    {
                        '$sort': { 'id': -1 }
                    },
                    {
                        '$facet': {
                            'vch_now': [
                                {
                                    '$match': {
                                        '$and': [
                                            { 'pym.sts': 'settlement' },
                                            { 'ep': { $lte: time_start } },
                                            { 'ep': { $gte: time_end } }
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
                                        'total_prc': { '$sum': mon_fen() }

                                    }
                                },
                                {
                                    '$project': {
                                        'total': { '$ifNull': ['$total_prc', { '$toInt': '0' }] },
                                        'date': { '$ifNull': ['$date', '-'] },
                                        '_id': 0
                                    }
                                },

                            ],
                        }
                    },
                    {
                        '$project': {
                            'voucher': '$vch_now',
                            '_id': 0
                        }
                    },
                ]
            }
        },
        {
            '$facet': {
                'statistic': [
                    {
                        '$addFields': {
                            'data_payment': { '$first': '$pay.admin_payment' },
                            'data_voucher': { '$first': '$vch.voucher' },
                            '_id': 0
                        }
                    },
                    {
                        '$addFields': {
                            'data': { '$concatArrays': ['$data_payment', '$data_voucher'] },
                        }
                    },
                    {
                        '$project': {
                            '_id': 0,
                            'data': '$data'
                        }
                    },
                    {
                        '$unwind': {
                            'path': '$data'
                        }
                    },
                    {
                        '$group': {
                            '_id': '$data.date',
                            'total': { '$sum': '$data.total' }
                        }
                    },
                    {
                        '$project': {
                            'x': '$_id',
                            'y': '$total',
                            '_id': 0,
                            'label': 'Admin Fee'
                        }
                    },
                    {
                        '$sort': { 'x': 1 }
                    },
                ],
                'total': [
                    {
                        '$addFields': {
                            'data_payment': { '$first': '$pay.admin_payment' },
                            'data_voucher': { '$first': '$vch.voucher' },
                            '_id': 0
                        }
                    },
                    {
                        '$addFields': {
                            'data': { '$concatArrays': ['$data_payment', '$data_voucher'] },
                        }
                    },
                    {
                        '$project': {
                            'total': { '$sum': '$data.total' }
                        }
                    }
                ]
            }
        },
        {
            '$project': {
                'income': { '$ifNull': [{ '$first': '$total.total' }, { '$toInt': '0' }] },
                'statistic': '$statistic'
            }
        }
    ]

    return query
}

module.exports = admin_chart