const status_cek = {
    '$switch': {
        'branches': [
            {
                'case': {
                    '$and': [
                        { '$eq': ['$det.act', false] },
                        { '$eq': [{ '$ifNull': ['$epj', null] }, '$epj'] },
                    ]
                },
                'then': 'reject'
            }
        ],
        'default': 'Active'
    }
}

module.exports = status_cek