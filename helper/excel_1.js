const excel = require('exceljs')
const { convertAlphabet } = require("./alphabet")
const { rupiah_currency } = require("./rupiah")




function excel_download(sheet_generate, column_name, value_data ) {
    
    let coloum = Object.keys(column_name)

    let ws_column_name = coloum.map(el => {
        return {
            header: el,
            key: el,
            width: 30,
        }
    })

    sheet_generate.columns = ws_column_name

    for (let i = 0; i < value_data.length; i++) {
        sheet_generate.getRow(i + 2).values = value_data[i]
        sheet_generate.getRow(i + 2).alignment = { vertical: 'middle', horizontal: 'left' };
    }

    sheet_generate.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };
    sheet_generate.getRow(1).font = {
        bold: true,
        name: 'Times New Roman',
        color: { argb: 'FFFFFF' },
    }

    for (let i = 0; i < coloum.length; i++) {
        let column = convertAlphabet(i)
        sheet_generate.getCell(`${column}1`).fill = {
            fgColor: { argb: '2E7D32' },
            type: 'pattern',
            pattern: 'solid',
        };
    }

    return sheet_generate


}



module.exports = {
    excel_download
}