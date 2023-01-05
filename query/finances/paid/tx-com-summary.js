const { mon_fee } = require("../../../helper/count")
const { encrypt } = require("../../../helper/enkrip_id")
const { queryPagination } = require("../../../helper/pagination")
const { search_something } = require("../../../helper/search_regex")
const { ObjectID } = require("bson")


function tax_com_summmary(idDecrypt, page, item_limit, search_doctor, rt_link) {
    let query = queryPagination(
        [
            {
                '$match': { '_s': ObjectID(idDecrypt) }
            },
            {
                '$lookup': {
                    'from': 'doctors',
                    'localField': '_d',
                    'foreignField': '_id',
                    'pipeline': [
                        {
                            '$addFields': {
                                'doctor_id': {
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
                                'full_name': {
                                    '$reduce': {
                                        'input': '$dat.fln',
                                        'initialValue': '',
                                        'in': {
                                            '$concat': [
                                                '$$value',
                                                { '$cond': [{ '$eq': ['$$value', ''] }, '', ' '] },
                                                '$$this']
                                        }
                                    }
                                },
                                '_id': '$doctor_id',
                                'doctor_avatar': { '$concat': [`${rt_link}doctor/chat/embed/avatar/`, '$doctor_id'] },
                            }
                        },
                    ],
                    'as': 'doctors'
                }
            },
            {
                '$unwind': { 'path': '$doctors' }
            },
            {
                '$group': {
                    '_id': '$doctors._id',
                    'commission': { '$sum': mon_fee() },
                    'pph': { '$sum': '$mon.pph' },
                    'ppn': { '$sum': '$mon.ppn' },
                    'name': { '$first': '$doctors.full_name' },
                    'doctor_avatar': { '$first': '$doctors.doctor_avatar' },
                }
            },
            {
                '$match': search_something('name', search_doctor)
            }
        ],
        [], page, 3, item_limit
    )

    return query
}

module.exports = { tax_com_summmary }