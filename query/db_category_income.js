
function net_income(time_start, time_end, time_start_double, time_end_double) {
    return ([
        {
            '$lookup': {
                'from': 'sys_subscribe',
                'as': 'subs',
                'pipeline': [
                    {
                        '$sort': { 'id': -1 }
                    },
                    {
                        '$facet': {
                            'labaNow': [
                                {
                                    '$match': {
                                        '$and': [
                                            { 'mon.amm': { $ne: null } },
                                            { 'ep': { $lte: time_start } },
                                            { 'ep': { $gte: time_end } }
                                        ]
                                    }
                                },
                                {
                                    '$addFields': {
                                        'labaSatuan': {
                                            '$subtract': [
                                                '$mon.amm', { '$add': ['$mon.pph', '$mon.ppn', '$mon.fee'] }
                                            ]
                                        }
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
                                            { 'mon.amm': { $ne: null } },
                                            { 'ep': { $lte: time_start_double } },
                                            { 'ep': { $gte: time_end_double } }
                                        ]
                                    }
                                },
                                {
                                    '$addFields': {
                                        'labaSatuan': {
                                            '$subtract': [
                                                '$mon.amm', { '$add': ['$mon.pph', '$mon.ppn', '$mon.fee'] }
                                            ]
                                        }
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
                            'mm_percent': {
                                '$multiply': [
                                    {
                                        '$divide': [
                                            { '$subtract': ['$mm_now', '$mm_double'] },
                                            {
                                                '$cond': {
                                                    'if': { '$lte': ['$mm_double', 0] },
                                                    'then': 1,
                                                    'else': '$mm_double'
                                                }
                                            }
                                        ]
                                    }, 100
                                ]
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
                            'pay_now': [
                                {
                                    '$match': {
                                        '$and': [
                                            { 'mon.amm': { $ne: null } },
                                            { 'ep': { $lte: time_start } },
                                            { 'ep': { $gte: time_end } }
                                        ]
                                    }
                                },
                                {
                                    '$addFields': {
                                        'labaSatuan': {'$subtract' : ['$mon.fee' , {'$add' : ['$mon.pph', '$mon.ppn']}]}
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
                                            { 'mon.amm': { $ne: null } },
                                            { 'ep': { $lte: time_start_double } },
                                            { 'ep': { $gte: time_end_double } }
                                        ]
                                    }
                                },
                                {
                                    '$addFields': {
                                        'labaSatuan': {'$subtract' : ['$mon.fee' , {'$add' : ['$mon.pph', '$mon.ppn']}]}
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
                            'pay_percent': {
                                '$multiply': [
                                    {
                                        '$divide': [
                                            { '$subtract': ['$pay_now', '$pay_double'] },
                                            {
                                                '$cond': {
                                                    'if': { '$lte': ['$pay_double', 0] },
                                                    'then': 1,
                                                    'else': '$pay_double'
                                                }
                                            }
                                        ]
                                    }, 100
                                ]
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
                        '$sort': { 'id': -1 }
                    },
                    {
                        '$facet': {
                            'vch_now': [
                                {
                                    '$match': {
                                        '$and': [
                                            { 'mon.fee': { $ne: null } },
                                            { 'ep': { $lte: time_start } },
                                            { 'ep': { $gte: time_end } }
                                        ]
                                    }
                                },
                                {
                                    '$addFields': {
                                        'labaSatuan': {'$subtract' : ['$mon.fee' , {'$add' : ['$mon.pph', '$mon.ppn']}]}
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
                                            { 'mon.fee': { $ne: null } },
                                            { 'ep': { $lte: time_start_double } },
                                            { 'ep': { $gte: time_end_double } }
                                        ]
                                    }
                                },
                                {
                                    '$addFields': {
                                        'labaSatuan': {'$subtract' : ['$mon.fee' , {'$add' : ['$mon.pph', '$mon.ppn']}]}
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
                            'vch_percent': {
                                '$multiply': [
                                    {
                                        '$divide': [
                                            { '$subtract': ['$vch_now', '$vch_double'] },
                                            {
                                                '$cond': {
                                                    'if': { '$lte': ['$vch_double', 0] },
                                                    'then': 1,
                                                    'else': '$vch_double'
                                                }
                                            }
                                        ]
                                    }, 100
                                ]
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
            '$addFields': {
                'mm_now': { '$first': '$subs.mm_now' },
                'mm_double': { '$first': '$subs.mm_double' },
                'mm_percent': { '$first': '$subs.mm_percent' },
                'vch_now': { '$first': '$vch.vch_now' },
                'vch_double': { '$first': '$vch.vch_double' },
                'vch_percent': { '$first': '$vch.vch_percent' },
                'pay_now': { '$first': '$pay.pay_now' },
                'pay_double': { '$first': '$pay.pay_double' },
                'pay_percent': { '$first': '$pay.pay_percent' },
                'admin_fee_now': {'$add' :[{ '$first': '$pay.pay_now' }, { '$first': '$vch.vch_now' } ]},
                'admin_fee_double': {'$add' :[{ '$first': '$pay.pay_double' }, { '$first': '$vch.vch_double' } ]},
            }
        },
        {
            '$addFields': {
                'admin_percent': {
                    '$multiply': [
                        {
                            '$divide': [
                                { '$subtract': ['$admin_fee_now', '$admin_fee_double'] },
                                {
                                    '$cond': {
                                        'if': { '$lte': ['$admin_fee_double', 0] },
                                        'then': 1,
                                        'else': '$admin_fee_double'
                                    }
                                }
                            ]
                        }, 100
                    ]
                },
            }
        },
        // {
        //     '$project': {
        //         'mm_income': '$mm_income',
        //         'admin_income': '$admin_fee_now',
        //         '_id': 0
        //     }
        // }
    ])
}


module.exports = { net_income }