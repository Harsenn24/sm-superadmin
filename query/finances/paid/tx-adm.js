const { encrypt } = require("../../../helper/enkrip_id")
const { queryPagination } = require("../../../helper/pagination")
const { mon_fee } = require("../../../helper/count")
const { search_something } = require("../../../helper/search_regex")

function tax_admin_list(time_start, time_end, rt_link, search_store, page, item_limit) {
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
                                    { 'ep': { '$lte': time_start } },
                                    { 'ep': { '$gte': time_end } },
                                    { 'pym.sts': 'settlement' },
                                    { 'shp.sts': 'settlement' },
                                ]
                            }
                        },
                        {
                            '$project': {
                                'fee': mon_fee(),
                                'pph': '$mon.pph',
                                'ppn': '$mon.ppn'
                            }
                        }
                    ]
                }
            },
            {
                '$addFields': {
                    'pym_fee': { '$ifNull': [{ '$sum': '$payment.fee' }, { '$toInt': '0' }] },
                    'pym_pph': { '$ifNull': [{ '$sum': '$payment.pph' }, { '$toInt': '0' }] },
                    'pym_ppn': { '$ifNull': [{ '$sum': '$payment.ppn' }, { '$toInt': '0' }] },
                }
            },
            {
                '$lookup': {
                    'from': 'sys_vouchers',
                    'as': 'vouchers',
                    'localField': '_id',
                    'foreignField': '_s',
                    'pipeline': [
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
                            '$project': {
                                'fee': mon_fee(),
                                'pph': '$mon.pph',
                                'ppn': { '$toInt': '0' }
                            }
                        }
                    ]
                }
            },
            {
                '$addFields': {
                    'vch_fee': { '$ifNull': [{ '$sum': '$vouchers.fee' }, { '$toInt': '0' }] },
                    'vch_pph': { '$ifNull': [{ '$sum': '$vouchers.pph' }, { '$toInt': '0' }] },
                    'vch_ppn': { '$ifNull': [{ '$sum': '$vouchers.ppn' }, { '$toInt': '0' }] },
                }
            },
            {
                '$addFields': {
                    'pph': { '$add': ['$pym_pph', '$vch_pph'] },
                    'ppn': { '$add': ['$pym_ppn', '$vch_ppn'] },
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
                    'total': { '$add': ['$pph', '$ppn', '$vch_fee', '$pym_fee'] }
                }
            },
            {
                '$match': search_something('store_name', search_store)
            },
            {
                '$sort': { 'total': -1 }
            }
        ],
        [
            {
                '$project': {
                    'store_name': '$store_name',
                    'store_image': { '$concat': [`${rt_link}store/i/`, { '$toString': '$storeId' }] },
                    'admin_produk': '$pym_fee',
                    'admin_voucher': '$vch_fee',
                    'ppn': '$ppn',
                    'pph': '$pph',
                    '_id': '$storeId'
                }
            },
        ], page, 3, item_limit
    )

    return query
}

module.exports = { tax_admin_list }