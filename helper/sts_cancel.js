const switch_cancel = {
    '$switch': {
        'branches': [
            {
                'case': {
                    '$and': [
                        { '$eq': ['$pym.sts', 'settlement'] },
                        { '$eq': ['$shp.sts', 'cancel-request'] },
                        { '$eq': ['$isc.by', 'user'] }
                    ]
                },
                'then': 'cancel_process'
            },
            {
                'case': {
                    '$and': [
                        { '$eq': ['$pym.sts', 'settlement'] },
                        { '$in': ['$shp.sts', ['canceled', 'cancelled']] },
                        { '$ne': ['$isc.by', null] }
                    ]
                },
                'then': 'canceled'
            },
        ],
        'default': 'unknwon'
    }
}

module.exports = switch_cancel