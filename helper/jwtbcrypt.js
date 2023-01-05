const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { KEY } = process.env;

function hashPassword(password) {
    return bcrypt.hashSync(password, 12);
}

function checkPassword(input, hashed) {
    return bcrypt.compareSync(input, hashed);
}

function createToken(payload) {
    return jwt.sign(payload, KEY);
}

function verifyToken(token) {
    return jwt.verify(token, KEY);
}

function LatteJWT(payload, type, origin = 'Super') {
    let lower = "abcdefghijklmnopqrstuvwxyz0123456789/".split("");
    let upper = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789/".split("");

    const e = (n, e = 0, i = !1) => {
        var t = lower;
        1 == i && (t = upper);
        for (var l = t.slice(t.length - e, t.length), r = t.slice(0, t.length - e), c = l.concat(r), f = [], h = 0; h < n.length; h++) {
            var o = "";
            o = void 0 === c[t.indexOf(n[h])] ? n[n.indexOf(n[h])] : c[t.indexOf(n[h])], f.push(o)
        }
        return f.join("")
    }

    const d = (n, e, i = !1) => {
        var t = lower;
        1 == i && (t = upper);
        for (var l = t.slice(t.length - e, t.length), r = t.slice(0, t.length - e), c = l.concat(r), d = [], f = 0; f < n.length; f++) {
            var h = "";
            h = void 0 === c[t.indexOf(n[f])] ? n[n.indexOf(n[f])] : t[c.indexOf(n[f])], d.push(h)
        }
        return d.join("")
    }

    let encrypt123 = (dataToken) => {
        const vt = jwt.sign(dataToken, KEY, {
            algorithm: "HS512"
        });
        const va = vt.split('.').join('/')
        const vb = e(va, 17)
        const vc = e(vb, 13, 1)
        return `${origin} ${vc}`
    }

    let decrypt123 = (dataToken) => {
        const va = dataToken.toString().split(' ')
        const vb = va[va.length - 1]
        let vc = d(vb, 13, 1)
        let vd = d(vc, 17)
        vd = vd.split('/').join('.')
        return jwt.verify(vd, KEY)
    }

    if (type === 'encrypt') {
        return encrypt123(payload)
    }

    if (type === 'decrypt') {
        return decrypt123(payload)
    }
}

module.exports = {
    hashPassword,
    checkPassword,
    createToken,
    verifyToken,
    LatteJWT
};
