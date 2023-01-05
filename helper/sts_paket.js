const switchbranch = {
    '$switch': {
        'branches': [
            {
                'case': {
                    '$and': [
                        { '$in': ['$pym.sts', ['settlement', 'success']] },
                        { '$eq': ['$shp.sts', 'pending'] }
                    ]
                },
                'then': 'new_order'
            },
            {
                'case': {
                    '$and': [
                        { '$eq': ['$pym.sts', 'settlement'] },
                        { '$eq': ['$shp.sts', 'packed'] }
                    ]
                },
                'then': 'packed'
            },
            {
                'case': {
                    '$and': [
                        { '$eq': ['$pym.sts', 'settlement'] },
                        { '$in': ['$shp.sts', ['shipping', 'shipping-arrive', 'shipping-deliver']] }
                    ]
                },
                'then': 'shipping'
            },
            {
                'case': {
                    '$and': [
                        { '$eq': ['$pym.sts', 'settlement'] },
                        { '$eq': ['$shp.sts', 'settlement'] }
                    ]
                },
                'then': 'done'
            },
            {
                'case': {
                    '$and': [
                        { '$eq': ['$pym.sts', 'settlement'] },
                        { '$in': ['$shp.sts', ['canceled', 'cancelled']] },
                    ]
                },
                'then': 'canceled'
            },
            {
                'case': {
                    '$and': [
                        { '$eq': ['$pym.sts', 'settlement'] },
                        { '$eq': ['$shp.sts', 'cancel-pending'] },
                    ]
                },
                'then': 'cancel_process'
            },
            {
                'case': {
                    '$and': [
                        { '$eq': ['$pym.sts', 'settlement'] },
                        { '$eq': ['$shp.sts', 'returned'] },
                    ]
                },
                'then': 'returned'
            },
            {
                'case': {
                    '$and': [
                        { '$eq': ['$pym.sts', 'settlement'] },
                        { '$eq': ['$shp.sts', 'return-request'] },
                    ]
                },
                'then': 'return_process'
            }
        ],
        'default': '-'
    }
}

module.exports = switchbranch