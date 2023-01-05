
function chartProductSeen(time_start, time_end, time_start_double, time_end_double, ObjectID, idDecrypt) {
    return ([
        {
            '$match': { '_s': ObjectID(idDecrypt) },
        },
        {
            '$facet': {
                'dataNow': [
                    {
                        '$match': {
                            '$and': [
                                { 'ep': { '$lte': time_start } },
                                { 'ep': { '$gte': time_end } }
                            ]
                        }
                    },
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
                        '$group': {
                            '_id': '$date',
                            'total_view': { '$sum': 1 }
                        }
                    },
                    { '$sort': { '_id': 1 } },
                    {
                        '$project': {
                            'label': 'total_view',
                            'x': '$_id',
                            'y': '$total_view',
                            '_id': 0
                        }
                    }
                ],
                'dataDouble': [
                    {
                        '$match': {
                            '$and': [
                                { 'ep': { '$lte': time_start_double } },
                                { 'ep': { '$gte': time_end_double } }
                            ]
                        }
                    },
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
                        '$project': {
                            '_id': 0,
                            'total_view': { '$sum': 1 }
                        }
                    }
                ]
            }
        },
        {
            '$addFields': {
                'data_now': { '$sum': '$dataNow.y' },
                'data_double': { '$sum': '$dataDouble.total_view' }
            }
        },
        {
            '$addFields': {
                'percent': {
                    '$round': [{
                        '$multiply': [
                            {
                                '$divide': [
                                    { '$subtract': ['$data_now', '$data_double'] },
                                    {
                                        '$cond': {
                                            'if': { '$lte': ['$data_double', 0] },
                                            'then': 1,
                                            'else': '$data_double'
                                        }
                                    }
                                ]
                            }, 100
                        ]
                    }, 2]
                },
                'diff_day': {
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
                }
            }
        },
        {
            '$project': {
                '_id': 0,
                'total_view': '$data_now',
                'percent': '$percent',
                'diff_days': '$diff_day',
                'statistic': '$dataNow',
            }
        }
    ])
}


module.exports = { chartProductSeen }