const { jsonData } = require("../middleware/sucess")
const { Doctor, Config } = require("../model")
const { encrypt, decrypt } = require("../helper/enkrip_id");
const { ObjectID } = require("bson");
const { date2number } = require("../helper/date2number");
const { rt_link, rt_link_v3 } = process.env


class SkinBeautyController {

    static async table_skinBeauty(req, res) {
        try {
            let findTable = true

            const { bex } = req.query

            if (bex === '1') {
                findTable = false
            } else {
                findTable = true
            }

            const table_skinBeauty = await Doctor.aggregate([
                {
                    '$sort': { '_id': -1 }
                },
                {
                    '$match': { 'doc.isd': findTable }
                },
                {
                    '$lookup': {
                        'from': 'doctors_chats',
                        'localField': '_id',
                        'foreignField': '_d',
                        'pipeline': [
                            {
                                '$sort': { '_id': -1 }
                            },
                            {
                                '$count': 'total'
                            },
                        ],
                        'as': 'dc'
                    }
                },
                {
                    '$addFields': {
                        'jumlah_konsul': { '$ifNull': [{ '$first': '$dc.total' }, '-'] },
                        'fullName': {
                            '$reduce': {
                                'input': '$dat.fln',
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
                    }
                },
                {
                    '$lookup': {
                        'from': 'stores',
                        'localField': '_s',
                        'foreignField': '_id',
                        'pipeline': [
                            {
                                '$sort': { '_id': -1 }
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
                                }
                            },
                            {
                                '$project': {
                                    'storeName': '$det.nms',
                                    'store_image': { '$concat': [`${rt_link}store/i/`, { '$toString': '$store_id' }] },
                                    '_id': 0
                                }
                            },
                        ],
                        'as': 'st'
                    }
                },
                {
                    '$project': {
                        'full_name': '$fullName',
                        'spesialisasi': '$doc.fld',
                        'jumlah_konsul': '$jumlah_konsul',
                        'harga': { '$ifNull': ['$dyn.prc', { '$toInt': '0' }] },
                        'store_name': { '$ifNull': [{ '$first': '$st.storeName' }, '-'] },
                        'store_image': { '$ifNull': [{ '$first': '$st.store_image' }, '-'] },
                        '_id': 0
                    }
                }
            ])
            res.status(200).json(jsonData(table_skinBeauty))
        } catch (error) {
            console.log(error);
        }
    }

    static async detailDocs(req, res, next) {
        try {
            const { id } = req.params
            console.log(id);
            const detailDocs = await Doctor.aggregate([
                {
                    '$sort': { '_id': -1 }
                },
                {
                    '$match': { '_id': ObjectID(id) }
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
                                    'store_id': {
                                        '$function': {
                                            'body': encrypt,
                                            'args': [{ '$toString': '$_id' }, 12],
                                            'lang': 'js'
                                        }
                                    }
                                }
                            },
                            {
                                '$project': {
                                    'store_image': { '$concat': [`${rt_link}store/i/`, { '$toString': '$store_id' }] },
                                    'store_name': '$det.nms',
                                    '_id': 0
                                }
                            }
                        ]
                    }
                },
                {
                    '$lookup': {
                        'from': 'sys_doctors',
                        'localField': '_id',
                        'foreignField': '_d',
                        'as': 'sd',
                        'pipeline': [
                            {
                                '$sort': { '_id': -1 }
                            },
                            {
                                '$addFields': {
                                    'incomesatuan': { '$ifNull': [{ '$subtract': ['$mon.fee', '$mon.ppn'] }, { '$toInt': '0' }] },
                                }
                            },
                            {
                                '$project': {
                                    'income': { '$sum': '$incomesatuan' },
                                    '_id': 0
                                }
                            }
                        ]
                    }
                },
                {
                    '$lookup': {
                        'from': 'doctors_chats',
                        'localField': '_id',
                        'foreignField': '_d',
                        'as': 'scc',
                        'pipeline': [
                            {
                                '$sort': { '_id': -1 }
                            },
                            {
                                '$facet': {
                                    'totalData': [
                                        {
                                            '$count': 'total'
                                        }
                                    ],
                                    'rating': [
                                        {
                                            '$addFields': {
                                                'rating': { '$ifNull': ['$scr', { '$toInt': '0' }] }
                                            }
                                        },
                                        {
                                            '$project': {
                                                'data': { '$sum': '$rating' },
                                                '_id': 0
                                            }
                                        }
                                    ],
                                    'review': [
                                        {
                                            '$project': {
                                                'command': { '$ifNull': ['$com', '-'] },
                                                'score': { '$ifNull': ['$scr', { '$toInt': '0' }] },
                                                '_id': 0,
                                                'date': {
                                                    '$dateToString': {
                                                        'date': { '$toDate': { '$multiply': ['$ep', 1000] } },
                                                        'format': '%Y-%m-%d',
                                                        'onNull': '2020-01-01'
                                                    }
                                                },
                                            }
                                        }
                                    ]
                                }
                            },
                            {
                                '$addFields': {
                                    'totalConsul': { '$ifNull': [{ '$first': '$totalData.total' }, { '$toInt': '0' }] },
                                    'totalRating': { '$sum': '$rating.data' },
                                }
                            },
                            {
                                '$project': {
                                    'totalConsul': '$totalConsul',
                                    'rating': { '$round': [{ '$divide': ['$totalRating', '$totalConsul'] }, 2] },
                                    'review': '$review'
                                }
                            }
                        ]
                    }
                },
                {
                    '$project': {
                        '_id': 0,
                        'name': {
                            '$reduce': {
                                'input': '$dat.fln',
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
                        'specialist': '$doc.fld',
                        'gender': {
                            '$cond': {
                                'if': { '$eq': ['$dat.sex', 'M'] },
                                'then': 'Male',
                                'else': {
                                    '$cond': {
                                        'if': { '$eq': ['$dat.sex', 'F'] },
                                        'then': 'Female',
                                        'else': '-'
                                    }
                                }
                            }
                        },
                        'working-hours': ['$dyn.iso.hws', '$dyn.iso.hwe'],
                        'price': { '$ifNull': ['$dyn.prc', 0] },
                        'store_name': { '$first': '$st.store_name' },
                        'store_image': { '$first': '$st.store_image' },
                        'rating': { '$first': '$scc.rating' },
                        'total_consul': { '$first': '$scc.totalConsul' },
                        'income': { '$ifNull': [{ '$first': '$sd.income' }, { '$toInt': '0' }] },
                        'review': { '$first': '$scc.review' },
                        'profile_pict': {
                            '$concat': [`${rt_link_v3}doctor/chat/embed/avatar/`, {
                                '$function': {
                                    'body': encrypt,
                                    'args': [{ '$toString': '$_id' }, 12],
                                    'lang': 'js'
                                }
                            }]
                        },
                        'email': {
                            '$function': {
                                'body': decrypt,
                                'args': [{ '$toString': '$dat.eml.val' }, 8],
                                'lang': 'js'
                            }
                        },
                        'phone': {
                            '$function': {
                                'body': decrypt,
                                'args': [{ '$toString': '$dat.phn.val' }, 8],
                                'lang': 'js'
                            }
                        },
                        'str': {
                            'number': { '$ifNull': ['$doc.str.num', '-'] },
                            'expired': {
                                '$dateToString': {
                                    'date': { '$toDate': { '$multiply': ['$doc.str.end', 1000] } },
                                    'format': '%Y-%m-%d',
                                    'onNull': '2020-01-01'
                                }
                            },
                        },
                        'sip': {
                            'number': { '$ifNull': ['$doc.sip.num', '-'] },
                            'expired': {
                                '$dateToString': {
                                    'date': { '$toDate': { '$multiply': ['$doc.sip.end', 1000] } },
                                    'format': '%Y-%m-%d',
                                    'onNull': '2020-01-01'
                                }
                            },
                        },

                    }
                }
            ])
            res.status(200).json(jsonData(detailDocs))
        } catch (error) {
            console.log(error);
            next(error)
        }
    }

    static async chartConsult(req, res, next) {
        try {
            let { time_start, time_end } = req.query

            let { id } = req.params

            if (!time_start) {
                throw { message: 'Start Date is required' }
            }

            if (!time_end) {
                throw { message: 'End Date is required' }
            }



            time_start = date2number(time_start)
            time_end = date2number(time_end)


            const chartConsult = await Config.aggregate([
                {
                    '$limit': 1
                },
                {
                    '$lookup': {
                        'from': 'doctors',
                        'as': 'dct',
                        'pipeline': [
                            {
                                '$sort': { '_id': -1 }
                            },
                            {
                                '$match': { '_id': ObjectID(id) }
                            },
                            {
                                '$lookup': {
                                    'from': 'doctors_chats',
                                    'as': 'dc',
                                    'pipeline': [
                                        {
                                            '$sort': { '_id': -1 }
                                        },
                                        {
                                            '$match': {
                                                '$and': [
                                                    { 'ep': { '$lte': time_start } },
                                                    { 'ep': { '$gte': time_end } }
                                                ]
                                            }
                                        },
                                        {
                                            '$addFields': {
                                                'date': {
                                                    '$dateToString': {
                                                        'date': { '$toDate': { '$multiply': ['$ep', 1000] } },
                                                        'format': '%Y-%m-%d',
                                                        'onNull': '2020-01-01'
                                                    }
                                                }
                                            }
                                        },
                                        {
                                            '$group': {
                                                '_id': '$date',
                                                'ratingTotal': { '$sum': '$scr' },
                                                'jumlahData': { '$sum': 1 }
                                            }
                                        },
                                        {
                                            '$project': {
                                                'x': '$_id',
                                                'y': { '$round': [{ '$divide': ['$ratingTotal', '$jumlahData'] }, 2] },
                                                '_id': 0
                                            }
                                        }
                                    ]
                                }
                            },

                        ]
                    }
                },
                {
                    '$project': {
                        'data': { '$first': '$dct.dc' },
                        '_id': 0
                    }
                }
            ])

            if (chartConsult.length === 0) {
                throw { message: 'Data not found' }
            }

            res.status(200).json(jsonData(chartConsult[0].data))
        } catch (error) {
            console.log(error);
            next(error)
        }
    }

    static async listConsult(req, res, next) {
        try {
            let { time_start, time_end, search } = req.query

            let { id } = req.params

            if (!time_start) {
                throw { message: 'Start Date is required' }
            }

            if (!time_end) {
                throw { message: 'End Date is required' }
            }

            time_start = date2number(time_start)
            time_end = date2number(time_end)

            let matchsearch

            if (search) {
                matchsearch = search
            } else {
                matchsearch = ''
            }

            const listConsult = await Config.aggregate([
                {
                    '$limit': 1
                },
                {
                    '$lookup': {
                        'from': 'doctors',
                        'as': 'dct',
                        'pipeline': [
                            {
                                '$sort': { '_id': -1 }
                            },
                            {
                                '$match': { '_id': ObjectID(id) }
                            },
                            {
                                '$lookup': {
                                    'from': 'doctors_chats',
                                    'as': 'dc',
                                    'pipeline': [
                                        {
                                            '$sort': { '_id': -1 }
                                        },
                                        {
                                            '$match': {
                                                '$and': [
                                                    { 'ep': { '$lte': time_start } },
                                                    { 'ep': { '$gte': time_end } }
                                                ]
                                            }
                                        },
                                        {
                                            '$facet': {
                                                'list': [
                                                    {
                                                        '$addFields': {
                                                            'date': {
                                                                '$dateToString': {
                                                                    'date': { '$toDate': { '$multiply': ['$ep', 1000] } },
                                                                    'format': '%Y-%m-%d',
                                                                    'onNull': '2020-01-01'
                                                                }
                                                            }
                                                        }
                                                    },
                                                    {
                                                        '$lookup': {
                                                            'from': 'users',
                                                            'localField': '_u',
                                                            'foreignField': '_id',
                                                            'as': 'us',
                                                            'pipeline': [
                                                                {
                                                                    '$project': {
                                                                        'name': {
                                                                            '$reduce': {
                                                                                'input': '$dat.fln',
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
                                                                        '_id': 0
                                                                    }
                                                                }
                                                            ]
                                                        }
                                                    },
                                                    {
                                                        '$project': {
                                                            'date': '$date',
                                                            'name': { '$ifNull': [{ '$first': '$us.name' }, '-'] },
                                                        }
                                                    },
                                                    {
                                                        '$sort': { 'date': 1 }
                                                    },
                                                    {
                                                        '$match': { 'name': { '$regex': matchsearch } }
                                                    }
                                                ]
                                            }
                                        },
                                        {
                                            '$project': {
                                                'list': '$list'
                                            }
                                        }
                                    ]
                                }
                            },
                            {
                                '$project': {
                                    'list': { '$first': '$dc.list' },
                                    '_id': 0
                                }
                            },
                        ]
                    }
                },
                {
                    '$project': {
                        'list': { '$first': '$dct.list' },
                        '_id': 0
                    }
                },
            ])

            if (listConsult.length === 0) {
                throw { message: 'Data not found' }
            }

            res.status(200).json(jsonData(listConsult[0].list))


        } catch (error) {
            console.log(error);
            next(error)
        }
    }

    static async reviewDoctor(req, res, next) {
        try {
            const { id } = req.params

            let { star } = req.query

            let starFilter = +star
            let matchFilter

            if (star) {
                matchFilter = starFilter
            } else {
                matchFilter = { '$ne': null }
            }

            console.log(matchFilter);

            const reviewDoctor = await Doctor.aggregate([
                {
                    '$sort': { '_id': -1 }
                },
                {
                    '$match': { '_id': ObjectID(id) }
                },
                {
                    '$lookup': {
                        'from': 'doctors_chats',
                        'as': 'dc',
                        'localField': '_id',
                        'foreignField': '_d',
                        'pipeline': [
                            {
                                '$sort': { '_id': -1 }
                            },
                            {
                                '$project': {
                                    'score': { '$ifNull': ['$scr', { '$toInt': '0' }] },
                                    'date': {
                                        '$dateToString': {
                                            'date': { '$toDate': { '$multiply': ['$ep', 1000] } },
                                            'format': '%Y-%m-%d',
                                            'onNull': '2020-01-01'
                                        }
                                    },
                                    'command': { '$ifNull': ['$com', '-'] },
                                    '_id': 0
                                }
                            },
                            {
                                '$match': { 'score': matchFilter }
                            }
                        ]
                    }
                },
                {
                    '$project': {
                        'data': '$dc',
                        '_id': 0
                    }
                }
            ])

            if (reviewDoctor.length === 0) {
                throw { message: 'Data not found' }
            }

            res.status(200).json(jsonData(reviewDoctor[0].data))
        } catch (error) {
            console.log(error);
        }
    }
}

module.exports = {
    SkinBeautyController
}

