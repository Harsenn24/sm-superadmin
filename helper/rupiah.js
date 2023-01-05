function rupiah_currency(number) {
    return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR" }).format(number);
}

const rupiah_format_mongo = 'function(r){for(var r=r.toString(),n=[],t="",o=r.length-1;o>=0;o--)t+=r[o];for(var o=0,e=t.length;e>o;o+=3){const f=t.substring(o,o+3);for(var g="",s=f.length-1;s>=0;s--)g+=f[s];n.push(g)}return n.reverse().join(".")}'



module.exports = {
    rupiah_currency,
    rupiah_format_mongo
}