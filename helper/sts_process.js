const switch_status = {
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
                        { '$in': ['$shp.sts', ['cancel-pending', 'cancel-request']] },
                    ]
                },
                'then': 'cancel_process'
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
                        { '$in': ['$shp.sts', ['return-request', 'return-pending']] },
                    ]
                },
                'then': 'return_process'
            },
            {
                'case': {
                    '$and': [
                        { '$eq': ['$pym.sts', 'settlement'] },
                        { '$in': ['$shp.sts', ['returning', 'returned']] },
                    ]
                },
                'then': 'returned'
            },
        ],
        'default': 'unknown'
    }
}

module.exports = switch_status