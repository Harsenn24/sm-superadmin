const { encrypt } = require("../../../helper/enkrip_id")
const { queryPagination } = require("../../../helper/pagination")
const { search_something } = require("../../../helper/search_regex")

function seller_income_mm() {
    let query = queryPagination(
        [
            {
                '$lookup': {
                    'from': 'sys_subscribe',
                    'localField': '_id',
                    'foreignField': 'cld._s',
                    'pipeline': [
                        {
                            '$match': {
                                '$and': [
                                    { 'ep': { $lte: time_start } },
                                    { 'ep': { $gte: time_end } },
                                    { 'pym.sts': 'settlement' }
                                ]
                            }
                        },
                        {
                            '$project': {
                                'income': '$mon.clm',
                            }
                        }
                    ],
                    'as': 'data_magic_mirror'
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
                    'total_income': { '$ifNull': [{ '$sum': '$data_magic_mirror.income' }, { '$toInt': '0' }] }
                }
            },
            {
                '$sort': { 'total_income': -1 }
            },
            {
                '$match': search_something('store_name', search_store)
            }
        ],
        [
            {
                '$project': {
                    '_id': '$store_id',
                    'store_name': '$store_name',
                    'store_image': { '$concat': [`${rt_link}store/i/`, { '$toString': '$store_id' }] },
                    'total_income': '$total_income'

                }
            }
        ], page, 3, item_limit
    )

    return query
}

module.exports = { seller_income_mm }