const { mon_fen } = require("../../../helper/count")

function doctor_consult_chart(time_start, time_end) {
    const query = [
        {
            '$limit': 1
        },
        {
            '$lookup': {
                'from': 'sys_doctors',
                'as': 'di',
                'pipeline': [
                    {
                        '$addFields': {
                            'date_id': { '$toDecimal': { '$toDate': '$_id' } }
                        }
                    },
                    {
                        '$addFields': {
                            'date_id': { '$round': [{ '$divide': ['$date_id', 1000] }, 4] },
                        }
                    },
                    {
                        '$match': {
                            '$and': [
                                { 'date_id': { '$lte': time_start } },
                                { 'date_id': { '$gte': time_end } },
                                { 'pym.sts': 'settlement' }
                            ]
                        }
                    },
                    {
                        '$addFields': {
                            'date': {
                                '$dateToString': {
                                    'date': { '$toDate': { '$multiply': ['$date_id', 1000] } },
                                    'format': '%Y-%m-%d',
                                    'onNull': '2020-01-01'
                                }
                            },
                            'income': mon_fen()
                        }
                    },
                    {
                        '$group': {
                            '_id': '$date',
                            'total': { '$sum': '$income' }
                        }
                    },
                    {
                        '$project': {
                            'x': '$_id',
                            'y': '$total',
                            '_id': 0
                        }
                    }
                ]
            }
        },
        {
            '$project': {
                '_id': 0,
                'income': { '$sum': '$di.y' },
                'statistic': '$di'
            }
        }
    ]

    return query
}

module.exports = doctor_consult_chart