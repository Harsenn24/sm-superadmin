const { range_day_aggregate } = require("../helper/range_day")
const { percent_aggregate } = require("../helper/percent")

function mm_summary(time_start, time_end, time_start_double, time_end_double) {
    return ([
        {
            '$addFields': {
                'date': {
                    '$dateToString': {
                        'date': { '$toDate': { '$multiply': ['$ep', 1000] } },
                        'format': '%Y-%m-%d',
                        'onNull': '2020-01-01'
                    }
                },

            }
        },
        {
            '$facet': {
                'bruto_now': [
                    {
                        '$match': {
                            '$and': [
                                { 'ep': { '$lte': time_start } },
                                { 'ep': { '$gte': time_end } },
                                { 'pym.sts': 'settlement' },
                            ]
                        },
                    },
                    {
                        '$group': {
                            '_id': '$date',
                            'total_prc': { '$sum': '$prb' },
                        }
                    },
                    {
                        '$project': {
                            'label': 'bruto',
                            'x': '$_id',
                            'y': '$total_prc',
                            '_id': 0
                        }
                    },
                    {
                        '$sort': { 'x': 1 }
                    }
                ],
                'bruto_double': [
                    {
                        '$match': {
                            '$and': [
                                { 'ep': { '$lte': time_start_double } },
                                { 'ep': { '$gte': time_end_double } },
                                { 'pym.sts': 'settlement' },
                            ]
                        },
                    },
                    {
                        '$group': {
                            '_id': '$date',
                            'total_prc': { '$sum': '$prb' },
                        }
                    },
                    {
                        '$project': {
                            'label': 'bruto',
                            'x': '$_id',
                            'y': '$total_prc',
                            '_id': 0
                        }
                    },
                    {
                        '$sort': { 'x': 1 }
                    }
                ],
                'net_now': [
                    {
                        '$match': {
                            '$and': [
                                { 'ep': { '$lte': time_start } },
                                { 'ep': { '$gte': time_end } },
                                { 'pym.sts': 'settlement' },
                            ]
                        },
                    },
                    {
                        '$group': {
                            '_id': '$date',
                            'total_prc': { '$sum': '$prn' },
                        }
                    },
                    {
                        '$project': {
                            'label': 'netto',
                            'x': '$_id',
                            'y': '$total_prc',
                            '_id': 0
                        }
                    },
                    {
                        '$sort': { 'x': 1 }
                    }
                ],
                'net_double': [
                    {
                        '$match': {
                            '$and': [
                                { 'ep': { '$lte': time_start_double } },
                                { 'ep': { '$gte': time_end_double } },
                                { 'pym.sts': 'settlement' },
                            ]
                        },
                    },
                    {
                        '$group': {
                            '_id': '$date',
                            'total_prc': { '$sum': '$prn' },
                        }
                    },
                    {
                        '$project': {
                            'label': 'netto',
                            'x': '$_id',
                            'y': '$total_prc',
                            '_id': 0
                        }
                    },
                    {
                        '$sort': { 'x': 1 }
                    }
                ],
                'tax_now': [
                    {
                        '$match': {
                            '$and': [
                                { 'ep': { '$lte': time_start } },
                                { 'ep': { '$gte': time_end } },
                                { 'pym.sts': 'settlement' },
                            ]
                        },
                    },
                    {
                        '$group': {
                            '_id': '$date',
                            'total_prc': { '$sum': '$mon.ppn' },
                        }
                    },
                    {
                        '$project': {
                            'label': 'netto',
                            'x': '$_id',
                            'y': '$total_prc',
                            '_id': 0
                        }
                    },
                    {
                        '$sort': { 'x': 1 }
                    }
                ],
                'tax_double': [
                    {
                        '$match': {
                            '$and': [
                                { 'ep': { '$lte': time_start_double } },
                                { 'ep': { '$gte': time_end_double } },
                                { 'pym.sts': 'settlement' },
                            ]
                        },
                    },
                    {
                        '$group': {
                            '_id': '$date',
                            'total_prc': { '$sum': '$mon.ppn' },
                        }
                    },
                    {
                        '$project': {
                            'label': 'netto',
                            'x': '$_id',
                            'y': '$total_prc',
                            '_id': 0
                        }
                    },
                    {
                        '$sort': { 'x': 1 }
                    }
                ],
                'com_now': [
                    {
                        '$match': {
                            '$and': [
                                { 'ep': { '$lte': time_start } },
                                { 'ep': { '$gte': time_end } },
                                { 'pym.sts': 'settlement' },
                                { 'src': { '$in': ['member-online', 'member-offline', 'member-onsite'] } },
                            ]
                        },
                    },
                    {
                        '$group': {
                            '_id': '$date',
                            'commission': { '$sum': '$mon.clm' },
                        }
                    },
                    {
                        '$project': {
                            'label': 'Comm',
                            'x': '$_id',
                            'y': '$commission',
                            '_id': 0
                        }
                    },
                    {
                        '$sort': { 'x': 1 }
                    }
                ],
                'com_double': [
                    {
                        '$match': {
                            '$and': [
                                { 'ep': { '$lte': time_start_double } },
                                { 'ep': { '$gte': time_end_double } },
                                { 'pym.sts': 'settlement' },
                                { 'src': { '$in': ['member-online', 'member-offline', 'member-onsite'] } },
                            ]
                        },
                    },
                    {
                        '$group': {
                            '_id': '$date',
                            'commission': { '$sum': '$mon.clm' },
                        }
                    },
                    {
                        '$project': {
                            'label': 'Comm',
                            'x': '$_id',
                            'y': '$commission',
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
            '$addFields': {
                'netto_a': { '$ifNull': [{ '$sum': '$net_now.y' }, { '$toInt': '0' }] },
                'netto_b': { '$ifNull': [{ '$sum': '$net_double.y' }, { '$toInt': '0' }] },
                'bruto_a': { '$ifNull': [{ '$sum': '$bruto_now.y' }, { '$toInt': '0' }] },
                'bruto_b': { '$ifNull': [{ '$sum': '$bruto_double.y' }, { '$toInt': '0' }] },
                'tax_a': { '$ifNull': [{ '$sum': '$tax_now.y' }, { '$toInt': '0' }] },
                'tax_b': { '$ifNull': [{ '$sum': '$tax_double.y' }, { '$toInt': '0' }] },
                'comm_a': { '$ifNull': [{ '$sum': '$com_now.y' }, { '$toInt': '0' }] },
                'comm_b': { '$ifNull': [{ '$sum': '$com_double.y' }, { '$toInt': '0' }] }
            }
        },
        {
            '$addFields': {
                'p_netto': percent_aggregate('$netto_a', '$netto_b'),
                'p_bruto': percent_aggregate('$bruto_a', '$bruto_b'),
                'p_tax': percent_aggregate('$tax_a', '$tax_b'),
                'p_comm': percent_aggregate('$comm_a', '$comm_b'),
                'range_day': range_day_aggregate(time_start, time_end)
            }
        },
        {
            '$project': {
                '_id': 0,
                'netto': {
                    'percent': '$p_netto',
                    'amount': '$netto_a'
                },
                'tax': {
                    'percent': '$p_tax',
                    'amount': '$tax_a'
                },
                'bruto': {
                    'percent': '$p_bruto',
                    'amount': '$bruto_a'
                },
                'commission': {
                    'percent': '$p_comm',
                    'amount': '$comm_a'
                },
                'diff_day': '$range_day'
            }
        }
    ])
}


module.exports = { mm_summary }