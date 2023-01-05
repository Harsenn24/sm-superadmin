const sys_payment_schema = {
    sn: { type: Number },
    epu: { type: Number },
    inv: { type: String },
    oid: { type: Array },
    fee: { type: String },
    dat: { type: Array },
    tme: {
        sts: { type: String },
        eps: { type: Number },
        epe: { type: Number }
    },
    mon: { type: Object },
    pym: { type: Object },
    shp: {
        sts: { type: String }
    },
    isc: { type: Object },
    cpn: { type: Array },
}

module.exports = sys_payment_schema