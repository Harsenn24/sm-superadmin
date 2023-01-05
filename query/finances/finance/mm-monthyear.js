const { ObjectID } = require("bson")
const { queryPagination } = require("../../../helper/pagination")
const { search_something } = require("../../../helper/search_regex")


function class_by_month(type, idDecrypt, search_year, page, item_limit) {

    let store_field = 0

    for (let i = 0; i < type.length; i++) {
        if (type[i] === 'member-onsite' || type[i] === 'member-offline') {
            store_field = { '_s': ObjectID(idDecrypt) }
        } else if (type[i] === 'apps') {
            store_field = {}
        } else {
            store_field = { 'cld._s': ObjectID(idDecrypt) }
        }

    }
    
    const query = queryPagination(
        [

            {
                '$match': {
                    '$and': [
                        store_field,
                        { 'pym.sts': 'settlement' },
                        { 'src': { '$in': type } }
                    ]
                }
            },
            {
                '$project': {
                    'month_year': {
                        '$dateToString': {
                            'date': { '$toDate': { '$multiply': ['$ep', 1000] } },
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
            },
            {
                '$match': search_something('_id', search_year)
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

module.exports = class_by_month