const { ObjectID } = require("bson")
const { queryPagination } = require("../../../helper/pagination")

function tax_magicmirror_monthyear(idDecrypt, page, item_limit, source) {

    let match_store = 0

    for (let i = 0; i < source.length; i++) {
        if (source[i] === 'member-onsite' || source[i] === 'member-offline') {
            match_store = { '_s': ObjectID(idDecrypt) }
        } else {
            match_store = { 'cld._s': ObjectID(idDecrypt) }
        }

    }

    let query = queryPagination(
        [
            {
                '$match': {
                    '$and': [
                        match_store,
                        { 'pym.sts': 'settlement' },
                        { 'src': { '$in': source } }
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

module.exports = { tax_magicmirror_monthyear }