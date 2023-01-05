const { encrypt } = require("../../../helper/enkrip_id")
const { queryPagination } = require("../../../helper/pagination")
const { mon_fee } = require("../../../helper/count")
const { ObjectID } = require("bson")


function tax_admin_voucher(idDecrypt, page, item_limit) {
    let query = queryPagination(
        [
            {
                '$match': {
                    '$and': [
                        { '_s': ObjectID(idDecrypt) },
                        { 'pym.sts': 'settlement' }
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
        ],
        [
            {
                '$project': {
                    'fee': mon_fee(),
                    'pph': '$mon.pph',
                    'ppn': '$mon.ppn',
                    'order_id': '$order_id',
                    '_id': 0,
                    'label': 'voucher'
                }
            }
        ], page, 3, item_limit
    )

    return query
}


function tax_admin_product(idDecrypt, page, item_limit) {
    let query = queryPagination(
        [
            {
                '$match': {
                    '$and': [
                        { '_s': ObjectID(idDecrypt) },
                        { 'pym.sts': 'settlement' },
                        { 'shp.sts': 'settlement' },

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

        ],
        [
            {
                '$project': {
                    'fee': mon_fee(),
                    'pph': '$mon.pph',
                    'ppn': '$mon.ppn',
                    'order_id': '$order_id',
                    '_id': 0,
                    'label': 'product'

                }
            }
        ], page, 3, item_limit
    )

    return query
}

module.exports = { tax_admin_voucher, tax_admin_product  }