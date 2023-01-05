const { range_day_aggregate } = require("../helper/range_day")
const { percent_aggregate } = require("../helper/percent")
const { mon_fee, mon_fen } = require("../helper/count")


function magic_mirror_finance_excel(time_start, time_end) {
    const query = [
        {
            '$match': {
                '$and': [
                    { 'ep': { '$lte': time_start } },
                    { 'ep': { '$gte': time_end } },
                    { 'pym.sts': 'settlement' }
                ]
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
                            'full_name': {
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
            '$lookup': {
                'from': 'cfg_payment_list',
                'foreignField': 'code',
                'localField': 'pym.chn',
                'as': 'mt',
                'pipeline': [
                    {
                        '$project': {
                            'methods': { '$concat': ['$title', ' ', '$bank'] }
                        }
                    }
                ]
            }
        },
        {
            '$sort': { '_id': -1 }
        },
        {
            '$project': {
                'No': '-',
                'Tanggal Pembelian': {
                    '$dateToString': {
                        'date': { '$toDate': { '$multiply': ['$ep', 1000] } },
                        'format': '%Y-%m-%d',
                        'onNull': '2020-01-01'
                    }
                },
                'Username': { '$ifNull': [{ '$first': '$us.full_name' }, '-'] },
                'No Invoice': '$inv',
                'Total Pembayaran': '$prc',
                'Jenis Paket': {
                    '$cond': {
                        'if': { '$eq': ['$typ', 'daily'] },
                        'then': '1 Hari',
                        'else': {
                            '$cond': {
                                'if': { '$eq': ['$typ', 'monthly'] },
                                'then': '1 Bulan',
                                'else': {
                                    '$cond': {
                                        'if': { '$eq': ['$typ', 'yearly'] },
                                        'then': '1 Tahun',
                                        'else': '-'
                                    }
                                }
                            }
                        }
                    }
                },
                'Status Users': {
                    '$cond': {
                        'if': { '$eq': ['$src', 'apps'] },
                        'then': 'Publik',
                        'else': {
                            '$cond': {
                                'if': { '$eq': ['$typ', 'member-online'] },
                                'then': 'Online',
                                'else': {
                                    '$cond': {
                                        'if': { '$eq': ['$typ', ['member-onsite', 'member-offline']] },
                                        'then': 'Onsite',
                                        'else': '-'
                                    }
                                }
                            }
                        }
                    }
                },
                'Metode Pembayaran': { '$ifNull': [{ '$first': '$mt.methods' }, '-'] },
                'Biaya Transaksi': '$mon.fee',
                'Laba Kotor': '$prb',
                'DPP': '$mon.dpp',
                'PPN (11%)': '$mon.ppn',
                'Komisi Klinik': { '$ifNull': ['$mon.clm', { '$toInt': '0' }] },
                'Laba Bersih': '$prn',
                '_id': 0
            }
        },

    ]

    return query
}



function admin_finance_excel(time_start, time_end) {
    const query = [
        {
            '$limit': 1
        },
        {
            '$lookup': {
                'from': 'sys_payment',
                'as': 'payment',
                'pipeline': [
                    {
                        '$sort': { '_id': -1 }
                    },
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
                        '$lookup': {
                            'from': 'users',
                            'as': 'us',
                            'localField': '_u',
                            'foreignField': '_id',
                            'pipeline': [
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
                        '$lookup': {
                            'from': 'stores',
                            'as': 'store_data',
                            'localField': '_s',
                            'foreignField': '_id',
                            'pipeline': [
                                {
                                    '$project': {
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
                                        'npwp': '$lgl.npw'
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
                                    '$project': {
                                        'methods': { '$concat': ['$title', ' ', '$bank'] },
                                        'admin_fee': '$fees'
                                    }
                                }
                            ]
                        }
                    },
                    {
                        '$lookup': {
                            'from': 'sys_payment_glob',
                            'localField': '_gd',
                            'foreignField': '_id',
                            'pipeline': [
                                {
                                    '$lookup': {
                                        'from': 'sys_payment',
                                        'localField': '_id',
                                        'foreignField': '_gd',
                                        'pipeline': [
                                            { '$count': 'count' }
                                        ],
                                        'as': 'item_count'
                                    }
                                },
                                {
                                    '$addFields': {
                                        'invoice_count': { '$ifNull': [{ '$first': '$item_count.count' }, { '$toInt': '1' }] }
                                    }
                                },
                                {
                                    '$project': {
                                        'amount': {
                                            '$divide': [
                                                { '$ifNull': ['$pym.fee', { '$toInt': '0' }] },
                                                '$invoice_count'
                                            ]
                                        },

                                    }
                                }
                            ],
                            'as': 'payment_fee'
                        }
                    },
                    {
                        '$addFields': {
                            'admin_fee': { '$ifNull': [{ '$first': '$payment_fee.amount' }, '-'] },
                        }
                    },
                    {
                        '$project': {
                            'No': '-',
                            'Tanggal Pembelian': {
                                '$dateToString': {
                                    'date': { '$toDate': { '$multiply': ['$ep', 1000] } },
                                    'format': '%Y-%m-%d',
                                    'onNull': '2020-01-01'
                                }
                            },
                            'Username': { '$ifNull': [{ '$first': '$us.full_name' }, '-'] },
                            'Seller': { '$ifNull': [{ '$first': '$store_data.store_name' }, '-'] },
                            'No NPWP Seller': { '$ifNull': [{ '$first': '$store_data.npwp' }, '-'] },
                            'No Invoice': '$inv',
                            'Jenis Pembelian': 'Product',
                            'Nama Product/E-Voucher': '-',
                            'Metode Pembayaran': { '$ifNull': [{ '$first': '$mt.methods' }, '-'] },
                            'Total Pesanan': '$mon.amm',
                            'Ongkos Kirim': '$mon.shp',
                            'Asuransi': { '$ifNull': ['$det.inf', '-'] },
                            'Biaya Transaksi': '$admin_fee',
                            'Total Pembayaran': { '$add': ['$mon.amm', '$mon.shp', { '$ifNull': ['$det.inf', { '$toInt': '0' }] }, '$admin_fee'] },
                            'Admin Fee/Laba Kotor': '$mon.fee',
                            'DPP': '$mon.dpp',
                            'PPN (11%)': '$mon.ppn',
                            'Pph23 (2%)': '$mon.pph',
                            'Laba bersih': '$mon.fen',
                            '_id': 0
                        }
                    }
                ]
            }
        },
        {
            '$lookup': {
                'from': 'sys_vouchers',
                'as': 'voucher',
                'pipeline': [
                    {
                        '$sort': { '_id': -1 }
                    },
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
                        '$lookup': {
                            'from': 'users',
                            'as': 'us',
                            'localField': '_u',
                            'foreignField': '_id',
                            'pipeline': [
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
                        '$lookup': {
                            'from': 'stores',
                            'as': 'store_data',
                            'localField': '_s',
                            'foreignField': '_id',
                            'pipeline': [
                                {
                                    '$project': {
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
                                        'npwp': '$lgl.npw'
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
                                    '$project': {
                                        'methods': { '$concat': ['$title', ' ', '$bank'] },
                                        'admin_fee': '$fees'
                                    }
                                }
                            ]
                        }
                    },
                    {
                        '$project': {
                            'No': '-',
                            'Tanggal Pembelian': {
                                '$dateToString': {
                                    'date': { '$toDate': { '$multiply': ['$ep', 1000] } },
                                    'format': '%Y-%m-%d',
                                    'onNull': '2020-01-01'
                                }
                            },
                            'Username': { '$ifNull': [{ '$first': '$us.full_name' }, '-'] },
                            'Seller': { '$ifNull': [{ '$first': '$store_data.store_name' }, '-'] },
                            'No NPWP Seller': { '$ifNull': [{ '$first': '$store_data.npwp' }, '-'] },
                            'No Invoice': '$inv',
                            'Jenis Pembelian': 'Voucher',
                            'Nama Product/E-Voucher': '$vn',
                            'Metode Pembayaran': { '$ifNull': [{ '$first': '$mt.methods' }, '-'] },
                            'Total Pesanan': '$prc',
                            'Ongkos Kirim': '-',
                            'Asuransi': '-',
                            'Biaya Transaksi': '$pym.fee',
                            'Total Pembayaran': { '$add': ['$prc', '$pym.fee'] },
                            'Admin Fee/Laba Kotor': '$mon.fee',
                            'DPP': '$mon.fee',
                            'PPN (11%)': '$mon.ppn',
                            'Pph23 (2%)': '$mon.pph',
                            'Laba bersih': '$mon.fen',
                            '_id': 0

                        }
                    }
                ]
            }
        },
        {
            '$project': {
                'join_data': { '$concatArrays': ['$payment', '$voucher'] }
            }
        }
    ]
    return query
}


function doctor_finance_excel(time_start, time_end) {
    const query = [
        {
            '$sort': { '_id': -1 }
        },
        {
            '$addFields': {
                'date_id': { '$toDecimal': { '$toDate': '$_id' } }
            }
        },
        {
            '$addFields': {
                'date_id': { '$round': [{ '$divide': ['$date_id', 1000] }, 4] },
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
            '$lookup': {
                'from': 'users',
                'as': 'us',
                'localField': '_u',
                'foreignField': '_id',
                'pipeline': [
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
            '$lookup': {
                'from': 'doctors',
                'as': 'doctor_data',
                'localField': '_d',
                'foreignField': '_id',
                'pipeline': [
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
            '$lookup': {
                'from': 'cfg_payment_list',
                'foreignField': 'code',
                'localField': 'pym.chn',
                'as': 'mt',
                'pipeline': [
                    {
                        '$project': {
                            'methods': { '$concat': ['$title', ' ', '$bank'] },
                            'admin_fee': '$fees'
                        }
                    }
                ]
            }
        },
        {
            '$addFields': {
                'admin_fee': { '$ifNull': [{ '$first': '$mt.admin_fee' }, '-'] },
                'Tanggal_Pembelian': {
                    '$dateToString': {
                        'date': { '$toDate': { '$multiply': ['$ep', 1000] } },
                        'format': '%Y-%m-%d',
                        'onNull': '2020-01-01'
                    }
                },
            }
        },
        {
            '$project': {
                'No': '-',
                'Tanggal Pembelian': '$Tanggal_Pembelian',
                'Username': { '$first': '$us.full_name' },
                'Klinik': '-',
                'Dokter': { '$first': '$doctor_data.full_name' },
                'No NPWP Klinik': '-',
                'Invoice': '$inv',
                'Metode Pembayaran': { '$first': '$mt.methods' },
                'Harga Konsultasi': '$mon.amm',
                'Biaya Transaksi': '$pym.fee',
                'Total Pembayaran': { '$add': ['$mon.amm', '$pym.fee'] },
                'Admin Fee/Laba Kotor': '$mon.fee',
                'DPP': '$mon.dpp',
                'PPN (11%)': '$mon.ppn',
                'PPh23 (2%)': '$mon.pph',
                'Laba Bersih': '$mon.fen',
                '_id': 0
            }
        }
    ]
    return query
}


module.exports = { magic_mirror_finance_excel, admin_finance_excel, doctor_finance_excel }