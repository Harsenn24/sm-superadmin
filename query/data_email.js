function company_info() {
    const query = [
        {
            '$match': {
                '$and': [
                    { 'type': 'company' },
                    { 'subtype': 'information' },
                ]
            }
        },
        {
            '$unwind': { 'path': '$data' }
        },
        {
            '$project': {
                'company_name' : '$data.name',
                'logo_sm' : '$data.logo',
                'twitter_link' : '$data.twitter',
                'facebook_link' : '$data.facebook',
                'instagram_link' : '$data.instagram',
                'google_play_link' : '$data.playstore',
                'app_store_link' : '$data.appstore',
                'email_sm' : '$data.email_help',
                'address' : '$data.address',
                '_id' : 0
            }
        }
    ]

    return query
}


function badge_data() {
    const query = [
        {
            '$match': {
                '$and': [
                    { 'type': 'logo' },
                ]
            }
        },
        {
            '$unwind': { 'path': '$data' }
        },
        {
            '$project': {
                'skinmystery_badge': '$data.skinmystery',
                'app_store_badge': '$data.app-store',
                'twitter_badge': '$data.twitter',
                'facebook_badge': '$data.facebook',
                'instagram_badge': '$data.instagram',
                'google_play_badge': '$data.google-play-badge',
                '_id': 0
            }
        }
    ]

    return query
}
module.exports = { company_info, badge_data }