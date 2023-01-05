const { percent_aggregate } = require("../../../helper/percent")
const { range_day_aggregate } = require("../../../helper/range_day")


function admin_chart_detail(time_start, time_end, time_start_double, time_end_double) {
    const query = [
        {
            '$limit': 1
        },
        {
            '$lookup': {
                'from': 'sys_vouchers',
                'as': 'vc',
                'pipeline': [
                    {
                        '$facet': {
                            'data_now': [
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
                                        'income': '$mon.fen',
                                        'date': { '$toDate': { '$multiply': ['$ep', 1000] } },
                                        '_id': 0
                                    }
                                }
                            ],
                            'data_double': [
                                {
                                    '$match': {
                                        '$and': [
                                            { 'ep': { '$lte': time_start_double } },
                                            { 'ep': { '$gte': time_end_double } },
                                            { 'pym.sts': 'settlement' }

                                        ]
                                    }
                                },
                                {
                                    '$project': {
                                        'income': '$mon.fen',
                                        'date': { '$toDate': { '$multiply': ['$ep', 1000] } },
                                        '_id': 0
                                    }
                                }
                            ]
                        }
                    },

                ]
            }
        },
        {
            '$lookup': {
                'from': 'sys_payment',
                'as': 'py',
                'pipeline': [
                    {
                        '$facet': {
                            'data_now': [
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
                                    '$project': {
                                        'income': '$mon.fen',
                                        'date': { '$toDate': { '$multiply': ['$ep', 1000] } },
                                        '_id': 0
                                    }
                                }
                            ],
                            'data_double': [
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
                                    '$project': {
                                        'income': '$mon.fen',
                                        'date': { '$toDate': { '$multiply': ['$ep', 1000] } },
                                        '_id': 0
                                    }
                                }
                            ]
                        }
                    },
                ]
            }
        },
        {
            '$unwind': {
                'path': '$py'
            }
        },
        {
            '$unwind': {
                'path': '$vc'
            }
        },
        {
            '$addFields': {
                'diff_day': range_day_aggregate(time_start, time_end)
            }
        },
        {
            '$facet': {
                'allAdmin': [
                    {
                        '$project': {
                            'combined': { '$concatArrays': ['$py.data_now', '$vc.data_now'] },
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
                'card_admin': [
                    {
                        '$addFields': {
                            'incomeNow': { '$add': [{ '$sum': '$py.data_now.income' }, { '$sum': '$vc.data_now.income' }] },
                            'incomeDouble': { '$add': [{ '$sum': '$py.data_double.income' }, { '$sum': '$vc.data_double.income' }] },
                        }
                    },
                    {
                        '$addFields': {
                            'percent': percent_aggregate('$incomeNow', '$incomeDouble')
                        }
                    },
                    {
                        '$project': {
                            '_id': 0,
                            'income': '$incomeNow',
                            'percent': '$percent',
                            'diff_day': '$diff_day'
                        }
                    }

                ],
                'admin_voucher': [
                    {
                        '$project': {
                            'data': '$vc.data_now',
                            '_id': 0
                        }
                    },
                    {
                        '$unwind': { 'path': '$data' }
                    },
                    {
                        '$group': {
                            '_id': {
                                '$dateToString': {
                                    'date': '$data.date',
                                    'format': '%Y-%m-%d',
                                    'onNull': '2020-01-01'
                                }
                            },
                            'income': { '$sum': '$data.income' }
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
                'card_voucher': [
                    {
                        '$addFields': {
                            'incomeNow': { '$sum': '$vc.data_now.income' },
                            'incomeDouble': { '$sum': '$vc.data_double.income' }
                        }
                    },
                    {
                        '$addFields': {
                            'percent': percent_aggregate('$incomeNow', '$incomeDouble')

                        }
                    },
                    {
                        '$project': {
                            '_id': 0,
                            'income': '$incomeNow',
                            'percent': '$percent',
                            'diff_day': '$diff_day'
                        }
                    }

                ],
                'admin_product': [
                    {
                        '$project': {
                            'data': '$py.data_now',
                            '_id': 0
                        }
                    },
                    {
                        '$unwind': { 'path': '$data' }
                    },
                    {
                        '$group': {
                            '_id': {
                                '$dateToString': {
                                    'date': '$data.date',
                                    'format': '%Y-%m-%d',
                                    'onNull': '2020-01-01'
                                }
                            },
                            'income': { '$sum': '$data.income' }
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
                'card_product': [
                    {
                        '$addFields': {
                            'incomeNow': { '$sum': '$py.data_now.income' },
                            'incomeDouble': { '$sum': '$py.data_double.income' }
                        }
                    },
                    {
                        '$addFields': {
                            'percent': percent_aggregate('$incomeNow', '$incomeDouble')
                        }
                    },
                    {
                        '$project': {
                            '_id': 0,
                            'income': '$incomeNow',
                            'percent': '$percent',
                            'diff_day': '$diff_day'
                        }
                    }

                ],
            }
        },
        {
            '$addFields': {
                'admin': {
                    '$map': {
                        'input': '$card_admin',
                        'in': {
                            'income': '$$this.income',
                            'percent': '$$this.percent',
                            'diff_day': '$$this.diff_day',
                            'statistic': '$allAdmin'

                        }
                    }
                },
                'product': {
                    '$map': {
                        'input': '$card_product',
                        'in': {
                            'income': '$$this.income',
                            'percent': '$$this.percent',
                            'diff_day': '$$this.diff_day',
                            'statistic': '$admin_product'
                        }
                    }
                },
                'voucher': {
                    '$map': {
                        'input': '$card_voucher',
                        'in': {
                            'income': '$$this.income',
                            'percent': '$$this.percent',
                            'diff_day': '$$this.diff_day',
                            'statistic': '$admin_voucher'
                        }
                    }
                }
            }
        },
        {
            '$unwind': {
                'path': '$admin'
            }
        },
        {
            '$unwind': {
                'path': '$product'
            }
        },
        {
            '$unwind': {
                'path': '$voucher'
            }
        },
        {
            '$project': {
                'admin': '$admin',
                'product': '$product',
                'voucher': '$voucher',
                '_id': 0

            }
        }
    ]

    return query
}

module.exports = { admin_chart_detail }