const { encrypt } = require("../../../helper/enkrip_id")
const { ObjectID } = require("bson")
const { queryPagination } = require("../../../helper/pagination")
const { search_something } = require("../../../helper/search_regex")

function tax_magicmirror_monthyear_list(idDecrypt, type, time, search_id, page, item_limit, source) {

    let store_field = 0

    for (let i = 0; i < source.length; i++) {
        if (source[i] === 'member-onsite' || source[i] === 'member-offline') {
            store_field = { '_s': ObjectID(idDecrypt) }
        } else {
            store_field = { 'cld._s': ObjectID(idDecrypt) }
        }

    }


    let query = queryPagination(
        [
            {
                '$addFields': {
                    'month_year': {
                        '$dateToString': {
                            'date': { '$toDate': { '$multiply': ['$ep', 1000] } },
                            'format': '%m-%Y',
                            'onNull': '2020-01'
                        }
                    },
                    'invoice': '$inv',
                    'id_subs': {
                        '$function': {
                            'body': encrypt,
                            'args': [{ '$toString': '$_id' }, 12],
                            'lang': 'js'
                        }
                    },

                }
            },
            {
                '$match': {
                    '$and': [
                        store_field,
                        { 'pym.sts': 'settlement' },
                        { 'typ': type },
                        { 'src': { '$in': source } },
                        { 'month_year': time },
                        search_something('invoice', search_id)
                    ]
                }
            },
        ],
        [
            {
                '$project': {
                    'income': '$prn',
                    'ppn': '$mon.ppn',
                    'commission': '$mon.clm',
                    'invoice': '$invoice',
                    '_id': '$id_subs'
                }
            }
        ], page, 3, item_limit
    )

    return query
}

module.exports = { tax_magicmirror_monthyear_list }