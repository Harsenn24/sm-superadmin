const { encrypt } = require("../../../helper/enkrip_id")
const { queryPagination } = require("../../../helper/pagination")
const { search_something } = require("../../../helper/search_regex")

function return_list(search_store, page, item_limit, rt_link) {
    let query = queryPagination(
        [
            {
                '$lookup': {
                    'from': 'sys_payment',
                    'as': 'payment',
                    'localField': '_id',
                    'foreignField': '_s',
                    'pipeline': [
                        {
                            '$match': {
                                '$and': [
                                    { 'pym.sts': 'refund-pending' },
                                    { 'shp.sts': 'returned' }
                                ]
                            }
                        },
                        {
                            '$addFields': {
                                'total': { '$sum': 1 },
                            }
                        },
                        {
                            '$project': {
                                'amount': { '$sum': '$mon.amm' },
                                'total_return': { '$sum': '$total' }
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
                    'amount': { '$ifNull': [{ '$sum': '$payment.amount' }, { '$toInt': '0' }] },
                    'total_return': { '$ifNull': [{ '$sum': '$payment.total_return' }, { '$toInt': '0' }] },
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
                '$sort': { 'total_return': -1 }
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
                    'total_return': '$total_return',
                    'total_amount': '$amount',
                    '_id': 0
                }
            }
        ], page, 3, item_limit
    )

    return query
}

module.exports = { return_list }