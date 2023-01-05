const { ObjectID } = require("bson")
const { encrypt } = require("../../../helper/enkrip_id")
const { queryPagination } = require("../../../helper/pagination")
const { search_something } = require("../../../helper/search_regex")
const rt_link = process.env.rt_link


function count_admin_voucher(time_start, time_end) {

    let query = [
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

            },
        }
    ]

    return query
}

function count_admin_product(time_start, time_end) {

    let query = [
        {
            '$sort': { '_id': -1 }
        },
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
                        '$sort': { '_id': -1 }
                    },
                    {
                        '$project': {
                            'seller': '$det.nms'
                        }
                    }
                ]
            }
        },
        {
            '$addFields': {
                'sellerName': { '$ifNull': [{ '$first': '$st.seller' }, '-'] },
                'idSeller': { '$ifNull': [{ '$first': '$st._id' }, '-'] },
            }
        },
        {
            '$group': {
                '_id': '$idSeller',
                'seller': { '$first': '$sellerName' },

            }
        },
    ]

    return query
}

module.exports = {count_admin_product, count_admin_voucher}