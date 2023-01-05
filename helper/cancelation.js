const { rt_link } = process.env
const cancelation = {
    'date': { '$ifNull': [{ '$toDate': { '$multiply': ['$isc.ep', 1000] } }, null] },
    'type': { '$ifNull': ['$isc.typ', null] },
    'canceled_by': { '$ifNull': ['$isc.cb', null] },
    'reason': { '$ifNull': ['$isc.rsn', null] },
    'description': { '$ifNull': ['$isc.des', null] },
    'tracking_id': { '$ifNull': ['$isc.tid', null] },
    'destination': { '$ifNull': ['$isc.dsc.des', null] },
    'phone': { '$ifNull': ['$isc.dsc.phn', null] },
    'label': { '$ifNull': ['$isc.dsc.nme', null] },
    'status': { '$ifNull': ['$isc.trf.sts', null] },
    'destination': { '$ifNull': ['$isc.dsc.des', null] },
    'code': { '$ifNull': ['$isc.dsc.cod', null] },
    'zip_code': { '$ifNull': ['$isc.dsc.zip', null] },
    'resi': { '$ifNull': ['$isc.shp.rsi', null] },
    'resi': { '$ifNull': ['$isc.shp.rsi', null] },
    'image': {
        '$ifNull': [{
            '$map': {
                'input': '$isc.fle',
                'in': { '$concat': [`${rt_link}secure/c/media/returned/image/`, '$$this'] }
            }
        }, null]
    },
    'video': {
        '$ifNull': [{
            '$map': {
                'input': '$isc.vid',
                'in': { '$concat': [`${rt_link}secure/c/media/returned/video/`, '$$this'] }
            }
        }, null]
    },
}

module.exports = { cancelation }
