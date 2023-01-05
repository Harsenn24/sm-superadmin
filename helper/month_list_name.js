function changeToMonth(data) {

    let monthNumber = data.split('-')[0]

    if(monthNumber === '01') {
        return `Januari ${ data.split('-')[1]}`
    }
    if(monthNumber === '02') {
        return `Februari ${ data.split('-')[1]}`
    }
    if(monthNumber === '03') {
        return `Maret ${ data.split('-')[1]}`
    }
    if(monthNumber === '04') {
        return `April ${ data.split('-')[1]}`
    }
    if(monthNumber === '05') {
        return `Mei ${ data.split('-')[1]}`
    }
    if(monthNumber === '06') {
        return `Juni ${ data.split('-')[1]}`
    }
    if(monthNumber === '07') {
        return `Juli ${ data.split('-')[1]}`
    }
    if(monthNumber === '08') {
        return `Agustus ${ data.split('-')[1]}`
    }
    if(monthNumber === '09') {
        return `September ${ data.split('-')[1]}`
    }
    if(monthNumber === '10') {
        return `Oktober ${ data.split('-')[1]}`
    }
    if(monthNumber === '11') {
        return `November ${ data.split('-')[1]}`
    }
    if(monthNumber === '12') {
        return `Desember ${ data.split('-')[1]}`
    }

}



module.exports = {
    changeToMonth
}