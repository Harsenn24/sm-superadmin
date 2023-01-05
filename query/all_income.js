const { range_day_aggregate } = require("../helper/range_day")
const { percent_aggregate } = require("../helper/percent")

function gross_income_query(time_start, time_end, time_start_double, time_end_double) {
    return ([
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
                                            { 'pym.sts': 'settlement' }
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
                                            { 'pym.sts': 'settlement' }
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
                                            { 'shp.sts': 'settlement' }

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
                                            { 'shp.sts': 'settlement' }
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
                ]
            }
        },
        {
            '$limit': 1
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
                'net_income_now': { '$add': ['$doc_now', '$mm_now', '$vch_now', '$pay_now'] },
                'net_income_double': { '$add': ['$doc_double', '$mm_double', '$vch_double', '$pay_double'] },
            }
        },
        {
            '$addFields': {
                'net_income_percent': percent_aggregate('$net_income_now', '$net_income_double')
            }
        },
        {
            '$project': {
                'all_income': {
                    'income': '$net_income_now',
                    'percent': '$net_income_percent',
                },
                'diff_days': range_day_aggregate(time_start, time_end),
                '_id': 0
            }
        }
    ])
}


module.exports = { gross_income_query }