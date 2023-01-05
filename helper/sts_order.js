const switch_status_order = {
    '$switch': {
        'branches': [
            {
                'case': {
                    '$and': [
                        { '$eq': ['$pym.sts', 'failed'] },
                    ]
                },
                'then': 'failed'
            },
            {
                'case': {
                    '$and': [
                        { '$in': ['$pym.sts', ['settlement', 'success', 'pending']] },
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
                        { '$in': ['$pym.sts', ['settlement', 'refund-pending']] },
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
                        { '$in': ['$pym.sts', ['settlement', 'refund-pending']] },
                        { '$in': ['$shp.sts', ['cancel-request', 'cancel-pending', 'cancelled', 'canceled']] },
                    ]
                },
                'then': 'refund'
            },
            {
                'case': {
                    '$and': [
                        { '$in': ['$pym.sts', ['settlement', 'refund-pending']] },
                        { '$in': ['$shp.sts', ['return-request', 'return-pending', 'returning', 'returned']] },
                    ]
                },
                'then': 'returned'
            }
        ],
        'default': 'unknown'
    }
}

module.exports = switch_status_order