const { mon_fee } = require("../../../helper/count")
const { encrypt } = require("../../../helper/enkrip_id")
const { queryPagination } = require("../../../helper/pagination")
const { search_something } = require("../../../helper/search_regex")

function tax_com_list(time_start, time_end, page, item_limit, search_store, rt_link) {
    let query =  queryPagination(
        [
            {
                '$addFields': {
                    'date_id': { '$toDecimal': { '$toDate': '$_id' } }
                }
            },
            {
                '$addFields': {
                    'date_id': { '$round': [{ '$divide': ['$date_id', 1000] }, 4] },
                    'storeId': {
                        '$function': {
                            'body': encrypt,
                            'args': [{ '$toString': '$_s' }, 12],
                            'lang': 'js'
                        }
                    },
                }
            },
            {
                '$match': {
                    '$and': [
                        { 'date_id': { '$lte': time_start } },
                        { 'date_id': { '$gte': time_end } },
                        { 'pym.sts': 'settlement' }
                    ]
                }
            },
            {
                '$lookup': {
                    'from': 'stores',
                    'as': 'st',
                    'foreignField': '_id',
                    'localField': '_s',
                    'let': {
                        'idStore': '$storeId'
                    },
                    'pipeline': [
                        {
                            '$project': {
                                'storeName': '$det.nms',
                                'store_image': { '$concat': [`${rt_link}store/i/`, { '$toString': '$$idStore' }] },
                            }
                        }
                    ]
                }
            },
            {
                '$addFields': {
                    'store_name': { '$first': '$st.storeName' },
                    'store_image': { '$first': '$st.store_image' },

                }
            },
            {
                '$group': {
                    '_id': '$storeId',
                    'total_commission': { '$sum': mon_fee() },
                    'ppn': { '$sum': '$mon.ppn' },
                    'pph': { '$sum': '$mon.pph' },
                    'store_name': { '$first': '$store_name' },
                    'store_image': { '$first': '$store_image' },
                }
            },
            {
                '$match': search_something('store_name', search_store)
            },
            {
                '$sort': { 'total_commission': -1 }
            }
        ],
        [
            {
                '$project': {
                    '_id': '$_id',
                    'total_commission': '$total_commission',
                    'ppn': '$ppn',
                    'pph': '$pph',
                    'store_name': '$store_name',
                    'store_image': '$store_image',
                }
            }
        ], page, 3, item_limit
    )

    return query
}

module.exports = { tax_com_list }