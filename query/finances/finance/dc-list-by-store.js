const { mon_fee } = require("../../../helper/count")
const { encrypt } = require("../../../helper/enkrip_id")
const { queryPagination } = require("../../../helper/pagination")

function doctor_list_by_store(time_start, time_end, page, item_limit, rt_link) {
    const query = queryPagination(
        [
            {
                '$addFields': {
                    'date_id': { '$toDecimal': { '$toDate': '$_id' } },
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
                '$addFields': {
                    'date_id': { '$round': [{ '$divide': ['$date_id', 1000] }, 4] },
                    'store_image': { '$concat': [`${rt_link}store/i/`, { '$toString': '$storeId' }] },
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
                                'seller': '$det.nms',
                            }
                        }
                    ]
                }
            },
            {
                '$unwind': {
                    'path': '$st'
                }
            },
            {
                '$addFields': {
                    'store_name': '$st.seller',

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
                '$group': {
                    '_id': '$storeId',
                    'store_name': { '$first': '$store_name' },
                    'store_image': { '$first': '$store_image' },
                    'selling_accu': { '$sum': '$mon.amm' },
                    'income_accu': { '$sum': mon_fee() },
                }
            }
        ],
        [


            {
                '$project': {
                    'store_name': '$store_name',
                    'store_image': '$store_image',
                    'selling_accu': '$selling_accu',
                    'income_accu': '$income_accu',
                }
            }
        ], page, 3, item_limit
    )

    return query
}

module.exports = { doctor_list_by_store }