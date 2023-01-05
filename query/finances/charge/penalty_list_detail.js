const { encrypt } = require("../../../helper/enkrip_id")
const { queryPagination } = require("../../../helper/pagination")
const { search_something } = require("../../../helper/search_regex")

function penalty_list_detail(idDecrypt, search_id, page, item_limit) {
    let query = queryPagination(
        [
            {
                '$match': { '_s': ObjectID(idDecrypt) }
            },
            {
                '$addFields': {
                    'order_id': {
                        '$function': {
                            'body': encrypt,
                            'args': [{ '$toString': '$_py' }, 12],
                            'lang': 'js'
                        }
                    },
                }
            },
            {
                '$sort': { '_id': -1 }
            },
            {
                '$match': search_something('order_id', search_id)
            },
        ],
        [
            {
                '$project': {
                    'order_id': '$order_id',
                    'reason': '$rsn',
                    'amount': '$amm',
                    '_id': 0
                }
            }
        ], page, 3, item_limit
    )

    return query
}

module.exports = { penalty_list_detail }