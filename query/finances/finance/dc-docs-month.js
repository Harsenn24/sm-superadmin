const { ObjectID } = require("bson")
const { queryPagination } = require("../../../helper/pagination")

function doctor_list_month(idDecrypt, page, item_limit) {
    const query = queryPagination(
        [
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
                        { '_s': ObjectID(idDecrypt) },
                        { 'pym.sts': 'settlement' },
                    ]
                }
            },
            {
                '$project': {
                    'month_year': {
                        '$dateToString': {
                            'date': { '$toDate': { '$multiply': ['$date_id', 1000] } },
                            'format': '%m-%Y',
                            'onNull': '2020-01'
                        }
                    },
                }
            },
            {
                '$group': {
                    '_id': '$month_year'
                }
            },
            {
                '$sort': { '_id': -1 }
            }
        ],
        [
            {
                '$project': {
                    'month_year': '$_id',
                    'label': 'month-year',
                    '_id': 0
                }
            }
        ], page, 3, item_limit
    )

    return query
}

module.exports = { doctor_list_month }