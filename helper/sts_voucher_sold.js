const statusVchSold = {
    '$switch': {
        'branches': [
            {
                'case': {
                    '$and': [
                        { '$gte': [{ '$size': '$isu' }, 1] },
                        { '$gt': [(new Date().getTime()) / 1000, '$epe'] },
                    ]
                },
                'then': 'Terpakai'
            },
            {
                'case': {
                    '$and': [
                        { '$eq': [{ '$size': '$isu' }, 0] },
                        { '$gt': [(new Date().getTime()) / 1000, '$epe'] },

                    ]
                },
                'then': 'Belum Dipakai'
            },
            {
                'case': {
                    '$and': [
                        { '$lt': [(new Date().getTime()) / 1000, '$epe'] },
                    ]
                },
                'then': 'Expired'
            },
        ],
        'default': 'unknown'
    }
}

module.exports = statusVchSold