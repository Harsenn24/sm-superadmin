const { encrypt } = require("../../../helper/enkrip_id")
const { queryPagination } = require("../../../helper/pagination")
const { search_something } = require("../../../helper/search_regex")

function return_list_detail() {
    let query = queryPagination(
        [
            {
                '$match': {
                    '$and': [
                        { 'pym.sts': 'refund-pending' },
                        { 'shp.sts': 'returned' },
                        { '_s': ObjectID(idDecrypt) }
                    ]
                }
            },
            {
                '$addFields': {
                    'order_id': {
                        '$function': {
                            'body': encrypt,
                            'args': [{ '$toString': '$_id' }, 12],
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
                    'reason': '$isc.rsn',
                    'amount': '$mon.amm',
                    'delivery_service': { '$ifNull': ['$isc.shp.chn', '-'] },
                    '_id': 0
                }
            }
        ], page, 3, item_limit
    )

    return query
}

module.exports = { return_list_detail }