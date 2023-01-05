const { Sys_payment, Rcd_stores_challenge, Config } = require("../model")
const { ObjectID } = require("bson")
const { encrypt, decryptId, decrypt, encryptId } = require("../helper/enkrip_id")
const { queryPagination } = require("../helper/pagination")
const { jsonData } = require("../middleware/sucess")
const { returnAdminStatus } = require("../helper/sts_return_admin")
const { rt_link, user_photo_return_path, user_video_return_path, store_photo_return_path } = process.env
const { saveHistory } = require("../helper/save_to_history")
const { date2number } = require("../helper/date2number")
const { company_info, badge_data } = require("../query/data_email")
const { investigated_return_request, reject_return_goods, accept_return_goods } = require("../template_email/index")
const { data_record } = require("../query/record_return_data")
const { rupiah_format_mongo } = require("../helper/rupiah")








class PengembalianController {
    static async submissionReturn(req, res, next) {
        try {
            const { page, item_limit, tab } = req.query
            let filterTab = 0
            if (tab) {
                filterTab = { 'status': tab }
            } else {
                filterTab = {}
            }
            const submissionReturn = await Sys_payment.aggregate(queryPagination(
                [
                    {
                        '$match': {
                            '$and': [
                                { 'shp.sts': { '$in': ['return-request', 'return-pending', 'returning', 'returned'] } },
                                { 'pym.sts': 'settlement' },
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
                            },
                            'hour': {
                                '$dateToString': {
                                    'date': { '$toDate': { '$multiply': ['$ep', 1000] } },
                                    'format': '%H:%M',
                                    'onNull': '2020-01-01'
                                }
                            },
                            'status': switch_status_return
                        }
                    },
                    {
                        '$lookup': {
                            'from': 'stores',
                            'as': 'st',
                            'localField': '_s',
                            'foreignField': '_id',
                            'pipeline': [
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
                                        'store_image': { '$concat': [`${rt_link}store/i/`, { '$toString': '$store_id' }] },
                                        'storeName': '$det.nms',
                                        '_id': 0
                                    }
                                }
                            ]
                        }
                    },
                    {
                        '$addFields': {
                            'time': { '$concat': ['$date', ' ', '$hour'] }
                        }
                    },
                    {
                        '$sort': { 'time': -1 }
                    },
                    {
                        '$match': filterTab
                    },

                ],
                [
                    {
                        '$project': {
                            'time': '$time',
                            'storeName': { '$ifNull': [{ '$first': '$st.storeName' }, { '$toInt': '0' }] },
                            'store_image': { '$ifNull': [{ '$first': '$st.store_image' }, { '$toInt': '0' }] },
                            'invoice': '$inv',
                            'id_return_order': '$inv',
                            'status': '$status',
                            '_id': {
                                '$function': {
                                    'body': encrypt,
                                    'args': [{ '$toString': '$_id' }, 12],
                                    'lang': 'js'
                                }
                            },
                        }
                    },
                ], page, 3, item_limit
            ))

            if (submissionReturn.length === 0) { res.status(200).json(jsonData({ result: [] })) }
            res.status(200).json(jsonData(submissionReturn[0]))
        } catch (error) {
            console.log(error);
            next(error)
        }
    }


    static async returnItem(req, res, next) {
        try {
            const { page, item_limit, tab, search_seller } = req.query
            let filterTab = 0
            if (tab) {
                filterTab = { 'status': tab }
            } else {
                filterTab = {}
            }

            let filterStore = 0

            if (search_seller) {
                filterStore = {
                    'store_name': {
                        '$regex': search_seller,
                        '$options': 'i'
                    }
                }
            } else {
                filterStore = {}
            }
            const submissionReturn = await Rcd_stores_challenge.aggregate(queryPagination(
                [
                    {
                        '$addFields': {
                            'date': {
                                '$dateToString': {
                                    'date': { '$toDate': { '$multiply': ['$ep', 1000] } },
                                    'format': '%Y-%m-%d',
                                    'onNull': '2020-01-01'
                                }
                            },
                            'hour': {
                                '$dateToString': {
                                    'date': { '$toDate': { '$multiply': ['$ep', 1000] } },
                                    'format': '%H:%M',
                                    'onNull': '2020-01-01'
                                }
                            },
                            'status': returnAdminStatus
                        }
                    },
                    {
                        '$lookup': {
                            'from': 'stores',
                            'as': 'st',
                            'localField': '_s',
                            'foreignField': '_id',
                            'pipeline': [
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
                                        'store_image': { '$concat': [`${rt_link}store/i/`, { '$toString': '$store_id' }] },
                                        'storeName': '$det.nms',
                                        '_id': 0
                                    }
                                }
                            ]
                        }
                    },
                    {
                        '$addFields': {
                            'time': { '$concat': ['$date', ' ', '$hour'] },
                            'store_name': { '$ifNull': [{ '$first': '$st.storeName' }, { '$toInt': '0' }] },
                        }
                    },
                    {
                        '$lookup': {
                            'from': 'sys_payment',
                            'as': 'sp',
                            'localField': '_py',
                            'foreignField': '_id',
                            'pipeline': [
                                {
                                    '$project': {
                                        'invoice': '$inv'
                                    }
                                }
                            ]
                        }
                    },
                    {
                        '$unwind': { 'path': '$sp' }
                    },
                    {
                        '$sort': { 'time': -1 }
                    },
                    {
                        '$match': { '$and': [filterTab, filterStore] }
                    },
                ],
                [
                    {
                        '$project': {
                            'time': '$time',
                            'storeName': '$store_name',
                            'store_image': { '$ifNull': [{ '$first': '$st.store_image' }, { '$toInt': '0' }] },
                            'invoice': '$sp.invoice',
                            'id_return_order': '$sp.invoice',
                            'status': '$status',
                            '_id': {
                                '$function': {
                                    'body': encrypt,
                                    'args': [{ '$toString': '$_id' }, 12],
                                    'lang': 'js'
                                }
                            },
                        }
                    },
                ], page, 3, item_limit
            ))

            if (submissionReturn.length === 0) { res.status(200).json(jsonData({ result: [] })) }
            res.status(200).json(jsonData(submissionReturn[0]))
        } catch (error) {
            console.log(error);
            next(error)
        }
    }


    static async returnItemDetail(req, res, next) {
        try {
            const { id } = req.params

            const idDecrypt = decryptId(id, 12)

            const detailSubmissionReturn = await Rcd_stores_challenge.aggregate(
                [
                    {
                        '$match': {
                            '$and': [
                                { '_id': ObjectID(idDecrypt) }
                            ]
                        }
                    },
                    {
                        '$addFields': {
                            'date_store': {
                                '$dateToString': {
                                    'date': { '$toDate': { '$multiply': ['$ep', 1000] } },
                                    'format': '%Y-%m-%d',
                                    'onNull': '2020-01-01'
                                }
                            },
                            'hour_store': {
                                '$dateToString': {
                                    'date': { '$toDate': { '$multiply': ['$ep', 1000] } },
                                    'format': '%H:%M',
                                    'onNull': '2020-01-01'
                                }
                            },
                        }
                    },
                    {
                        '$lookup': {
                            'from': 'users',
                            'as': 'us',
                            'localField': '_u',
                            'foreignField': '_id',
                            'pipeline': [
                                {
                                    '$project': {
                                        'fullname': {
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
                                }
                            ]
                        }
                    },
                    {
                        '$unwind': { 'path': '$us' }
                    },
                    {
                        '$addFields': {
                            'user_name': '$us.fullname'
                        }
                    },
                    {
                        '$lookup': {
                            'from': 'sys_payment',
                            'as': 'sp',
                            'localField': '_py',
                            'foreignField': '_id',
                            'pipeline': [
                                {
                                    '$addFields': {
                                        'user_date': {
                                            '$dateToString': {
                                                'date': { '$toDate': { '$multiply': ['$isc.ep', 1000] } },
                                                'format': '%Y-%m-%d',
                                                'onNull': '2020-01-01'
                                            }
                                        },
                                        'user_hour': {
                                            '$dateToString': {
                                                'date': { '$toDate': { '$multiply': ['$ep', 1000] } },
                                                'format': '%H:%M',
                                                'onNull': '2020-01-01'
                                            }
                                        },
                                        'orderId': {
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
                                        'reason': '$isc.rsn',
                                        'description': '$isc.des',
                                        'address': { '$concat': ['$isc.org.des', ' ', '$isc.org.an', ' ', '$isc.org.sn', ' ', '$isc.org.cn', ' ', '$isc.org.zip'] },
                                        'time': { '$concat': ['$user_date', ' ', '$user_hour'] },
                                        'order_number': { '$toUpper': '$orderId' },
                                        'total': '$mon.tot',
                                        'return_type': '$isc.typ'
                                    }
                                }
                            ]
                        }
                    },
                    {
                        '$unwind': { 'path': '$sp' }
                    },
                    {
                        '$addFields': {
                            'user_reason': '$sp.reason',
                            'user_description': '$sp.description',
                            'user_address': '$sp.address',
                            'user_time': '$sp.time',
                            'order_number': '$sp.order_number',
                            'total': '$sp.total',
                            'return_type': '$sp.return_type'
                        }
                    },
                    {
                        '$lookup': {
                            'from': 'stores',
                            'as': 'st',
                            'localField': '_s',
                            'foreignField': '_id',
                            'pipeline': [
                                {
                                    '$lookup': {
                                        'from': 'stores_address',
                                        'as': 'sa',
                                        'localField': '_id',
                                        'foreignField': '_s',
                                        'pipeline': [
                                            {
                                                '$match': { 'man': true }
                                            },
                                            {
                                                '$project': {
                                                    'address': {
                                                        '$concat': ['$shp.cc', ' ', '$shp.cn', ' ', '$shp.pn', ' ', '$shp.sn', ' ', '$shp.an']
                                                    }
                                                }
                                            }
                                        ]
                                    }
                                },
                                {
                                    '$unwind': { 'path': '$sa' }
                                },
                                {
                                    '$project': {
                                        'storeName': '$det.nms',
                                        'address': '$sa.address',
                                        '_id': {
                                            '$function': {
                                                'body': encrypt,
                                                'args': [{ '$toString': '$_id' }, 12],
                                                'lang': 'js'
                                            }
                                        }
                                    }
                                }
                            ]
                        }
                    },
                    {
                        '$unwind': { 'path': '$st' }
                    },
                    {
                        '$addFields': {
                            'store_reason': '$rsn',
                            'store_id': '$st._id',
                            'store_description': '$des',
                            'store_address': '$st.address',
                            'store_name': '$st.storeName',
                            'store_time': { '$concat': ['$date_store', ' ', '$hour_store'] },
                            'submission_number': {
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
                            '_id': 0,
                            'user': {
                                'description': '$user_description',
                                'reason': '$user_reason',
                                'time': '$user_time',
                                'address': '$user_address'
                            },
                            'store': {
                                'description': '$store_description',
                                'reason': '$store_reason',
                                'time': '$store_time',
                                'address': '$store_address',
                                '_id': '$store_id'
                            },
                            'general_info': {
                                'status': returnAdminStatus,
                                'submission_number': '$submission_number',
                                'submission_time': '$store_time',
                                'return_type': '$return_type',
                                'total': '$total',
                                'order_number': '$order_number',
                            },
                            'account_info': {
                                'user_name': '$user_name',
                                'store_name': '$store_name'
                            },
                            'super_admin': {
                                'reason': { '$ifNull': ['$ars', '-'] }
                            }
                        }
                    }
                ]
            )

            if (detailSubmissionReturn.length === 0) { throw { message: 'Data not found' } }

            res.status(200).json(jsonData(detailSubmissionReturn[0]))

        } catch (error) {
            console.log(error);
            next(error)
        }
    }



    static async detailSubmissionReturn(req, res, next) {
        try {
            const { id } = req.params

            const idDecrypt = decryptId(id, 12)

            const detailSubmissionReturn = await Sys_payment.aggregate(
                [
                    {
                        '$match': {
                            '$and': [
                                { '_id': ObjectID(idDecrypt) }
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
                            },
                            'hour': {
                                '$dateToString': {
                                    'date': { '$toDate': { '$multiply': ['$ep', 1000] } },
                                    'format': '%H:%M',
                                    'onNull': '2020-01-01'
                                }
                            },
                            'user_picture': {
                                '$map': {
                                    'input': '$isc.fle',
                                    'in': { '$concat': [`${rt_link}secure/c/media/returned/image/`, '$$this'] }
                                }
                            },
                            'user_video': {
                                '$map': {
                                    'input': '$isc.vid',
                                    'in': { '$concat': [`${rt_link}secure/c/media/returned/video/`, '$$this'] }
                                }
                            },
                            'address_destination': { '$concat': ['$isc.dsc.des', ', ', 'Kode Pos :', ' ', '$isc.dsc.zip'] }
                        }
                    },
                    {
                        '$lookup': {
                            'from': 'stores',
                            'as': 'st',
                            'localField': '_s',
                            'foreignField': '_id',
                            'pipeline': [
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
                                        'store_image': { '$concat': [`${rt_link}store/i/`, { '$toString': '$store_id' }] },
                                        'storeName': '$det.nms',
                                        '_id': 0
                                    }
                                }
                            ]
                        }
                    },
                    {
                        '$lookup': {
                            'from': 'rcd_stores_challenge',
                            'as': 'recordStores',
                            'localField': '_id',
                            'foreignField': '_py',
                            'pipeline': [
                                {
                                    '$project': {
                                        'store_picture': {
                                            '$map': {
                                                'input': '$fle',
                                                'in': { '$concat': [`${rt_link}secure/c/media/returned/image/`, '$$this'] }
                                            }
                                        },
                                        '_id': 0,
                                        'reason': '$rsn',
                                        'description': '$des'
                                    }
                                }
                            ]
                        }
                    },
                    {
                        '$project': {
                            '_id': 0,
                            'time': { '$concat': ['$date', ' ', '$hour'] },
                            'storeName': { '$ifNull': [{ '$first': '$st.storeName' }, { '$toInt': '0' }] },
                            'store_image': { '$ifNull': [{ '$first': '$st.store_image' }, { '$toInt': '0' }] },
                            'invoice': '$inv',
                            'id_return_order': '$inv',
                            'status': switch_status_return,
                            'nominal': '$mon.txf',
                            'return_type': {
                                '$cond': {
                                    'if': { '$eq': ['$isc.typ', 'goods'] },
                                    'then': 'Barang dan Dana',
                                    'else': {
                                        '$cond': {
                                            'if': { '$eq': ['$isc.typ', 'fund'] },
                                            'then': 'Dana',
                                            'else': '-'
                                        }
                                    }
                                }
                            },
                            'address_destination': '$address_destination',
                            'user': {
                                'reason': '$isc.rsn',
                                'description': '$isc.des'
                            },
                            'store': {
                                'reason': { '$ifNull': [{ '$first': '$recordStores.reason' }, '-'] },
                                'description': { '$ifNull': [{ '$first': '$recordStores.description' }, '-'] }
                            }
                        }
                    }
                ]
            )

            if (detailSubmissionReturn.length === 0) { throw { message: 'Data not found' } }

            res.status(200).json(jsonData(detailSubmissionReturn[0]))

        } catch (error) {
            console.log(error);
            next(error)
        }
    }

    static async tokenPhoto(req, res, next) {
        try {
            const { id } = req.params
            const idDecrypt = decryptId(id, 12)

            const tokenPhoto = await Rcd_stores_challenge.aggregate(
                [
                    {
                        '$match': { '_id': ObjectID(idDecrypt) }
                    },
                    {
                        '$lookup': {
                            'from': 'sys_payment',
                            'as': 'sp',
                            'localField': '_py',
                            'foreignField': '_id',
                            'pipeline': [
                                {
                                    '$facet': {
                                        'user': [
                                            {
                                                '$project': {
                                                    'photo_name': '$isc.fle',
                                                    'video_name': '$isc.vid',
                                                    '_id': 0
                                                }
                                            }
                                        ],
                                        'store': [
                                            {
                                                '$lookup': {
                                                    'from': 'rcd_stores_challenge',
                                                    'as': 'recordStores',
                                                    'localField': '_id',
                                                    'foreignField': '_py',
                                                    'pipeline': [
                                                        {
                                                            '$project': {
                                                                'pict': '$fle',
                                                                '_id': 0
                                                            }
                                                        }
                                                    ]
                                                }
                                            },
                                            {
                                                '$unwind': { 'path': '$recordStores' }
                                            },
                                            {
                                                '$project': {
                                                    'photo_name': '$recordStores.pict',
                                                    '_id': 0
                                                }
                                            }
                                        ]
                                    }
                                },
                                {
                                    '$unwind': { 'path': '$user' }
                                },
                                {
                                    '$unwind': { 'path': '$store' }
                                }
                            ]
                        }
                    },
                    {
                        '$unwind': { 'path': '$sp' }
                    }
                ]
            )

            res.status(200).json(jsonData(tokenPhoto[0].sp))
        } catch (error) {
            console.log(error)
            next(error)
        }
    }

    static async photoUser(req, res, next) {
        try {
            const { id } = req.params
            const idDecrypt = decryptId(id, 12)

            const { photo_name } = req.query

            const photoUser = await Rcd_stores_challenge.aggregate(
                [
                    {
                        '$match': { '_id': ObjectID(idDecrypt) }
                    },
                    {
                        '$lookup': {
                            'from': 'sys_payment',
                            'as': 'sp',
                            'localField': '_py',
                            'foreignField': '_id',
                            'pipeline': [
                                {
                                    '$project': {
                                        '_id': 0,
                                        'date': {
                                            '$dateToString': {
                                                'date': { '$toDate': { '$multiply': ['$ep', 1000] } },
                                                'format': '%Y/%m/%d',
                                                'onNull': '2020-01-01'
                                            }
                                        },
                                    }
                                }
                            ]
                        }
                    },
                    {
                        '$unwind': { 'path': '$sp' }
                    }
                ]
            )

            const dateFile = photoUser[0].sp.date

            res.sendFile(`${photo_name}`, { root: `${user_photo_return_path}${dateFile}` })

        } catch (error) {
            console.log(error);
            next(error)
        }
    }

    static async videoUser(req, res, next) {
        try {
            const { id } = req.params
            const idDecrypt = decryptId(id, 12)

            const { video_name } = req.query

            const photoUser = await Rcd_stores_challenge.aggregate(
                [
                    {
                        '$match': { '_id': ObjectID(idDecrypt) }
                    },
                    {
                        '$lookup': {
                            'from': 'sys_payment',
                            'as': 'sp',
                            'localField': '_py',
                            'foreignField': '_id',
                            'pipeline': [
                                {
                                    '$project': {
                                        '_id': 0,
                                        'date': {
                                            '$dateToString': {
                                                'date': { '$toDate': { '$multiply': ['$ep', 1000] } },
                                                'format': '%Y/%m/%d',
                                                'onNull': '2020-01-01'
                                            }
                                        },
                                    }
                                }
                            ]
                        }
                    },
                    {
                        '$unwind': { 'path': '$sp' }
                    }
                ]
            )

            const dateFile = photoUser[0].sp.date

            res.sendFile(`${video_name}`, { root: `${user_video_return_path}${dateFile}` })

        } catch (error) {
            console.log(error);
            next(error)
        }
    }

    static async photoStore(req, res, next) {
        try {
            const { id } = req.params
            const idDecrypt = decryptId(id, 12)

            const { photo_name } = req.query

            const photoUser = await Rcd_stores_challenge.aggregate(
                [
                    {
                        '$match': { '_id': ObjectID(idDecrypt) }
                    },
                    {
                        '$project': {
                            'date': {
                                '$dateToString': {
                                    'date': { '$toDate': { '$multiply': ['$ep', 1000] } },
                                    'format': '%Y/%m/%d',
                                    'onNull': '2020-01-01'
                                }
                            },
                            '_id': 0
                        }
                    },
                ]
            )

            const dateFile = photoUser[0].date

            res.sendFile(`${photo_name}`, { root: `${store_photo_return_path}${dateFile}` })

        } catch (error) {
            console.log(error);
            next(error)
        }
    }

    static async unprocessProduct(req, res, next) {
        try {
            const { id } = req.params
            const idDecrypt = decryptId(id, 12)

            const [rcd_data] = await Rcd_stores_challenge.aggregate(data_record(idDecrypt))

            let [data_email] = await Config.aggregate(company_info())

            let [badges] = await Config.aggregate(badge_data())

            data_email.app_store_badge = badges.app_store_badge
            data_email.twitter_badge = badges.twitter_badge
            data_email.facebook_badge = badges.facebook_badge
            data_email.instagram_badge = badges.instagram_badge
            data_email.google_play_badge = badges.google_play_badge
            data_email.domain = process.env.domain
            data_email.unsub_link = process.env.unsub_link
            data_email.copyright = (new Date().getFullYear()).toString()
            data_email.client_email = rcd_data.client_email
            data_email.store_email = rcd_data.store_email
            data_email.user_name = rcd_data.client_name
            data_email.store_name = rcd_data.store_name


            if (rcd_data.status === 'pending') { throw { message: 'This order status already ivestigated' } }

            const unprocessProduct = await Rcd_stores_challenge.findOneAndUpdate(
                { '_id': ObjectID(idDecrypt) },
                {
                    '$set': {
                        'sts': 'pending',
                    }
                }
            )


            let result_email_user = investigated_return_request(data_email, data_email.user_name, data_email.client_email)
            let result_email_store = investigated_return_request(data_email, data_email.store_name, data_email.store_email)


            if (result_email_user === true && result_email_store === true) {
                const activity = `Edit return status from "Belum Diproses" to "Investigasi"`
                const historyLog = saveHistory(req.user, activity)

                historyLog.save((err) => {
                    if (err) {
                        console.log(err);
                        next(err)
                    } else {
                        res.status(200).json(jsonData())
                    }
                })
            } else {
                throw { message: 'Failed sent email!' }
            }

        } catch (error) {
            console.log(error);
            next(error)
        }
    }

    static async returnDecision(req, res, next) {
        try {
            const { id } = req.params
            const idDecrypt = decryptId(id, 12)

            const { decision, reason } = req.body

            if (decision.length === 0) {
                throw { message: 'Descision is required' }
            }

            let findIdPayment = await Rcd_stores_challenge.aggregate(
                [
                    {
                        '$match': { '_id': ObjectID(idDecrypt) }
                    },
                    {
                        '$project': {
                            '_id': 0,
                            'id_payment': '$_py'
                        }
                    }
                ]
            )

            let id_payment = findIdPayment[0].id_payment


            const [rcd_data] = await Rcd_stores_challenge.aggregate(data_record(idDecrypt))

            let [data_email] = await Config.aggregate(company_info())

            let [badges] = await Config.aggregate(badge_data())

            data_email.app_store_badge = badges.app_store_badge
            data_email.twitter_badge = badges.twitter_badge
            data_email.facebook_badge = badges.facebook_badge
            data_email.instagram_badge = badges.instagram_badge
            data_email.google_play_badge = badges.google_play_badge
            data_email.domain = process.env.domain
            data_email.unsub_link = process.env.unsub_link
            data_email.copyright = (new Date().getFullYear()).toString()
            data_email.client_email = rcd_data.client_email
            data_email.store_email = rcd_data.store_email
            data_email.user_name = rcd_data.client_name
            data_email.store_name = rcd_data.store_name

            let [product_detail] = await Sys_payment.aggregate(
                [
                    {
                        '$match': { '_id': id_payment }
                    },
                    {
                        '$lookup': {
                            'from': 'cfg_payment_list',
                            'localField': 'pym.chn',
                            'foreignField': 'code',
                            'as': 'bl',
                            'pipeline': [
                                {
                                    '$addFields': {
                                        'methods': {
                                            '$concat': ['$bank', " ", '$title']
                                        }
                                    }
                                }
                            ]
                        }
                    },
                    {
                        '$addFields': {
                            'payment_id': {
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
                            'type': {
                                '$cond': {
                                    'if': { '$eq': ['$isc.typ', 'goods'] },
                                    'then': 'Barang dan Dana',
                                    'else': 'Dana'
                                }
                            },
                            'payment_id': { '$toUpper': { '$toString': '$payment_id' } },
                            'order_date': {
                                '$dateToString': {
                                    'date': { '$toDate': { '$multiply': ['$ep', 1000] } },
                                    'format': '%d/%m/%Y',
                                    'onNull': '2020-01-01'
                                }
                            },
                            'payment_method': { '$ifNull': [{ '$first': '$bl.methods' }, '-'] },
                            'reason': reason,
                            'invoice': '$inv',
                            'products': {
                                '$map': {
                                    'input': '$dat',
                                    'in': {
                                        'product_image': {
                                            '$concat': [`${rt_link}store/ip/`, {
                                                '$function': {
                                                    'body': encrypt,
                                                    'args': [{ '$toString': '$$this._p' }, 12],
                                                    'lang': 'js'
                                                }
                                            }, '/0']
                                        },
                                        'product_name': '$$this.pn',
                                        'product_variant': '$$this.vn',
                                        'product_quantity': '$$this.qty',
                                        'product_price': {
                                            '$function': {
                                                'body': rupiah_format_mongo,
                                                'args': ['$$this.prc'],
                                                'lang': 'js'
                                            }
                                        },
                                    }
                                }
                            },
                        }
                    }
                ]
            )

            if (decision === true) { // menang seller

                const updateRecordChallange = await Rcd_stores_challenge.findOneAndUpdate(
                    { '_id': ObjectID(idDecrypt) },
                    {
                        '$set': {
                            'sts': 'accepted',
                            'ars': reason
                        }
                    },

                )

                const updateSystemPayment = await Sys_payment.findOneAndUpdate(
                    { '_id': id_payment },
                    {
                        '$set': {
                            'shp.sts': 'returning'
                        }
                    },

                )

                let result_email_user = accept_return_goods(data_email, rcd_data, product_detail, data_email.user_name, data_email.client_email, product_detail.type)
                let result_email_store = accept_return_goods(data_email, rcd_data, product_detail, data_email.store_name, data_email.store_email, product_detail.type)

                if (result_email_user === true && result_email_store === true) {
                    const activity = `Terima pengembalian ${product_detail.type} user`
                    const historyLog = saveHistory(req.user, activity)
    
                    historyLog.save((err) => {
                        if (err) {
                            console.log(err);
                            next(err)
                        } else {
                            res.status(200).json(jsonData())
                        }
                    })
                } else {
                    throw { message: 'Failed sent email!' }
                }

            }


            if (decision === false) { // menang user
                if (!reason) {
                    throw { message: 'Reason is required' }
                }

                const updateRecordChallange = await Rcd_stores_challenge.findOneAndUpdate(
                    { '_id': ObjectID(idDecrypt) },
                    {
                        '$set': {
                            'sts': 'reject',
                            'ars': reason
                        }
                    }
                )

                const updateSystemPayment = await Sys_payment.findOneAndUpdate(
                    { '_id': id_payment },
                    {
                        '$set': {
                            'shp.sts': 'shipping-deliver',
                            'tme.sts': 'shipping:shipping-deliver',
                            'tme.eps': date2number(''),
                            'tme.epe': date2number('') + 172800
                        }
                    }

                )

                let result_email_user = reject_return_goods(data_email, rcd_data, product_detail, data_email.user_name, data_email.client_email, product_detail.type)
                let result_email_store = reject_return_goods(data_email, rcd_data, product_detail, data_email.store_name, data_email.store_email, product_detail.type)


                if (result_email_store === true && result_email_user === true) {

                    const activity = `Tolak pengembalian ${product_detail.type} user`
                    const historyLog = saveHistory(req.user, activity)

                    historyLog.save((err) => {
                        if (err) {
                            console.log(err);
                            next(err)
                        } else {
                            res.status(200).json(jsonData())
                        }
                    })
                } else {
                    throw { message: 'Failed sent email!' }
                }
            }

        } catch (error) {
            console.log(error);
            next(error)
        }
    }


}

module.exports = PengembalianController