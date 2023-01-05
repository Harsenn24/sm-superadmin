function chart_magic_mirror(time_start, time_end) {
    const query = [
        {
            '$facet': {
                'data_a': [
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
                            'total_prc': {
                                '$sum': '$prn'
                            }
                        }
                    },
                    {
                        '$project': {
                            'x': '$_id',
                            'y': '$total_prc',
                            'label': 'magic_mirror_income',
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
            '$project': {
                'income': { '$sum': '$data_a.y' },
                'statistic': '$data_a',
            }
        },
    ]

    return query
}

module.exports = chart_magic_mirror