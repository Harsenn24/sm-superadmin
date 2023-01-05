const storeSchema = {
    ep: { type: Number },
    slg: { type: String },
    com: { type: String },
    det: {
        nms: { type: String },
        nme: { type: Array },
        ban: { type: Boolean },
        act: { type: Boolean },
        lbl: { type: String },
        img: { type: String },
        des: { type: String },
        col: { type: String },
        ioc: { type: Boolean },
        on: { type: Number },
        pin: { type: String }
    },
    ctc: {
        jbt: { type: String },
        pic: { type: String },
        fax: { type: String },
        eml: { type: String },
        phn: { type: Number },
        soc: { type: String }
    },
    lgl: {
        npw: { type: String },
        siu: { type: String },
        cbt: { type: String }
    },
    bnr: {
        bnt: { type: Number },
        bna: {
            dp: { type: String },
            _p: { type: String }
        },
        bnb: {
            dp: { type: String },
            _p: { type: String }
        },
        bnc: {
            dp: { type: String },
            _p: { type: String }
        },
        bnd: {
            dp: { type: String },
            _p: { type: String }
        }
    },
    stf: { type: Array },
    shp: { type: Array },
    dcl: { type: Array },
    tme: { type: Array },
    dyn: {
        fns: { type: String },
        fnp: { type: String },
        lbr: { type: Array },
        iso: { type: Array }
    },
    ato: {
        cls: {
            act: { type: { type: Boolean } },
            con: { type: String }
        },
        ops: {
            act: { type: { type: Boolean } },
            con: { type: String }
        },
        wlm: {
            act: { type: { type: Boolean } },
            con: { type: String }
        },
        cat: { type: Array },
        prd: { type: Array },
        cht: { type: Array },
        smt: { type: Array },
        pgm: { type: Array },
        wlc: { type: Array },
        top: { type: Array }
    },
    doc: {
        opn: { type: Number },
        cls: { type: Number }
    }
}

module.exports = storeSchema
