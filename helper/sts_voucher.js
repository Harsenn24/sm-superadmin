const statusVch = {
    '$switch': {
        'branches': [
            {
                'case': {
                    '$and': [
                        { '$gt': ['$lmt', 0] },
                        { '$lt': [(new Date().getTime()) / 1000, '$epe'] },
                    ]
                },
                'then': 'Aktif'
            },
            {
                'case': {
                    '$and': [
                        { '$eq': ['$lmt', 0] },
                        { '$lt': [(new Date().getTime()) / 1000, '$epe'] },
                    ]
                },
                'then': 'Habis'
            },
            {
                'case': {
                    '$and': [
                        { '$gt': [(new Date().getTime()) / 1000, '$epe'] },
                    ]
                },
                'then': 'Kadaluarsa'
            },
        ],
        'default': 'unknown'
    }
}

module.exports = { statusVch }