const { range_day_aggregate } = require("../helper/range_day")
const { percent_aggregate } = require("../helper/percent")

function total_user(time_start, time_end, time_start_double, time_end_double) {
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
                'total': { '$sum': 1 }
            }
        },
        {
            '$facet': {
                'data_a': [
                    {
                        '$match': {
                            '$and': [
                                { 'ep': { '$lte': time_start } },
                                { 'ep': { '$gte': time_end } },
                                { 'dat.act': true },
                                { 'dat.eml.act': true },

                            ]
                        }
                    },
                    {
                        '$group': {
                            '_id': '$date',
                            'totalData': { '$sum': '$total' }
                        }
                    },
                    {
                        '$project': {
                            'x': '$_id',
                            'y': '$totalData',
                            '_id': 0
                        }
                    },
                    {
                        '$sort': { 'x': 1 }
                    }
                ],
                'data_b': [
                    {
                        '$match': {
                            '$and': [
                                { 'ep': { '$lte': time_start_double } },
                                { 'ep': { '$gte': time_end_double } },
                                { 'dat.act': true },
                                { 'dat.eml.act': true },


                            ]
                        }
                    },
                    {
                        '$group': {
                            '_id': '$date',
                            'totalData': { '$sum': '$total' }
                        }
                    },
                    {
                        '$project': {
                            'x': '$_id',
                            'y': '$totalData',
                            '_id': 0
                        }
                    }
                ]
            }
        },
        {
            '$addFields': {
                'data_now': { '$sum': '$data_a.y' },
                'data_double': { '$sum': '$data_b.y' },
            }
        },
        {
            '$addFields': {
                'percent': percent_aggregate('$data_now', '$data_double')
            }
        },
        {
            '$project': {
                'total_users': '$data_now',
                'percent_users': '$percent',
                'diff_days': range_day_aggregate(time_start, time_end),
                '_id': 0,
                'statistic': '$data_a'
            }
        }
    ])
}


module.exports = { total_user }