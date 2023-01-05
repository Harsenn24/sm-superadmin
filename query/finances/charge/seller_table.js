const { encrypt } = require("../../../helper/enkrip_id")
const { queryPagination } = require("../../../helper/pagination")
const { search_something } = require("../../../helper/search_regex")

function seller_table(time_start, time_end,  page, item_limit, search_store, rt_link) {
    let query = queryPagination(
        [
            {
                '$lookup': {
                    'from': 'sys_payment',
                    'as': 'pym',
                    'localField': '_id',
                    'foreignField': '_s',
                    'pipeline': [
                        {
                            '$match': {
                                '$and': [
                                    { 'ep': { '$lte': time_start } },
                                    { 'ep': { '$gte': time_end } },
                                    { 'pym.sts': 'settlement' },
                                    { 'shp.sts': 'settlement' },
                                ]
                            }
                        },
                        {
                            '$project': {
                                'ship': '$mon.tlo',
                                '_id': 0
                            }
                        }
                    ]
                }
            },
            {
                '$addFields': {
                    'storeId': {
                        '$function': {
                            'body': encrypt,
                            'args': [{ '$toString': '$_id' }, 12],
                            'lang': 'js'
                        }
                    },
                    'storeName': '$det.nms',
                    'shipping_store': { '$ifNull': [{ '$sum': '$pym.ship' }, '-'] },
                }
            },
            {
                '$match': search_something('storeName', search_store)
            },
            {
                '$sort': { 'shipping_store': -1 }
            }
        ],
        [
            {
                '$project': {
                    'store_name': '$storeName',
                    'store_image': { '$concat': [`${rt_link}store/i/`, { '$toString': '$storeId' }] },
                    'ship': '$shipping_store',
                    '_id': '$storeId'
                }
            }
        ], page, 3, item_limit
    )

    return query
}

module.exports = { seller_table }