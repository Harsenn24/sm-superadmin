const {  Store } = require("../model")
const { ObjectID } = require("bson")
const { date2number } = require("../helper/date2number")
const statusVch = require("../helper/sts_voucher")
const statusVchSold = require("../helper/sts_voucher_sold")


class StoreClinicController {
    static async clinicList(req, res) {
        try {
            const { id } = req.params
            const clinicList = await Store.aggregate([
                {
                    '$sort': { '_id': -1 }
                },
                {
                    '$match': { '_id': ObjectID(id) }
                },
                {
                    '$lookup': {
                        'from': 'stores_clinic',
                        'localField': '_id',
                        'foreignField': '_s',
                        'as': 'sc',
                        'pipeline': [
                            {
                                '$sort': { '_id': -1 }
                            },
                            {
                                '$addFields': {
                                    'address': { '$concat': ['$det.det', ',', '$det.cty'] }
                                }
                            },
                            {
                                '$project': {
                                    'clinic_name': '$nme',
                                    'clinic_code': '$key',
                                    'address': '$address',
                                    '_id': 0
                                }
                            }
                        ]
                    }
                },
                {
                    '$project': {
                        '_id': 0,
                        'data': '$sc'
                    }
                }

            ])

            res.send(clinicList)
        } catch (error) {
            console.log(error);
        }
    }

    static async voucher_all(req, res, next) {
        try {
            let { time_start, time_end } = req.query
            const { id } = req.params
            if (!time_start) {
                throw { message: 'Start Date is required' }
            }

            if (!time_end) {
                throw { message: 'End Date is required' }
            }


            time_start = date2number(time_start)
            time_end = date2number(time_end)

            const voucher_all = await Store.aggregate([
                {
                    '$sort': { '_id': -1 }
                },
                {
                    '$match': {
                        '$and': [
                            { 'ep': { $lte: time_start } },
                            { 'ep': { $gte: time_end } },
                            { '_id': ObjectID(id) }
                        ]
                    }
                },
                {
                    '$lookup': {
                        'from': 'stores_vouchers',
                        'localField': '_id',
                        'foreignField': '_s',
                        'as': 'sv',
                        'pipeline': [
                            {
                                '$sort': { '_id': -1 }
                            },
                            {
                                '$project': {
                                    '_id': 0,
                                    'vch_name': '$nme',
                                    'price': '$val',
                                    'until': {
                                        '$dateToString': {
                                            'date': { '$toDate': { '$multiply': ['$epe', 1000] } },
                                            'format': '%Y-%m-%d',
                                            'onNull': '2020-01-01'
                                        }
                                    },
                                    'quota': '$lmt',
                                    'status': statusVch
                                }
                            },
                            {
                                '$match': { 'status': 'Aktif' }
                            }
                        ]
                    }
                },
                {
                    '$project': {
                        'data': '$sv',
                        '_id': 0
                    }
                }
            ])
            res.send(voucher_all)
        } catch (error) {
            console.log(error);
            next(error)
        }
    }

    static async voucherSold(req, res, next) {
        try {
            let { time_start, time_end } = req.query
            const { id } = req.params
            if (!time_start) {
                throw { message: 'Start Date is required' }
            }

            if (!time_end) {
                throw { message: 'End Date is required' }
            }


            time_start = date2number(time_start)
            time_end = date2number(time_end)
            const voucherSold = await Store.aggregate([
                {
                    '$sort': { '_id': -1 }
                },
                {
                    '$match': {
                        '$and': [
                            { 'ep': { $lte: time_start } },
                            { 'ep': { $gte: time_end } },
                            { '_id': ObjectID(id) }
                        ]
                    }
                },
                {
                    '$lookup': {
                        'from': 'sys_vouchers',
                        'localField': '_id',
                        'foreignField': '_s',
                        'as': 'sys_vch',
                        'pipeline': [
                            {
                                '$sort': { '_id': -1 }
                            },
                            {
                                '$match': { 'pym.sts': 'settlement' }
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
                                    'time': {
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
                                    'localField': '_u',
                                    'foreignField': '_id',
                                    'as': 'us',
                                    'pipeline': [
                                        {
                                            '$sort': { '_id': -1 }
                                        },
                                        {
                                            '$project': {
                                                'username': {
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
                                '$addFields': {
                                    'name': { '$ifNull': [{ '$first': '$us.username' }, '-'] }
                                }
                            },
                            {
                                '$lookup': {
                                    'from': 'stores_vouchers',
                                    'localField': '_vc',
                                    'foreignField': '_id',
                                    'as': 'sv',
                                    'pipeline': [
                                        {
                                            '$sort': { '_id': -1 }
                                        },
                                        {
                                            '$addFields': {
                                                'idkirim': { '$first': '$_cl' }
                                            }
                                        },
                                        {
                                            '$lookup': {
                                                'from': 'stores_clinic',
                                                'foreignField': '_id',
                                                'localField': 'idkirim',
                                                'as': 'sc',
                                                'pipeline': [
                                                    {
                                                        '$sort': { '_id': -1 }

                                                    },
                                                    {
                                                        '$project': {
                                                            'name': '$nme',
                                                            'address': { '$concat': ['$det.det', ',', '$det.cty'] },
                                                            '_id': 0
                                                        }
                                                    }
                                                ]
                                            }
                                        },
                                        {
                                            '$project': {
                                                'sellerName': { '$ifNull': [{ '$first': '$sc.name' }, '-'] },
                                                'address': { '$ifNull': [{ '$first': '$sc.address' }, '-'] },
                                            }
                                        }
                                    ]
                                }
                            },
                            {
                                '$lookup': {
                                    'from': 'cfg_payment_list',
                                    'foreignField': 'code',
                                    'localField': 'pym.chn',
                                    'as': 'mt',
                                    'pipeline': [
                                        {
                                            '$sort': { '_id': -1 }
                                        },
                                        {
                                            '$project' : {
                                                'methods' : '$title'
                                            }
                                        }
                                    ]
                                }
                            },
                            {
                                '$project': {
                                    'vch_name': '$vn',
                                    'price': '$prc',
                                    'time': { '$concat': ['$date', ' ', '$time'] },
                                    '_id': 0,
                                    'id_order': '$inv',
                                    'status': statusVchSold,
                                    'user': '$name',
                                    'sellerName': { '$ifNull': [{ '$first': '$sv.sellerName' }, '-'] },
                                    'address': { '$ifNull': [{ '$first': '$sv.address' }, '-'] },
                                    'payment_methods': { '$ifNull': [{ '$first': '$mt.methods' }, '-'] },

                                }
                            }
                        ]
                    }
                },
                {
                    '$project' : {
                        '_id' : 0,
                        'data' : '$sys_vch'
                    }
                }

            ])
            res.send(voucherSold)
        } catch (error) {
            console.log(error);
            next(error)
        }
    }
}

module.exports = StoreClinicController