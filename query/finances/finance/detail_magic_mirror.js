const { percent_aggregate } = require("../../../helper/percent")
const { range_day_aggregate } = require("../../../helper/range_day")

function detail_money_magic_mirror(time_start, time_end, time_start_double, time_end_double, money, label) {
    return (
        [
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
                    'all_now': [
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
                                'total_prc': { '$sum': money },
                            }
                        },
                        {
                            '$project': {
                                'label': 'all',
                                'x': '$_id',
                                'y': '$total_prc',
                                '_id': 0
                            }
                        },
                        {
                            '$sort': { 'x': 1 }
                        }
                    ],
                    'all_double': [
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
                                'total_prc': { '$sum': money },
                            }
                        },
                        {
                            '$project': {
                                'label': 'all',
                                'x': '$_id',
                                'y': '$total_prc',
                                '_id': 0
                            }
                        },
                        {
                            '$sort': { 'x': 1 }
                        }
                    ],
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
                                'total_prc': { '$sum': money },
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
                                'total_prc': { '$sum': money },
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
                                'total_prc': { '$sum': money },
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
                                'total_prc': { '$sum': money },
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
                                'total_prc': { '$sum': money },
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
                                'total_prc': { '$sum': money },
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
                    'all_a': { '$ifNull': [{ '$sum': '$all_now.y' }, { '$toInt': '0' }] },
                    'all_b': { '$ifNull': [{ '$sum': '$all_double.y' }, { '$toInt': '0' }] },
                    'public_a': { '$ifNull': [{ '$sum': '$public_now.y' }, { '$toInt': '0' }] },
                    'public_b': { '$ifNull': [{ '$sum': '$public_double.y' }, { '$toInt': '0' }] },
                    'onsite_a': { '$ifNull': [{ '$sum': '$onsite_now.y' }, { '$toInt': '0' }] },
                    'onsite_b': { '$ifNull': [{ '$sum': '$onsite_double.y' }, { '$toInt': '0' }] },
                    'online_a': { '$ifNull': [{ '$sum': '$online_now.y' }, { '$toInt': '0' }] },
                    'online_b': { '$ifNull': [{ '$sum': '$online_double.y' }, { '$toInt': '0' }] }
                }
            },
            {
                '$addFields': {
                    'p_public': percent_aggregate('$public_a', '$public_b'),
                    'p_onsite': percent_aggregate('$onsite_a', '$onsite_b'),
                    'p_online': percent_aggregate('$online_a', '$online_b'),
                    'range_day': range_day_aggregate(time_start, time_end),
                }
            },
            {
                '$project': {
                    '_id': 0,
                    'label': label,
                    'public': {
                        'percent': '$p_public',
                        'amount': '$public_a'
                    },
                    'online': {
                        'percent': '$p_online',
                        'amount': '$online_a'
                    },
                    'onsite': {
                        'percent': '$p_onsite',
                        'amount': '$onsite_a'
                    },
                    'diff_day': '$range_day',
                }
            }
        ]
    )
}


module.exports = { detail_money_magic_mirror }