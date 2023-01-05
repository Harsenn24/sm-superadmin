const { mon_fee } = require("../../../helper/count")

function doctor_chart_detail(time_start, time_end) {
    const query = [
        {
            '$addFields': {
                'date_id': { '$toDecimal': { '$toDate': '$_id' } }
            }
        },
        {
            '$addFields': {
                'date_id': { '$round': [{ '$divide': ['$date_id', 1000] }, 4] },
                'net_income': mon_fee()
            }
        },
        {
            '$match': {
                '$and': [
                    { 'date_id': { '$lte': time_start } },
                    { 'date_id': { '$gte': time_end } }
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
                }
            }
        },
        {
            '$group': {
                '_id': '$date',
                'income': { '$sum': '$net_income' },
            }
        },
        {
            '$project': {
                'x': '$_id',
                'y': '$income',
                'label': 'Net Income',
                '_id': 0
            }
        },
        {
            '$sort': { 'x': 1 }
        }
    ]

    return query
}

module.exports = doctor_chart_detail