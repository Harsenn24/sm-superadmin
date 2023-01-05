const { percent_aggregate } = require("../../../helper/percent")
const { mon_fee, mon_fen } = require("../../../helper/count")

function gross_income_finance(time_start, time_end, time_end_double, time_start_double) {

    return (
        [
            {
                '$lookup': {
                    'from': 'sys_subscribe',
                    'as': 'subs',
                    'pipeline': [
                        {
                            '$facet': {
                                'now': [
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
                                            'net': '$prn',
                                            'bruto': '$prb',
                                        }
                                    },
                                    {
                                        '$project': {
                                            'laba': { '$sum': '$net' },
                                            'kotor': { '$sum': '$bruto' },
                                            '_id': 0
                                        }
                                    }
                                ],
                                'double': [
                                    {
                                        '$match': {
                                            '$and': [
                                                { 'ep': { '$lte': time_start_double } },
                                                { 'ep': { $gte: time_end_double } },
                                                { 'pym.sts': 'settlement' }
                                            ]
                                        }
                                    },
                                    {
                                        '$addFields': {
                                            'net': '$prn',
                                            'bruto': '$prb',
                                        }
                                    },
                                    {
                                        '$project': {
                                            'laba': { '$sum': '$net' },
                                            'kotor': { '$sum': '$bruto' },
                                            '_id': 0
                                        }
                                    }
                                ]
                            }
                        },
                        {
                            '$addFields': {
                                'net_now': { '$ifNull': [{ '$sum': '$now.laba' }, { '$toInt': '0' }] },
                                'net_double': { '$ifNull': [{ '$sum': '$double.laba' }, { '$toInt': '0' }] },
                                'bruto_now': { '$ifNull': [{ '$sum': '$now.kotor' }, { '$toInt': '0' }] },
                                'bruto_double': { '$ifNull': [{ '$sum': '$double.kotor' }, { '$toInt': '0' }] },
                            }
                        },
                        {
                            '$addFields': {
                                'percent_net': percent_aggregate('$net_now', '$net_double'),
                                'percent_bruto': percent_aggregate('$bruto_now', '$bruto_double')
                            }
                        },
                        {
                            '$project': {
                                'net': {
                                    'percent': '$percent_net',
                                    'income_now': '$net_now',
                                    'income_double': '$net_double',

                                },
                                'bruto': {
                                    'percent': '$percent_bruto',
                                    'income_now': '$bruto_now',
                                    'income_double': '$bruto_double',
                                }
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
                            '$sort': { 'id': -1 }
                        },
                        {
                            '$facet': {
                                'now': [
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
                                            'bruto': mon_fee(),
                                            'net': mon_fen(),
                                        }
                                    },
                                    {
                                        '$project': {
                                            'laba': { '$sum': '$net' },
                                            'kotor': { '$sum': '$bruto' },
                                            '_id': 0
                                        }
                                    }
                                ],
                                'double': [
                                    {
                                        '$match': {
                                            '$and': [
                                                { 'ep': { '$lte': time_start_double } },
                                                { 'ep': { '$gte': time_end_double } },
                                                { 'pym.sts': 'settlement' },
                                                { 'shp.sts': 'settlement' },
                                            ]
                                        }
                                    },
                                    {
                                        '$addFields': {
                                            'bruto': mon_fee(),
                                            'net': mon_fen(),
                                        }
                                    },
                                    {
                                        '$project': {
                                            'laba': { '$sum': '$net' },
                                            'kotor': { '$sum': '$bruto' },
                                            '_id': 0
                                        }
                                    }
                                ]
                            }
                        },
                        {
                            '$addFields': {
                                'net_now': { '$ifNull': [{ '$sum': '$now.laba' }, { '$toInt': '0' }] },
                                'net_double': { '$ifNull': [{ '$sum': '$double.laba' }, { '$toInt': '0' }] },
                                'bruto_now': { '$ifNull': [{ '$sum': '$now.kotor' }, { '$toInt': '0' }] },
                                'bruto_double': { '$ifNull': [{ '$sum': '$double.kotor' }, { '$toInt': '0' }] },
                            }
                        },
                        {
                            '$addFields': {
                                'percent_net': percent_aggregate('$net_now', '$net_double'),
                                'percent_bruto': percent_aggregate('$bruto_now', '$bruto_double')
                            }
                        },
                        {
                            '$project': {
                                'net': {
                                    'percent': '$percent_net',
                                    'income_now': '$net_now',
                                    'income_double': '$net_double',

                                },
                                'bruto': {
                                    'percent': '$percent_bruto',
                                    'income_now': '$bruto_now',
                                    'income_double': '$bruto_double',
                                }
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
                                'now': [
                                    {
                                        '$match': {
                                            '$and': [
                                                { 'ep': { '$lte': time_start } },
                                                { 'ep': { $gte: time_end } },
                                                { 'pym.sts': 'settlement' },

                                            ]
                                        }
                                    },
                                    {
                                        '$addFields': {
                                            'bruto': mon_fee(),
                                            'net': mon_fen(),
                                        }
                                    },
                                    {
                                        '$project': {
                                            'laba': { '$sum': '$net' },
                                            'kotor': { '$sum': '$bruto' },
                                            '_id': 0
                                        }
                                    }
                                ],
                                'double': [
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
                                            'bruto': mon_fee(),
                                            'net': mon_fen(),
                                        }
                                    },
                                    {
                                        '$project': {
                                            'laba': { '$sum': '$net' },
                                            'kotor': { '$sum': '$bruto' },
                                            '_id': 0
                                        }
                                    }
                                ]
                            }
                        },
                        {
                            '$addFields': {
                                'net_now': { '$ifNull': [{ '$sum': '$now.laba' }, { '$toInt': '0' }] },
                                'net_double': { '$ifNull': [{ '$sum': '$double.laba' }, { '$toInt': '0' }] },
                                'bruto_now': { '$ifNull': [{ '$sum': '$now.kotor' }, { '$toInt': '0' }] },
                                'bruto_double': { '$ifNull': [{ '$sum': '$double.kotor' }, { '$toInt': '0' }] },
                            }
                        },
                        {
                            '$addFields': {
                                'percent_net': percent_aggregate('$net_now', '$net_double'),
                                'percent_bruto': percent_aggregate('$bruto_now', '$bruto_double')
                            }
                        },
                        {
                            '$project': {
                                'net': {
                                    'percent': '$percent_net',
                                    'income_now': '$net_now',
                                    'income_double': '$net_double',
                                },
                                'bruto': {
                                    'percent': '$percent_bruto',
                                    'income_now': '$bruto_now',
                                    'income_double': '$bruto_double',
                                }
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
                                'now': [
                                    {
                                        '$match': {
                                            '$and': [
                                                { 'date_id': { $lte: time_start } },
                                                { 'date_id': { $gte: time_end } },
                                                { 'pym.sts': 'settlement' }
                                            ]
                                        }
                                    },
                                    {
                                        '$addFields': {
                                            'bruto': mon_fee(),
                                            'net': mon_fen(),
                                        }
                                    },
                                    {
                                        '$project': {
                                            'laba': { '$sum': '$net' },
                                            'kotor': { '$sum': '$bruto' },
                                            '_id': 0
                                        }
                                    }
                                ],
                                'double': [
                                    {
                                        '$match': {
                                            '$and': [
                                                { 'date_id': { $lte: time_start_double } },
                                                { 'date_id': { $gte: time_end_double } },
                                                { 'pym.sts': 'settlement' }

                                            ]
                                        }
                                    },
                                    {
                                        '$addFields': {
                                            'bruto': mon_fee(),
                                            'net': mon_fen(),
                                        }
                                    },
                                    {
                                        '$project': {
                                            'laba': { '$sum': '$net' },
                                            'kotor': { '$sum': '$bruto' },
                                            '_id': 0
                                        }
                                    }
                                ]
                            }
                        },
                        {
                            '$addFields': {
                                'net_now': { '$ifNull': [{ '$sum': '$now.laba' }, { '$toInt': '0' }] },
                                'net_double': { '$ifNull': [{ '$sum': '$double.laba' }, { '$toInt': '0' }] },
                                'bruto_now': { '$ifNull': [{ '$sum': '$now.kotor' }, { '$toInt': '0' }] },
                                'bruto_double': { '$ifNull': [{ '$sum': '$double.kotor' }, { '$toInt': '0' }] },
                            }
                        },
                        {
                            '$addFields': {
                                'percent_net': percent_aggregate('$net_now', '$net_double'),
                                'percent_bruto': percent_aggregate('$bruto_now', '$bruto_double')
                            }
                        },
                        {
                            '$project': {
                                'net': {
                                    'percent': '$percent_net',
                                    'income_now': '$net_now',
                                    'income_double': '$net_double',

                                },
                                'bruto': {
                                    'percent': '$percent_bruto',
                                    'income_now': '$bruto_now',
                                    'income_double': '$bruto_double',
                                }
                            }
                        }
                    ]
                }
            },
            {
                '$limit': 1
            },
            {
                '$unwind': {
                    'path': '$dc'
                }
            },
            {
                '$unwind': {
                    'path': '$subs'
                }
            },
            {
                '$unwind': {
                    'path': '$vch'
                }
            },
            {
                '$unwind': {
                    'path': '$pay'
                }
            },
            {
                '$addFields': {
                    'net_now': { '$add': ['$subs.net.income_now', '$pay.net.income_now', '$vch.net.income_now', '$dc.net.income_now'] },
                    'net_double': { '$add': ['$subs.net.income_double', '$pay.net.income_double', '$vch.net.income_double', '$dc.net.income_double'] },

                    'bruto_now': { '$add': ['$subs.bruto.income_now', '$pay.bruto.income_now', '$vch.bruto.income_now', '$dc.bruto.income_now'] },
                    'bruto_double': { '$add': ['$subs.bruto.income_double', '$pay.bruto.income_double', '$vch.bruto.income_double', '$dc.bruto.income_double'] },

                }
            },
            {
                '$addFields': {
                    'admin_all_now': { '$add': ['$pay.net.income_now', '$vch.net.income_now'] },
                    'admin_all_double': { '$add': ['$pay.net.income_double', '$vch.net.income_double'] },
                }
            },
            {
                '$addFields': {
                    'all_percent': percent_aggregate('$bruto_now', '$bruto_double'),

                    'percent_admin_all': percent_aggregate('$admin_all_now', '$admin_all_double'),

                    'percent_admin_voucher': percent_aggregate('$admin_voucher_now', '$admin_voucher_double'),

                    'diff_days': {
                        '$concat': [
                            {
                                '$toString': {
                                    '$dateDiff': {
                                        'startDate': {
                                            '$toDate': {
                                                '$multiply': [time_start, 1000]
                                            }
                                        },
                                        'endDate': {
                                            '$toDate': {
                                                '$multiply': [time_end, 1000]
                                            }
                                        },
                                        'unit': 'day'
                                    }
                                }
                            },
                            ' days'
                        ]
                    },
                }
            },
            {
                '$project': {
                    'all': {
                        'income': '$bruto_now',
                        'percent': '$all_percent',
                        'diff_day': '$diff_days',
                        'label' : 'All'
                    },
                    'magic_mirror': {
                        'income': '$subs.net.income_now',
                        'percent': '$subs.net.percent',
                        'diff_day': '$diff_days',
                        'label' : 'Magic Mirror'

                    },
                    'admin_all': {
                        'income': '$admin_all_now',
                        'percent': '$percent_admin_all',
                        'diff_day': '$diff_days',
                        'label' : 'Admin All'

                        
                    },
                    'admin_product': {
                        'income': '$pay.net.income_now',
                        'percent': '$pay.net.percent',
                        'diff_day': '$diff_days',
                        'label' : 'Admin Product'

                    },
                    'admin_voucher': {
                        'income': '$vch.net.income_now',
                        'percent': '$vch.net.percent',
                        'diff_day': '$diff_days',
                        'label' : 'Admin Voucher'

                    },
                    'skin_mystery_commission': {
                        'income': '$dc.net.income_now',
                        'percent': '$dc.net.percent',
                        'diff_day': '$diff_days',
                        'label' : 'Skin Mystery Commission'

                    },
                    '_id': 0
                }
            }
        ]
    )
}

module.exports = { gross_income_finance }