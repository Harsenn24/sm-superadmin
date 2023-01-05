const { encrypt } = require("../../../helper/enkrip_id")
const { queryPagination } = require("../../../helper/pagination")
const rt_link = process.env.rt_link


function admin_product_query(time_start, time_end, page, item_limit) {

    const query = queryPagination(
        [
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
                '$lookup': {
                    'from': 'stores',
                    'localField': '_s',
                    'foreignField': '_id',
                    'as': 'st',
                    'pipeline': [
                        {
                            '$addFields': {
                                'storeId': {
                                    '$function': {
                                        'body': encrypt,
                                        'args': [{ '$toString': '$_id' }, 12],
                                        'lang': 'js'
                                    }
                                },
                            }
                        },
                        {
                            '$project': {
                                'seller': '$det.nms',
                                'store_image': { '$concat': [`${rt_link}store/i/`, { '$toString': '$storeId' }] },
                            }
                        }
                    ]
                }
            },
            {
                '$addFields': {
                    'sellerName': { '$ifNull': [{ '$first': '$st.seller' }, '-'] },
                    'idSeller': { '$ifNull': [{ '$first': '$st._id' }, '-'] },
                    'store_image': { '$ifNull': [{ '$first': '$st.store_image' }, '-'] },

                }
            },
            {
                '$group': {
                    '_id': '$idSeller',
                    'seller': { '$first': '$sellerName' },
                    'store_image': { '$first': '$store_image' },
                    'akumulasi_selling': { '$sum': '$mon.tot' },
                    'akumulasi_income': { '$sum': '$mon.fen' },

                }
            },
            {
                '$sort': { 'akumulasi_selling': -1 }
            }
        ],
        [
            {
                '$project': {
                    '_id': {
                        '$function': {
                            'body': encrypt,
                            'args': [{ '$toString': '$_id' }, 12],
                            'lang': 'js'
                        }
                    },
                    'store': '$seller',
                    'store_image': '$store_image',
                    'selling_accumulation': '$akumulasi_selling',
                    'income_accumulation': '$akumulasi_income',
                    'label': 'product'
                }
            }

        ], page, 3, item_limit
    )

    return query
}


function admin_voucher_query(time_start, time_end, page, item_limit) {
    const query = queryPagination(
        [
            {
                '$sort': { '_id': -1 }
            },
            {
                '$match': {
                    '$and': [
                        { 'ep': { '$lte': time_start } },
                        { 'ep': { '$gte': time_end } },
                        { 'pym.sts': 'settlement' },
                    ]
                }
            },
            {
                '$lookup': {
                    'from': 'stores',
                    'localField': '_s',
                    'foreignField': '_id',
                    'as': 'st',
                    'pipeline': [
                        {
                            '$sort': { '_id': -1 }
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
                            }
                        },
                        {
                            '$project': {
                                'seller': '$det.nms',
                                'store_image': { '$concat': [`${rt_link}store/i/`, { '$toString': '$storeId' }] },
                            }
                        }
                    ]
                }
            },
            {
                '$addFields': {
                    'sellerName': { '$ifNull': [{ '$first': '$st.seller' }, '-'] },
                    'store_image': { '$ifNull': [{ '$first': '$st.store_image' }, '-'] },
                    'idSeller': { '$ifNull': [{ '$first': '$st._id' }, '-'] },
                }
            },
            {
                '$group': {
                    '_id': '$idSeller',
                    'seller': { '$first': '$sellerName' },
                    'store_image': { '$first': '$store_image' },
                    'akumulasi_selling': { '$sum': '$prc' },
                    'akumulasi_income': { '$sum': '$mon.fen' },
                }
            },
            {
                '$sort': { 'akumulasi_selling': -1 }
            }
        ],
        [
            {
                '$project': {
                    '_id': {
                        '$function': {
                            'body': encrypt,
                            'args': [{ '$toString': '$_id' }, 12],
                            'lang': 'js'
                        }
                    },
                    'store': '$seller',
                    'store_image': '$store_image',
                    'selling_accumulation': '$akumulasi_selling',
                    'income_accumulation': '$akumulasi_income',
                    'label': 'voucher'
                }
            }
        ], page, 3, item_limit
    )

    return query
}

module.exports = { admin_product_query, admin_voucher_query }