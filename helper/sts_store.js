const status_store = {
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
            },
            {
                'case': { '$eq': [{ '$ifNull': ['$det.act', true] }, false] },
                'then': 'Postpone'
            },
            {
                'case': { '$lt': ['$dayRegist', 7] },
                'then': 'New Seller'
            },
        ],
        'default': 'Active'
    }
}

module.exports = status_store