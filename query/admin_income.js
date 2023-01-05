const { range_day_aggregate } = require("../helper/range_day")
const { percent_aggregate } = require("../helper/percent")
const { mon_fee, mon_fen } = require("../helper/count")


function admin_income(time_start, time_end, time_start_double, time_end_double) {
    return (

        [
            {
                '$lookup': {
                    'from': 'sys_payment',
                    'as': 'pym',
                    'pipeline': [
                        {
                            '$sort': { '_id': -1 }
                        },
                        {
                            '$facet': {
                                'net_now': [
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
                                        '$addFields': {
                                            'icm': '$mon.fen'
                                        }
                                    }
                                ],
                                'net_double': [
                                    {
                                        '$match': {
                                            '$and': [
                                                { 'ep': { '$lte': time_start_double } },
                                                { 'ep': { '$gte': time_end_double } },
                                                { 'pym.sts': 'settlement' },
                                                { 'shp.sts': 'settlement' },

                                            ]
                                        }
                                    },
                                    {
                                        '$addFields': {
                                            'icm': '$mon.fen'
                                        }
                                    }
                                ],
                                'tax_now': [
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
                                        '$addFields': {
                                            'icm': { '$add': ['$mon.pph', '$mon.ppn'] }
                                        }
                                    }
                                ],
                                'tax_double': [
                                    {
                                        '$match': {
                                            '$and': [
                                                { 'ep': { '$lte': time_start_double } },
                                                { 'ep': { '$gte': time_end_double } },
                                                { 'pym.sts': 'settlement' },
                                                { 'shp.sts': 'settlement' },

                                            ]
                                        }
                                    },
                                    {
                                        '$addFields': {
                                            'icm': { '$add': ['$mon.pph', '$mon.ppn'] }
                                        }
                                    }
                                ],
                                'gross_now': [
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
                                        '$addFields': {
                                            'icm': mon_fee()
                                        }
                                    }
                                ],
                                'gross_double': [
                                    {
                                        '$match': {
                                            '$and': [
                                                { 'ep': { '$lte': time_start_double } },
                                                { 'ep': { '$gte': time_end_double } },
                                                { 'pym.sts': 'settlement' },
                                                { 'shp.sts': 'settlement' },

                                            ]
                                        }
                                    },
                                    {
                                        '$addFields': {
                                            'icm': mon_fee()
                                        }
                                    }
                                ],
                                'pph': [
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
                                        '$addFields': {
                                            'icm': '$mon.pph'
                                        }
                                    }
                                ],
                                'ppn': [
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
                                        '$addFields': {
                                            'icm': '$mon.ppn'
                                        }
                                    }
                                ],

                            }
                        },
                        {
                            '$project': {
                                'net_now': { '$ifNull': [{ '$sum': '$net_now.icm' }, { '$toInt': '0' }] },
                                'net_double': { '$ifNull': [{ '$sum': '$net_double.icm' }, { '$toInt': '0' }] },
                                'tax_now': { '$ifNull': [{ '$sum': '$tax_now.icm' }, { '$toInt': '0' }] },
                                'tax_double': { '$ifNull': [{ '$sum': '$tax_double.icm' }, { '$toInt': '0' }] },
                                'gross_now': { '$ifNull': [{ '$sum': '$gross_now.icm' }, { '$toInt': '0' }] },
                                'gross_double': { '$ifNull': [{ '$sum': '$gross_double.icm' }, { '$toInt': '0' }] },
                                'pph': { '$ifNull': [{ '$sum': '$pph.icm' }, { '$toInt': '0' }] },
                                'ppn': { '$ifNull': [{ '$sum': '$ppn.icm' }, { '$toInt': '0' }] },
                                '_id': 0
                            }
                        }
                    ]
                }
            },
            {
                '$addFields': {
                    'pym_net_now': { '$first': '$pym.net_now' },
                    'pym_net_double': { '$first': '$pym.net_double' },
                    'pym_tax_now': { '$first': '$pym.tax_now' },
                    'pym_tax_double': { '$first': '$pym.tax_double' },
                    'pym_gross_now': { '$first': '$pym.gross_now' },
                    'pym_gross_double': { '$first': '$pym.gross_double' },
                    'pym_pph': { '$first': '$pym.pph' },
                    'pym_ppn': { '$first': '$pym.ppn' },
                }
            },
            {
                '$lookup': {
                    'from': 'sys_vouchers',
                    'as': 'vch',
                    'pipeline': [
                        {
                            '$sort': { '_id': -1 }
                        },
                        {
                            '$facet': {
                                'net_now': [
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
                                        '$addFields': {
                                            'icm': '$mon.fen'
                                        }
                                    }
                                ],
                                'net_double': [
                                    {
                                        '$match': {
                                            '$and': [
                                                { 'ep': { '$lte': time_start_double } },
                                                { 'ep': { '$gte': time_end_double } },
                                                { 'pym.sts': 'settlement' },


                                            ]
                                        }
                                    },
                                    {
                                        '$addFields': {
                                            'icm': '$mon.fen'
                                        }
                                    }
                                ],
                                'tax_now': [
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
                                        '$addFields': {
                                            'icm': { '$add': ['$mon.pph', '$mon.ppn'] }
                                        }
                                    }
                                ],
                                'tax_double': [
                                    {
                                        '$match': {
                                            '$and': [
                                                { 'ep': { '$lte': time_start_double } },
                                                { 'ep': { '$gte': time_end_double } },
                                                { 'pym.sts': 'settlement' },


                                            ]
                                        }
                                    },
                                    {
                                        '$addFields': {
                                            'icm': { '$add': ['$mon.pph', '$mon.ppn'] }
                                        }
                                    }
                                ],
                                'gross_now': [
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
                                        '$addFields': {
                                            'icm': mon_fee()
                                        }
                                    }
                                ],
                                'gross_double': [
                                    {
                                        '$match': {
                                            '$and': [
                                                { 'ep': { '$lte': time_start_double } },
                                                { 'ep': { '$gte': time_end_double } },
                                                { 'pym.sts': 'settlement' },


                                            ]
                                        }
                                    },
                                    {
                                        '$addFields': {
                                            'icm': mon_fee()
                                        }
                                    }
                                ],
                                'pph': [
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
                                        '$addFields': {
                                            'icm': '$mon.pph'
                                        }
                                    }
                                ],
                                'ppn': [
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
                                        '$addFields': {
                                            'icm': '$mon.ppn'
                                        }
                                    }
                                ],

                            }
                        },
                        {
                            '$project': {
                                'net_now': { '$ifNull': [{ '$sum': '$net_now.icm' }, { '$toInt': '0' }] },
                                'net_double': { '$ifNull': [{ '$sum': '$net_double.icm' }, { '$toInt': '0' }] },
                                'tax_now': { '$ifNull': [{ '$sum': '$tax_now.icm' }, { '$toInt': '0' }] },
                                'tax_double': { '$ifNull': [{ '$sum': '$tax_double.icm' }, { '$toInt': '0' }] },
                                'gross_now': { '$ifNull': [{ '$sum': '$gross_now.icm' }, { '$toInt': '0' }] },
                                'gross_double': { '$ifNull': [{ '$sum': '$gross_double.icm' }, { '$toInt': '0' }] },
                                'pph': { '$ifNull': [{ '$sum': '$pph.icm' }, { '$toInt': '0' }] },
                                'ppn': { '$ifNull': [{ '$sum': '$ppn.icm' }, { '$toInt': '0' }] },
                                '_id': 0
                            }
                        }
                    ]
                }
            },
            {
                '$addFields': {
                    'vch_net_now': { '$first': '$vch.net_now' },
                    'vch_net_double': { '$first': '$vch.net_double' },
                    'vch_tax_now': { '$first': '$vch.tax_now' },
                    'vch_tax_double': { '$first': '$vch.tax_double' },
                    'vch_gross_now': { '$first': '$vch.gross_now' },
                    'vch_gross_double': { '$first': '$vch.gross_double' },
                    'vch_pph': { '$first': '$vch.pph' },
                    'vch_ppn': { '$first': '$vch.ppn' },
                }
            },
            {
                '$limit': 1
            },
            {
                '$addFields': {
                    'adm_net_now': { '$add': ['$vch_net_now', '$pym_net_now'] },
                    'adm_net_double': { '$add': ['$vch_net_double', '$pym_net_double'] },
                    'adm_tax_now': { '$add': ['$vch_tax_now', '$pym_tax_now'] },
                    'adm_tax_double': { '$add': ['$vch_tax_double', '$pym_tax_double'] },
                    'adm_gross_now': { '$add': ['$vch_gross_now', '$pym_gross_now'] },
                    'adm_gross_double': { '$add': ['$vch_gross_double', '$pym_gross_double'] },


                }
            },
            {
                '$addFields': {
                    'percent_net': percent_aggregate('$adm_net_now', '$adm_net_double'),
                    'percent_tax': percent_aggregate('$adm_tax_now', '$adm_tax_double'),
                    'percent_gross': percent_aggregate('$adm_gross_now', '$adm_gross_double'),
                    'range_day': range_day_aggregate(time_start, time_end)
                }
            },
            {
                '$project': {
                    'net': {
                        'income': '$adm_net_now',
                        'percent': '$percent_net',
                        'diff_day': '$range_day',
                        'label': 'Netto'
                    },
                    'tax': {
                        'income': '$adm_tax_now',
                        'percent': '$percent_tax',
                        'diff_day': '$range_day',
                        'label': 'Tax'


                    },
                    'gross': {
                        'income': '$adm_gross_now',
                        'percent': '$percent_gross',
                        'diff_day': '$range_day',
                        'label': 'Gross'


                    },
                    'product': {
                        'pph': '$pym_pph',
                        'ppn': '$pym_ppn',
                        'diff_day': '$range_day',
                        'label': 'Product'


                    },
                    'voucher': {
                        'pph': '$vch_pph',
                        'ppn': '$vch_ppn',
                        'diff_day': '$range_day',
                        'label': 'Voucher'


                    },
                    '_id': 0,
                }
            }
        ]
    )
}


module.exports = { admin_income }