function statusKupon() {
    const status = {
        '$switch': {
            'branches': [
                {
                    'case': {
                        '$and': [
                            { '$gte': ['$now_coupon', 1] },
                            { '$lt': [(new Date().getTime()) / 1000, '$epe'] },
                        ]
                    },
                    'then': 'Aktif'
                },
                {
                    'case': {
                        '$and': [
                            { '$lte': ['$now_coupon', 0] },
                        ]
                    },
                    'then': 'Habis'
                },
                {
                    'case': {
                        '$and': [
                            { '$gte': [(new Date().getTime()) / 1000, '$epe'] },
                        ]
                    },
                    'then': 'Expired'
                },
            ],
            'default': 'unknown'
        }
    }

    return status
}



function status_coupon_v2() {
    const status = {
        '$switch': {
            'branches': [
                {
                    'case': {
                        '$and': [
                            { '$eq': ['$act', true] },
                            { '$lt': [(new Date().getTime()) / 1000, '$epe'] },
                        ]
                    },
                    'then': 'Berjalan'
                },
                {
                    'case': {
                        '$and': [
                            { '$eq': ['$act', true] },
                            { '$gte': [(new Date().getTime()) / 1000, '$epe'] },
                        ]
                    },
                    'then': 'Selesai'
                },
                {
                    'case': {
                        '$and': [
                            { '$eq': ['$act', true] },
                        ]
                    },
                    'then': 'Aktif'
                },
                {
                    'case': {
                        '$and': [
                            { '$eq': ['$act', false] },
                        ]
                    },
                    'then': 'Tidak Aktif'
                },
            ],
            'default': 'unknown'
        }
    }

    return status
}

module.exports = { statusKupon, status_coupon_v2 }