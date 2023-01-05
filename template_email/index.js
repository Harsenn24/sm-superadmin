const ejs = require('ejs');
const { configTrasnport1, configTrasnport2 } = require('../helper/configEmail')
const nodemailer = require('nodemailer');
const { configMongo } = require("../config/index")

function template_accept_seller(data) {

    let result = 0

    ejs.renderFile(__dirname + `/success.ejs`, { data }, (err, resultHTML) => {
        if (err) {
            console.log(err);
            result = false
        } else {
            const transporter = nodemailer.createTransport(configTrasnport1)

            const mailOptions = {
                from: configMongo['email']['from'],
                to: data.email,
                subject: 'Skin Mystery - Verifikasi Pendaftaran Toko Berhasil',
                html: resultHTML
            };

            transporter.sendMail(mailOptions)
            result = true

        }
    });

    return result

};


function template_reject_seller(data) {

    let result = 0

    ejs.renderFile(__dirname + `/rejected.ejs`, { data }, (err, resultHTML) => {
        if (err) {
            console.log(err);
            result = false
        } else {
            const transporter = nodemailer.createTransport(configTrasnport1)

            const mailOptions = {
                from: configMongo['email']['from'],
                to: data.email,
                subject: 'Skin Mystery - Verivikasi Pendaftaran Toko Ditolak',
                html: resultHTML
            };

            transporter.sendMail(mailOptions)
            result = true

        }
    });

    return result

};



function investigated_return_request(data, name, email) {

    let result = 0

    ejs.renderFile(__dirname + `/investigated.ejs`, { data, name }, (err, resultHTML) => {
        if (err) {
            console.log(err);
            result = false
        } else {
            const transporter = nodemailer.createTransport(configTrasnport1)

            const mailOptions = {
                from: configMongo['email']['from'],
                to: email,
                subject: 'Skin Mystery - Investigasi Oleh Pihak Skin Mystery',
                html: resultHTML
            };

            transporter.sendMail(mailOptions)
            result = true

        }
    });

    return result

};


function reject_return_goods(data, record_data, product_detail, name, email, type) {

    let result = 0

    ejs.renderFile(__dirname + `/goods_failed.ejs`, { data, record_data, product_detail, name }, (err, resultHTML) => {
        if (err) {
            console.log(err);
            result = false
        } else {
            const transporter = nodemailer.createTransport(configTrasnport1)

            const mailOptions = {
                from: configMongo['email']['from'],
                to: email,
                subject: `Skin Mystery - Pengajuan ${type} Ditolak`,
                html: resultHTML
            };

            transporter.sendMail(mailOptions)
            result = true

        }
    });

    return result

};


function accept_return_goods(data, record_data, product_detail, name, email, type) {

    let result = 0

    ejs.renderFile(__dirname + `/good_fund_accepted.ejs`, { data, record_data, product_detail, name }, (err, resultHTML) => {
        if (err) {
            console.log(err);
            result = false
        } else {
            const transporter = nodemailer.createTransport(configTrasnport1)

            const mailOptions = {
                from: configMongo['email']['from'],
                to: email,
                subject: `Skin Mystery - Pengajuan Pengembalian  ${type} Disetujui`,
                html: resultHTML
            };

            transporter.sendMail(mailOptions)
            result = true

        }
    });

    return result

};

module.exports = {
    template_accept_seller,
    template_reject_seller,
    investigated_return_request,
    reject_return_goods,
    accept_return_goods
};