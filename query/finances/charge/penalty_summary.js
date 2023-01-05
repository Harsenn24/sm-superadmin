const { percent_aggregate } = require("../../../helper/percent")
const { range_day_aggregate } = require("../../../helper/range_day")


function penalty_summary(time_start, time_end, time_start_double, time_end_double) {
    let query = [
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
                                { 'ep': { $lte: time_start } },
                                { 'ep': { $gte: time_end } },
                            ]
                        }
                    },
                    {
                        '$group': {
                            '_id': '$date',
                            'amount': { '$sum': '$amm' }
                        }
                    },
                    {
                        '$project': {
                            'x': '$_id',
                            'y': '$amount',
                            '_id': 0,
                        }
                    }
                ],
                'data_double': [
                    {
                        '$match': {
                            '$and': [
                                { 'ep': { $lte: time_start_double } },
                                { 'ep': { $gte: time_end_double } },
                            ]
                        }
                    },
                    {
                        '$group': {
                            '_id': '$date',
                            'amount': { '$sum': '$amm' }
                        }
                    },
                    {
                        '$project': {
                            'x': '$_id',
                            'y': '$amount',
                            '_id': 0,
                        }
                    }
                ]
            }
        },
        {
            '$addFields': {
                'dataNow': { '$ifNull': [{ '$sum': '$data_now.y' }, { '$toInt': '0' }] },
                'dataDouble': { '$ifNull': [{ '$sum': '$data_double.y' }, { '$toInt': '0' }] },
            }
        },
        {
            '$addFields': {
                'percent': percent_aggregate('$dataNow', '$dataDouble'),
                'diff_days': range_day_aggregate(time_start, time_end)
            }
        },
        {
            '$project': {
                'total_amount': '$dataNow',
                'percent': '$percent',
                'diff_days': '$diff_days',
                'statistic': '$data_now',
                '_id': 0
            }
        }
    ]

    return query
}

module.exports = { penalty_summary }