const { encrypt } = require("../../../helper/enkrip_id")
const { queryPagination } = require("../../../helper/pagination")
const { search_something } = require("../../../helper/search_regex")

function penalty_list(search_store, page, item_limit, rt_link) {
    let query = queryPagination(
        [
            {
                '$lookup': {
                    'from': 'rcd_stores_penalty',
                    'as': 'record',
                    'localField': '_id',
                    'foreignField': '_s',
                    'pipeline': [
                        {
                            '$addFields': {
                                'total': { '$sum': 1 },
                            }
                        },
                        {
                            '$project': {
                                'amount': { '$sum': '$amm' },
                                'total_penalty': { '$sum': '$total' }
                            }
                        }
                    ]
                }
            },
            {
                '$addFields': {
                    'store_id': {
                        '$function': {
                            'body': encrypt,
                            'args': [{ '$toString': '$_id' }, 12],
                            'lang': 'js'
                        }
                    },
                    'amount': { '$ifNull': [{ '$sum': '$record.amount' }, { '$toInt': '0' }] },
                    'total_penalty': { '$ifNull': [{ '$sum': '$record.total_penalty' }, { '$toInt': '0' }] },
                    'store_name': {
                        '$reduce': {
                            'input': '$det.nme',
                            'initialValue': '',
                            'in': {
                                '$concat': [
                                    '$$value',
                                    { '$cond': [{ '$eq': ['$$value', ''] }, '', ' '] },
                                    '$$this'
                                ]
                            }
                        }
                    },
                }
            },
            {
                '$sort': { 'total_penalty': -1 }
            },
            {
                '$match': search_something('store_name', search_store)
            }
        ],
        [
            {
                '$project': {
                    'id_store': '$store_id',
                    'store_image': { '$concat': [`${rt_link}store/i/`, { '$toString': '$store_id' }] },
                    'store_name': '$store_name',
                    'total_penalty': '$total_penalty',
                    'total_amount': '$amount',
                    '_id': 0
                }
            }
        ], page, 3, item_limit
    )

    return query
}

module.exports = { penalty_list }