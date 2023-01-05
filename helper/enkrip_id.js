const encrypt = 'function e(n,e=0,i=!1){var t="abcdefghijklmnopqrstuvwxyz0123456789/".split("");1==i&&(t="ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789/".split(""));for(var l=t.slice(t.length-e,t.length),r=t.slice(0,t.length-e),c=l.concat(r),f=[],h=0;h<n.length;h++){var o="";o=void 0===c[t.indexOf(n[h])]?n[n.indexOf(n[h])]:c[t.indexOf(n[h])],f.push(o)}return f.join("")}'
const encryptId = function e(n,e=0,i=!1){var t="abcdefghijklmnopqrstuvwxyz0123456789/".split("");1==i&&(t="ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789/".split(""));for(var l=t.slice(t.length-e,t.length),r=t.slice(0,t.length-e),c=l.concat(r),f=[],h=0;h<n.length;h++){var o="";o=void 0===c[t.indexOf(n[h])]?n[n.indexOf(n[h])]:c[t.indexOf(n[h])],f.push(o)}return f.join("")}
const decrypt =  'function d(n,e,i=!1){var t="abcdefghijklmnopqrstuvwxyz0123456789/".split("");1==i&&(t="ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789/".split(""));for(var l=t.slice(t.length-e,t.length),r=t.slice(0,t.length-e),c=l.concat(r),d=[],f=0;f<n.length;f++){var h="";h=void 0===c[t.indexOf(n[f])]?n[n.indexOf(n[f])]:t[c.indexOf(n[f])],d.push(h)}return d.join("")}'
const decryptId =  function d(n,e,i=!1){var t="abcdefghijklmnopqrstuvwxyz0123456789/".split("");1==i&&(t="ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789/".split(""));for(var l=t.slice(t.length-e,t.length),r=t.slice(0,t.length-e),c=l.concat(r),d=[],f=0;f<n.length;f++){var h="";h=void 0===c[t.indexOf(n[f])]?n[n.indexOf(n[f])]:t[c.indexOf(n[f])],d.push(h)}return d.join("")}

module.exports = {
    encrypt,
    decrypt,
    encryptId,
    decryptId
}