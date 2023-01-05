const { ObjectID } = require("bson")
const { queryPagination } = require("../../../helper/pagination")
const { search_something } = require("../../../helper/search_regex")

function seller_income_mm_time() {
    let query = queryPagination(
        [
            {
                $match: {
                    $and: [
                        { 'src': 'member-online' },
                        { 'pym.sts': 'settlement' },
                        { 'cld._s': ObjectID(idDecrypt) }
                    ]
                }
            },
            {
                $addFields: {
                    'date': {
                        '$dateToString': {
                            'date': { '$toDate': { '$multiply': ['$ep', 1000] } },
                            'format': '%m-%Y',
                            'onNull': '2020-01-01'
                        }
                    },
                }
            },
            {
                $group: {
                    '_id': '$date',
                }
            },
            {
                $sort: { '_id': -1 }
            },
            {
                $match: search_something('_id', search_time)
            }
        ],
        [
            {
                '$project': {
                    month_year: '$_id',
                    label: 'month-year',
                    _id: 0
                }
            }
        ], page, 3, item_limit
    )

    return query
}

module.exports = { seller_income_mm_time }