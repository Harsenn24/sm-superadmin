const { percent_aggregate } = require("../../../helper/percent")
const { range_day_aggregate } = require("../../../helper/range_day")

function shipping_summary(time_start, time_end, time_start_double, time_end_double) {
    let query = [
        {
            '$addFields': {
                'date': {
                    '$dateToString': {
                        'date': { '$toDate': { '$multiply': ['$ep', 1000] } },
                        'format': '%Y-%m-%d',
                        'onNull': '2020-01-01'
                    }
                }
            }
        },
        {
            '$facet': {
                'buyerNow': [
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
                        '$group': {
                            '_id': '$date',
                            'total': { '$sum': '$mon.shp' },
                        }
                    },
                    {
                        '$project': {
                            'x': '$_id',
                            'y': '$total',
                            'label': 'Buyer',
                            '_id': 0
                        }
                    },
                    {
                        '$sort': { 'x': 1 }
                    }
                ],
                'buyerDouble': [
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
                        '$group': {
                            '_id': '$date',
                            'total': { '$sum': '$mon.shp' },
                        }
                    },
                    {
                        '$project': {
                            'x': '$_id',
                            'y': '$total',
                            'label': 'Buyer',
                            '_id': 0
                        }
                    },
                ],
                'sellerNow': [
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
                        '$group': {
                            '_id': '$date',
                            'total': { '$sum': '$mon.tlo' },
                        }
                    },
                    {
                        '$project': {
                            'x': '$_id',
                            'y': '$total',
                            'label': 'Seller',
                            '_id': 0
                        }
                    },
                    {
                        '$sort': { 'x': 1 }
                    }
                ],
                'sellerDouble': [
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
                        '$group': {
                            '_id': '$date',
                            'total': { '$sum': '$mon.tlo' },
                        }
                    },
                    {
                        '$project': {
                            'x': '$_id',
                            'y': '$total',
                            'label': 'Seller',
                            '_id': 0
                        }
                    },
                ],
                'smNow': [
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
                        '$group': {
                            '_id': '$date',
                            'total': { '$sum': '$mon.glo' },
                        }
                    },
                    {
                        '$project': {
                            'x': '$_id',
                            'y': '$total',
                            'label': 'skin_mystery',
                            '_id': 0
                        }
                    },
                    {
                        '$sort': { 'x': 1 }
                    }
                ],
                'smDouble': [
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
                        '$group': {
                            '_id': '$date',
                            'total': { '$sum': '$mon.glo' },
                        }
                    },
                    {
                        '$project': {
                            'x': '$_id',
                            'y': '$total',
                            'label': 'skin_mystery',
                            '_id': 0
                        }
                    },
                ],

            }
        },
        {
            '$addFields': {
                'total_now': { '$ifNull': [{ '$sum': '$buyerNow.y' }, { '$toInt': 0 }] },
                'total_double': { '$ifNull': [{ '$sum': '$buyerDouble.y' }, { '$toInt': 0 }] },

                'seller_now': { '$ifNull': [{ '$sum': '$sellerNow.y' }, { '$toInt': 0 }] },
                'seller_double': { '$ifNull': [{ '$sum': '$sellerDouble.y' }, { '$toInt': 0 }] },

                'sm_now': { '$ifNull': [{ '$sum': '$smNow.y' }, { '$toInt': 0 }] },
                'sm_double': { '$ifNull': [{ '$sum': '$smDouble.y' }, { '$toInt': 0 }] },
            }
        },
        {
            '$addFields': {
                'percentBuyer': percent_aggregate('$total_now', '$total_double'),
                'percentSeller': percent_aggregate('$seller_now', '$seller_double'),
                'percentSm': percent_aggregate('$sm_now', '$sm_double'),
                'diff_day': range_day_aggregate(time_start, time_end)
            }
        },
        {
            '$project': {
                'buyer': {
                    'cost': '$total_now',
                    'percent': '$percentBuyer',
                    'diff_day': '$diff_day',
                    'statistic': '$buyerNow',
                },
                'seller': {
                    'cost': '$seller_now',
                    'percent': '$percentSeller',
                    'diff_day': '$diff_day',
                    'statistic': '$sellerNow',
                },
                'skin_mystery': {
                    'cost': '$sm_now',
                    'percent': '$percentSm',
                    'diff_day': '$diff_day',
                    'statistic': '$smNow',
                },
                '_id': 0
            }
        }
    ]

    return query
}

module.exports = { shipping_summary }