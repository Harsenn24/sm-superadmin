const { range_day_aggregate } = require("../helper/range_day")
const { percent_aggregate } = require("../helper/percent")

function cartNetIncome(time_start, time_end, time_start_double, time_end_double) {
    return ([
        {
            '$limit': 1
        },
        {
            '$facet': {
                'statistik': [
                    {
                        '$lookup': {
                            'from': 'sys_subscribe',
                            'as': 'magic_mirror',
                            'pipeline': [

                                {
                                    '$match': {
                                        '$and': [
                                            { 'ep': { '$lte': time_start } },
                                            { 'ep': { '$gte': time_end } },
                                            { 'pym.sts': 'settlement' }

                                        ]
                                    }
                                },
                                {
                                    '$project': {
                                        'date': { '$toDate': { '$multiply': ['$ep', 1000] } },
                                        'income': '$prc',
                                        '_id': 0
                                    }
                                }
                            ]
                        }
                    },
                    {
                        '$lookup': {
                            'from': 'sys_payment',
                            'as': 'payment',
                            'pipeline': [

                                {
                                    '$match': {
                                        '$and': [
                                            { 'ep': { '$lte': time_start } },
                                            { 'ep': { '$gte': time_end } },
                                            { 'pym.sts': 'settlement' },
                                            { 'shp.sts': 'settlement' }
                                        ]
                                    }
                                },
                                {
                                    '$project': {
                                        'date': { '$toDate': { '$multiply': ['$ep', 1000] } },
                                        'income': '$mon.fee',
                                        '_id': 0
                                    }
                                }
                            ]
                        }
                    },
                    {
                        '$lookup': {
                            'from': 'sys_vouchers',
                            'as': 'vouchers',
                            'pipeline': [

                                {
                                    '$match': {
                                        '$and': [
                                            { 'ep': { '$lte': time_start } },
                                            { 'ep': { '$gte': time_end } },
                                            { 'pym.sts': 'settlement' },
                                        ]
                                    }
                                },
                                {
                                    '$project': {
                                        'date': { '$toDate': { '$multiply': ['$ep', 1000] } },
                                        'income': '$mon.fee',
                                        '_id': 0
                                    }
                                }
                            ]
                        }
                    },
                    {
                        '$lookup': {
                            'from': 'sys_doctors',
                            'as': 'doctors',
                            'pipeline': [
                                {
                                    '$addFields': {
                                        'date_id': { '$toDecimal': { '$toDate': '$_id' } }
                                    }
                                },
                                {
                                    '$addFields': {
                                        'date_id': { '$round': [{ '$divide': ['$date_id', 1000] }, 4] },
                                    }
                                },
                                {
                                    '$match': {
                                        '$and': [
                                            { 'date_id': { '$lte': time_start } },
                                            { 'date_id': { '$gte': time_end } },
                                            { 'pym.sts': 'settlement' },

                                        ]
                                    }
                                },
                                {
                                    '$project': {
                                        'date': { '$toDate': { '$multiply': ['$date_id', 1000] } },
                                        'income': '$mon.fee',
                                        '_id': 0
                                    }
                                }
                            ]
                        }
                    },
                    {
                        '$project': {
                            'combined': { '$concatArrays': ['$magic_mirror', '$payment', '$vouchers', '$doctors'] },
                            '_id': 0
                        }
                    },
                    {
                        '$unwind': { 'path': '$combined' }
                    },
                    {
                        '$group': {
                            '_id': {
                                '$dateToString': {
                                    'date': '$combined.date',
                                    'format': '%Y-%m-%d',
                                    'onNull': '2020-01-01'
                                }
                            },
                            'income': { '$sum': '$combined.income' }
                        }
                    },
                    {
                        '$project': {
                            'x': '$_id',
                            'y': '$income',
                            '_id': 0
                        }
                    },
                    {
                        '$sort': { 'x': 1 }
                    }
                ],
            }
        },
        {
            '$lookup': {
                'from': 'sys_subscribe',
                'as': 'subs',
                'pipeline': [
                    {
                        '$facet': {
                            'labaNow': [
                                {
                                    '$match': {
                                        '$and': [
                                            { 'ep': { $lte: time_start } },
                                            { 'ep': { $gte: time_end } },
                                            { 'pym.sts': 'settlement' },

                                        ]
                                    }
                                },
                                {
                                    '$addFields': {
                                        'labaSatuan': '$prc'

                                    }
                                },
                                {
                                    '$project': {
                                        'laba': { '$sum': '$labaSatuan' },
                                        '_id': 0
                                    }
                                }
                            ],
                            'labaDouble': [
                                {
                                    '$match': {
                                        '$and': [
                                            { 'ep': { $lte: time_start_double } },
                                            { 'ep': { $gte: time_end_double } },
                                            { 'pym.sts': 'settlement' },

                                        ]
                                    }
                                },
                                {
                                    '$addFields': {
                                        'labaSatuan': '$prc'

                                    }
                                },
                                {
                                    '$project': {
                                        'laba': { '$sum': '$labaSatuan' },
                                        '_id': 0
                                    }
                                }
                            ]
                        }
                    },
                    {
                        '$addFields': {
                            'mm_now': { '$ifNull': [{ '$sum': '$labaNow.laba' }, { '$toInt': '0' }] },
                            'mm_double': { '$ifNull': [{ '$sum': '$labaDouble.laba' }, { '$toInt': '0' }] },
                        }
                    },
                    {
                        '$addFields': {
                            'mm_percent': percent_aggregate('$mm_now', '$mm_double')
                        }
                    }

                ]
            }
        },
        {
            '$lookup': {
                'from': 'sys_payment',
                'as': 'pay',
                'pipeline': [
                    {
                        '$facet': {
                            'pay_now': [
                                {
                                    '$match': {
                                        '$and': [
                                            { 'ep': { $lte: time_start } },
                                            { 'ep': { $gte: time_end } },
                                            { 'pym.sts': 'settlement' },
                                            { 'shp.sts': 'settlement' },

                                        ]
                                    }
                                },
                                {
                                    '$addFields': {
                                        'labaSatuan': '$mon.fee'
                                    }
                                },
                                {
                                    '$project': {
                                        'laba': { '$sum': '$labaSatuan' },
                                        '_id': 0

                                    }
                                }
                            ],
                            'pay_double': [
                                {
                                    '$match': {
                                        '$and': [
                                            { 'ep': { $lte: time_start_double } },
                                            { 'ep': { $gte: time_end_double } },
                                            { 'pym.sts': 'settlement' },
                                            { 'shp.sts': 'settlement' },

                                        ]
                                    }
                                },
                                {
                                    '$addFields': {
                                        'labaSatuan': '$mon.fee'

                                    }
                                },
                                {
                                    '$project': {
                                        'laba': { '$sum': '$labaSatuan' },
                                        '_id': 0

                                    }
                                }
                            ]
                        }
                    },
                    {
                        '$addFields': {
                            'pay_now': { '$ifNull': [{ '$sum': '$pay_now.laba' }, { '$toInt': '0' }] },
                            'pay_double': { '$ifNull': [{ '$sum': '$pay_double.laba' }, { '$toInt': '0' }] },
                        }
                    },
                    {
                        '$addFields': {
                            'pay_percent': percent_aggregate('$pay_now', '$pay_double')
                        }
                    }
                ]
            }
        },
        {
            '$lookup': {
                'from': 'sys_vouchers',
                'as': 'vch',
                'pipeline': [
                    {
                        '$facet': {
                            'vch_now': [
                                {
                                    '$match': {
                                        '$and': [
                                            { 'ep': { $lte: time_start } },
                                            { 'ep': { $gte: time_end } },
                                            { 'pym.sts': 'settlement' },

                                        ]
                                    }
                                },
                                {
                                    '$addFields': {
                                        'labaSatuan': '$mon.fee'
                                    }
                                },
                                {
                                    '$project': {
                                        'laba': { '$sum': '$labaSatuan' },
                                        '_id': 0

                                    }
                                }
                            ],
                            'vch_double': [
                                {
                                    '$match': {
                                        '$and': [
                                            { 'ep': { $lte: time_start_double } },
                                            { 'ep': { $gte: time_end_double } },
                                            { 'pym.sts': 'settlement' },

                                        ]
                                    }
                                },
                                {
                                    '$addFields': {
                                        'labaSatuan': '$mon.fee'

                                    }
                                },
                                {
                                    '$project': {
                                        'laba': { '$sum': '$labaSatuan' },
                                        '_id': 0

                                    }
                                }
                            ]
                        }
                    },
                    {
                        '$addFields': {
                            'vch_now': { '$ifNull': [{ '$sum': '$vch_now.laba' }, { '$toInt': '0' }] },
                            'vch_double': { '$ifNull': [{ '$sum': '$vch_double.laba' }, { '$toInt': '0' }] },
                        }
                    },
                    {
                        '$addFields': {
                            'vch_percent': percent_aggregate('$vch_now', '$vch_double')
                        }
                    }
                ]
            }
        },
        {
            '$lookup': {
                'from': 'sys_doctors',
                'as': 'dc',
                'pipeline': [
                    {
                        '$addFields': {
                            'date_id': { '$toDecimal': { '$toDate': '$_id' } }
                        }
                    },
                    {
                        '$addFields': {
                            'date_id': { '$round': [{ '$divide': ['$date_id', 1000] }, 4] },
                        }
                    },
                    {
                        '$facet': {
                            'doc_now': [
                                {
                                    '$match': {
                                        '$and': [
                                            { 'date_id': { $lte: time_start } },
                                            { 'date_id': { $gte: time_end } },
                                            { 'pym.sts': 'settlement' },
                                        ]
                                    }
                                },
                                {
                                    '$addFields': {
                                        'labaSatuan': '$mon.fee'
                                    }
                                },
                                {
                                    '$project': {
                                        'laba': { '$sum': '$labaSatuan' },
                                        '_id': 0

                                    }
                                }
                            ],
                            'doc_double': [
                                {
                                    '$match': {
                                        '$and': [
                                            { 'date_id': { $lte: time_start_double } },
                                            { 'date_id': { $gte: time_end_double } },
                                            { 'pym.sts': 'settlement' },
                                        ]
                                    }
                                },
                                {
                                    '$addFields': {
                                        'labaSatuan': '$mon.fee'
                                    }
                                },
                                {
                                    '$project': {
                                        'laba': { '$sum': '$labaSatuan' },
                                        '_id': 0
                                    }
                                }
                            ]
                        }
                    },
                    {
                        '$addFields': {
                            'doc_now': { '$ifNull': [{ '$sum': '$doc_now.laba' }, { '$toInt': '0' }] },
                            'doc_double': { '$ifNull': [{ '$sum': '$doc_double.laba' }, { '$toInt': '0' }] },
                        }
                    },
                    {
                        '$addFields': {
                            'doc_percent': percent_aggregate('$doc_now', '$doc_double')
                        }
                    },

                ]
            }
        },
        {
            '$addFields': {
                'doc_now': { '$first': '$dc.doc_now' },
                'doc_double': { '$first': '$dc.doc_double' },
                'mm_now': { '$first': '$subs.mm_now' },
                'mm_double': { '$first': '$subs.mm_double' },
                'vch_now': { '$first': '$vch.vch_now' },
                'vch_double': { '$first': '$vch.vch_double' },
                'pay_now': { '$first': '$pay.pay_now' },
                'pay_double': { '$first': '$pay.pay_double' },
            }
        },
        {
            '$addFields': {
                'incomeNow': { '$add': ['$mm_now', '$vch_now', '$pay_now', '$doc_now'] },
                'incomeDouble': { '$add': ['$mm_double', '$vch_double', '$pay_double', '$doc_double'] },
            }
        },
        {
            '$addFields': {
                'percent': percent_aggregate('$incomeNow', '$incomeDouble')
            }
        },
        {
            '$project': {
                'income': '$incomeNow',
                'percent': '$percent',
                '_id': 0,
                'diff_days': range_day_aggregate(time_start, time_end),
                'statistic': '$statistik',
            }
        }
    ])
}


module.exports = { cartNetIncome }