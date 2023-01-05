const { percent_aggregate } = require("../../../helper/percent")
const { range_day_aggregate } = require("../../../helper/range_day")

function public_income_query(time_start, time_end, time_start_double, time_end_double) {
    const query = [
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
                'public_now': [
                    {
                        '$match': {
                            '$and': [
                                { 'ep': { '$lte': time_start } },
                                { 'ep': { '$gte': time_end } },
                                { 'pym.sts': 'settlement' },
                                { 'src': 'apps' },

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
                            'label': 'public',
                            'x': '$_id',
                            'y': '$total_prc',
                            '_id': 0
                        }
                    },
                    {
                        '$sort': { 'x': 1 }
                    }
                ],
                'public_double': [
                    {
                        '$match': {
                            '$and': [
                                { 'ep': { '$lte': time_start_double } },
                                { 'ep': { '$gte': time_end_double } },
                                { 'pym.sts': 'settlement' },
                                { 'src': 'apps' },
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
                            'label': 'public',
                            'x': '$_id',
                            'y': '$total_prc',
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
                'public_a': { '$ifNull': [{ '$sum': '$public_now.y' }, { '$toInt': '0' }] },
                'public_b': { '$ifNull': [{ '$sum': '$public_double.y' }, { '$toInt': '0' }] },
            }
        },
        {
            '$addFields': {
                'p_public': percent_aggregate('$public_a', '$public_b'),
                'range_day': range_day_aggregate(time_start, time_end)
            }
        },
        {
            '$project': {
                '_id': 0,
                'percent': '$p_public',
                'amount': '$public_a',
                'diff_day': '$range_day',
                'statistic': '$public_now'
            }
        }
    ]

    return query
}

function onsite_income_query(time_start, time_end, time_start_double, time_end_double) {
    const query = [
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
                'onsite_now': [
                    {
                        '$match': {
                            '$and': [
                                { 'ep': { '$lte': time_start } },
                                { 'ep': { '$gte': time_end } },
                                { 'pym.sts': 'settlement' },
                                { 'src': { '$in': ['member-onsite', 'member-offline'] } },
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
                            'label': 'onsite',
                            'x': '$_id',
                            'y': '$total_prc',
                            '_id': 0
                        }
                    },
                    {
                        '$sort': { 'x': 1 }
                    }
                ],
                'onsite_double': [
                    {
                        '$match': {
                            '$and': [
                                { 'ep': { '$lte': time_start_double } },
                                { 'ep': { '$gte': time_end_double } },
                                { 'pym.sts': 'settlement' },
                                { 'src': { '$in': ['member-onsite', 'member-offline'] } },

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
                            'label': 'onsite',
                            'x': '$_id',
                            'y': '$total_prc',
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
                'onsite_a': { '$ifNull': [{ '$sum': '$onsite_now.y' }, { '$toInt': '0' }] },
                'onsite_b': { '$ifNull': [{ '$sum': '$onsite_double.y' }, { '$toInt': '0' }] },
            }
        },
        {
            '$addFields': {
                'p_onsite': percent_aggregate('$onsite_a', '$onsite_b'),
                'range_day': range_day_aggregate(time_start, time_end)
            }
        },
        {
            '$project': {
                '_id': 0,
                'percent': '$p_onsite',
                'amount': '$onsite_a',
                'diff_day': '$range_day',
                'statistic': '$onsite_now'
            }
        }
    ]

    return query
}

function online_income_query(time_start, time_end, time_start_double, time_end_double) {
    const query = [
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
                'online_now': [
                    {
                        '$match': {
                            '$and': [
                                { 'ep': { '$lte': time_start } },
                                { 'ep': { '$gte': time_end } },
                                { 'pym.sts': 'settlement' },
                                { 'src': 'member-online' },
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
                            'label': 'online',
                            'x': '$_id',
                            'y': '$total_prc',
                            '_id': 0
                        }
                    },
                    {
                        '$sort': { 'x': 1 }
                    }
                ],
                'online_double': [
                    {
                        '$match': {
                            '$and': [
                                { 'ep': { '$lte': time_start_double } },
                                { 'ep': { '$gte': time_end_double } },
                                { 'pym.sts': 'settlement' },
                                { 'src': 'member-online' },

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
                            'label': 'online',
                            'x': '$_id',
                            'y': '$total_prc',
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
                'online_a': { '$ifNull': [{ '$sum': '$online_now.y' }, { '$toInt': '0' }] },
                'online_b': { '$ifNull': [{ '$sum': '$online_double.y' }, { '$toInt': '0' }] }
            }
        },
        {
            '$addFields': {
                'p_online': percent_aggregate('$online_a', '$online_b'),
                'range_day': range_day_aggregate(time_start, time_end)
            }
        },
        {
            '$project': {
                '_id': 0,
                'percent': '$p_online',
                'amount': '$online_a',
                'diff_day': '$range_day',
                'statistic': '$online_now'
            }
        }
    ]

    return query
}

function all_income_query(time_start, time_end, time_start_double, time_end_double) {
    const query = [
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
                'data_now': [
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
                            'label': 'all_income',
                            'x': '$_id',
                            'y': '$total_prc',
                            '_id': 0
                        }
                    },
                    {
                        '$sort': { 'x': 1 }
                    }
                ],
                'data_double': [
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
                            'label': 'all_income',
                            'x': '$_id',
                            'y': '$total_prc',
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
                'data_a': { '$ifNull': [{ '$sum': '$data_now.y' }, { '$toInt': '0' }] },
                'data_b': { '$ifNull': [{ '$sum': '$data_double.y' }, { '$toInt': '0' }] },
            }
        },
        {
            '$addFields': {
                'p_data': percent_aggregate('$data_a', '$data_b'),
                'range_day': range_day_aggregate(time_start, time_end)
            }
        },
        {
            '$project': {
                '_id': 0,
                'percent': '$p_data',
                'amount': '$data_a',
                'diff_day': '$range_day',
                'statistic': '$data_now'
            }
        }
    ]

    return query
}

module.exports = { public_income_query, onsite_income_query, online_income_query, all_income_query }