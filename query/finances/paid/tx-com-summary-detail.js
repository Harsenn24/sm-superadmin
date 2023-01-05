const { mon_fee } = require("../../../helper/count")
const { encrypt } = require("../../../helper/enkrip_id")
const { queryPagination } = require("../../../helper/pagination")
const { search_something } = require("../../../helper/search_regex")
const { ObjectID } = require("bson")


function tax_com_summmary_detail(storeDecrypt, doctorDecrypt, page, item_limit, search_invoice) {
    let query = queryPagination(
        [
            {
                '$match': {
                    '$and': [
                        { '_s': ObjectID(storeDecrypt) },
                        { '_d': ObjectID(doctorDecrypt) },
                    ]
                }
            },
            {
                '$addFields': {
                    'idInvoice': {
                        '$function': {
                            'body': encrypt,
                            'args': [{ '$toString': '$_id' }, 12],
                            'lang': 'js'
                        }
                    }
                }
            },
            {
                '$match': search_something('idInvoice', search_invoice)
            }
        ],
        [
            {
                '$project': {
                    '_id': '$idInvoice',
                    'commission': mon_fee(),
                    'ppn': '$mon.ppn',
                    'pph': '$mon.pph',
                    'invoice': '$inv',
                    'order_id': { '$toUpper': '$idInvoice' }
                }
            }
        ], page, 3, item_limit
    )

    return query
}

module.exports = { tax_com_summmary_detail }