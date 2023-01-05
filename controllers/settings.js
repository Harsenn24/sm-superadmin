const { hashPassword, checkPassword, verifyToken } = require("../helper/jwtbcrypt")
const { jsonData } = require("../middleware/sucess")
const { Config, Sa_user, Store, Sa_activity_log } = require("../model")
const { ObjectID } = require("bson")
const { queryPagination } = require("../helper/pagination")
const { encrypt, decryptId } = require("../helper/enkrip_id")
const { rt_link } = process.env
const nodemailer = require('nodemailer');
const { getDataMagicMirror } = require("../query/get_data_mm")
const { date2number } = require("../helper/date2number")
const { query_edit } = require("../query/edit_promo_mm")
const { configTrasnport1 } = require('../helper/configEmail')
const { configMongo } = require("../config/index")






class SettingController {

    static async showAdminFee(req, res, next) {
        try {
            const id = 'uqrxr4pzvw23r1ro0s1p3urq'
            const idDecrypt = decryptId(id, 12)

            const showAdminFee = await Config.aggregate(
                [
                    {
                        '$match': {
                            '$and': [
                                { '_id': ObjectID(idDecrypt) },
                            ]
                        }
                    },
                    {
                        '$addFields': {
                            'fee': {
                                '$filter': {
                                    'input': {
                                        '$map': {
                                            'input': '$data',
                                            'in': {
                                                '$cond': {
                                                    'if': { '$eq': ['$$this.type', 'fee'] },
                                                    'then': '$$this.value',
                                                    'else': []
                                                }
                                            }
                                        }
                                    },
                                    'cond': { '$ne': ['$$this', []] }
                                }
                            },
                            'fee-drop': {
                                '$filter': {
                                    'input': {
                                        '$map': {
                                            'input': '$data',
                                            'in': {
                                                '$cond': {
                                                    'if': { '$eq': ['$$this.type', 'fee-drop'] },
                                                    'then': {
                                                        'value': '$$this.value',
                                                        'target': '$$this.target',
                                                    },
                                                    'else': []
                                                }
                                            }
                                        }
                                    },
                                    'cond': { '$ne': ['$$this', []] }
                                }
                            }
                        }
                    },
                    {
                        '$unwind': { 'path': '$fee' }
                    },
                    {
                        '$unwind': { 'path': '$fee-drop' }
                    },
                    {
                        '$addFields': {
                            'feeDiscount': {
                                '$round': [
                                    {
                                        '$multiply': [
                                            {
                                                '$divide': [
                                                    { '$subtract': ['$fee', '$fee-drop.value'] }, '$fee'
                                                ]
                                            },
                                            100
                                        ]
                                    }, 2
                                ]
                            }
                        }
                    },
                    {
                        '$project': {
                            'setting_default': '$fee',
                            'minimum_trx': '$fee-drop.target',
                            'admin_discount': '$feeDiscount',
                            '_id': 0

                        }
                    }
                ]
            )

            res.status(200).json(jsonData(showAdminFee[0]))
        } catch (error) {
            console.log(error);
            next(error)
        }
    }

    static async edit_admin_fee(req, res, next) {
        try {
            const { value_fee, minimum_trx, admin_fee_disc } = req.body

            const id = 'uqrxr4pzvw23r1ro0s1p3urq'

            const idDecrypt = decryptId(id, 12)

            if (!value_fee) {
                throw { message: 'Fee is required' }
            }

            if (!minimum_trx) {
                throw { message: 'Minimum transaction is required' }
            }

            if (!admin_fee_disc) {
                throw { message: 'Admin fee discount is required' }
            }

            const newFee = (+value_fee / 100)
            const newMinimumTrx = +minimum_trx
            const newAdmFeeDis = (+admin_fee_disc / 100)

            if (isNaN(newFee) || isNaN(newMinimumTrx) || isNaN(newAdmFeeDis)) {
                throw { message: 'Input must be a Number' }
            }

            let newValueFeedDrop = (+(newFee - (newFee * newAdmFeeDis)).toFixed(3))

            const editDefaultAdmin = await Config.findOneAndUpdate(
                {

                    '_id': ObjectID(idDecrypt),
                    'data.type': 'fee'

                },
                {
                    '$set': { 'data.$.value': newFee }
                },
            )

            const editMinTrx = await Config.findOneAndUpdate(
                {
                    '_id': ObjectID(idDecrypt),
                    'data.type': 'fee-drop'
                },
                {
                    '$set': { 'data.$.target': newMinimumTrx }
                }
            )

            const editAdmDisc = await Config.findOneAndUpdate(
                {
                    '_id': ObjectID(idDecrypt),
                    'data.type': 'fee-drop'
                },
                {
                    '$set': { 'data.$.value': newValueFeedDrop }
                }
            )


            const { email, username } = req.user
            const activity = `Update setting biaya admin produk`
            const timeUpdate = date2number('')

            const addData = new Sa_activity_log(
                {
                    eml: email,
                    usr: username,
                    act: activity,
                    ep: timeUpdate
                }
            )


            if (editDefaultAdmin.data && editMinTrx.data && editAdmDisc.data) {
                addData.save((err) => {
                    if (err) {
                        console.log(err);
                        next(err)
                    } else {
                        res.status(200).json(jsonData())
                    }
                })
            } else {
                throw { message: 'Failed Edit Data!' }
            }
        } catch (error) {
            console.log(error)
            next(error)
        }
    }

    static async editAdminVoucher(req, res, next) {
        try {
            const { admin_voucher } = req.body
            const { id } = req.query

            if (!id) {
                throw { message: 'Id config is required' }
            }

            const idDecrypt = decryptId(id, 12)

            if (!admin_voucher) {
                throw { message: 'Admin voucher is required' }
            }

            const newFee = (+admin_voucher / 100)

            if (isNaN(newFee)) {
                throw { message: 'Input must be a Number' }
            }


            const editDefaultAdmin = await Config.findOneAndUpdate(
                {

                    '_id': ObjectID(idDecrypt),
                    'data.type': 'fee-voucher'

                },
                {
                    '$set': { 'data.$.value': newFee }
                },
            )

            const { email, username } = req.user
            const activity = `Update setting biaya admin voucher`
            const timeUpdate = date2number('')

            const addData = new Sa_activity_log(
                {
                    eml: email,
                    usr: username,
                    act: activity,
                    ep: timeUpdate
                }
            )

            if (editDefaultAdmin.data) {
                addData.save((err) => {
                    if (err) {
                        console.log(err);
                        next(err)
                    } else {
                        res.status(200).json(jsonData())
                    }
                })
            } else {
                throw { message: 'Failed Edit Data!' }
            }
        } catch (error) {
            console.log(error)
            next(error)
        }
    }

    static async editAdminDoctor(req, res, next) {
        try {
            const { admin_doctor } = req.body

            const { id } = req.query

            if (!id) {
                throw { message: 'Id config is required' }
            }

            const idDecrypt = decryptId(id, 12)

            if (!admin_doctor) {
                throw { message: 'Admin doctor is required' }
            }

            const newFee = (+admin_doctor / 100)

            if (isNaN(newFee)) {
                throw { message: 'Input must be a Number' }
            }

            const editDefaultAdmin = await Config.findOneAndUpdate(
                {

                    '_id': ObjectID(idDecrypt),
                    'data.type': 'fee-doctor'

                },
                {
                    '$set': { 'data.$.value': newFee }
                },
            )

            const { email, username } = req.user
            const activity = `Update setting biaya admin doctor`
            const timeUpdate = date2number('')

            const addData = new Sa_activity_log(
                {
                    eml: email,
                    usr: username,
                    act: activity,
                    ep: timeUpdate
                }
            )

            if (editDefaultAdmin.data) {
                addData.save((err) => {
                    if (err) {
                        console.log(err);
                        next(err)
                    } else {
                        res.status(200).json(jsonData())
                    }
                })
            } else {
                throw { message: 'Failed Edit Data!' }
            }
        } catch (error) {
            console.log(error)
            next(error)
        }
    }

    static async getDataTax(req, res, next) {
        try {
            const getDataTax = await Config.aggregate([
                {
                    '$match': { '_id': ObjectID('62393f1a78de3c30b4c1e632') }
                },
                {
                    '$project': {
                        'result': '$data',
                        '_id': 0
                    }
                }
            ])

            res.status(200).json(jsonData(getDataTax[0].result))
        } catch (error) {
            console.log(error)
            next(error)
        }
    }

    static async edit_pass(req, res, next) {
        try {
            const { old_pass, new_pass, confirm_pass } = req.body

            if (!old_pass) {
                throw { message: 'old password is required' }
            }

            if (!new_pass) {
                throw { message: 'new password is required' }
            }

            if (!confirm_pass) {
                throw { message: 'confirm password is required' }
            }

            if (new_pass !== confirm_pass) {
                throw { message: "Your password can't be different" }
            }

            const { authorization } = req.headers

            const email_logged = verifyToken(authorization).eml

            const findUser = await Sa_user.findOne({
                eml: email_logged
            })

            const checkPass = checkPassword(old_pass, findUser.pwd)


            if (checkPass === false) {
                throw { message: 'old passowrd is invalid' }
            }

            const hashNewPass = hashPassword(new_pass)

            const edit_user = await Sa_user.findOneAndUpdate(
                { 'eml': email_logged }, { '$set': { 'pwd': hashNewPass } }
            )

            const { eml, usr } = edit_user
            const activity = `${edit_user.usr} telah mengubah password`
            const timeUpdate = date2number('')

            const addData = new Sa_activity_log(
                {
                    eml,
                    usr,
                    act: activity,
                    ep: timeUpdate
                }
            )

            addData.save((err) => {
                if (err) {
                    console.log(err);
                    next(err)
                } else {
                    res.status(200).json(jsonData())
                }
            })

        } catch (error) {
            console.log(error)
            next(error)
        }
    }

    static async editFirstMember(req, res, next) {
        try {
            let { input_price } = req.body

            if (!input_price) { throw { message: 'Input price is required' } }

            const newPrice = +input_price

            if (isNaN(newPrice)) { throw { message: 'Input must be a Number' } }


            const idConfig = 'uqoqsz1xppoz0qtuot1ptso0'


            const idDecrypt = decryptId(idConfig, 12)


            const editFirstMember = await Config.findOneAndUpdate(
                {
                    '_id': ObjectID(idDecrypt),
                    'data.level': 1
                },
                {
                    '$set': { 'data.$.minimum': +input_price }
                }
            )

            const { email, username } = req.user
            const activity = `${username} mengedit minimum transaksi first member`
            const timeUpdate = date2number('')

            const addData = new Sa_activity_log(
                {
                    eml: email,
                    usr: username,
                    act: activity,
                    ep: timeUpdate
                }
            )

            if (editFirstMember.data) {
                addData.save((err) => {
                    if (err) {
                        console.log(err);
                        next(err)
                    } else {
                        res.status(200).json(jsonData())
                    }
                })
            } else {
                throw { message: 'Failed Edit Data!' }
            }

        } catch (error) {
            console.log(error);
            next(error)
        }
    }

    static async editSilverMember(req, res, next) {
        try {
            let { input_price } = req.body

            if (!input_price) { throw { message: 'Input price is required' } }

            let newPrice = +input_price

            if (isNaN(newPrice)) { throw { message: 'Input must be a Number' } }

            const idConfig = 'uqoqsz1xppoz0qtuot1ptso0'


            const idDecrypt = decryptId(idConfig, 12)

            const editSilverMember = await Config.findOneAndUpdate(
                {
                    '_id': ObjectID(idDecrypt),
                    'data.level': 2
                },
                {
                    '$set': { 'data.$.minimum': newPrice }
                }
            )

            const { email, username } = req.user
            const activity = `${username} mengedit minimum transaksi Silver member`
            const timeUpdate = date2number('')

            const addData = new Sa_activity_log(
                {
                    eml: email,
                    usr: username,
                    act: activity,
                    ep: timeUpdate
                }
            )

            if (editSilverMember.data) {
                addData.save((err) => {
                    if (err) {
                        console.log(err);
                        next(err)
                    } else {
                        res.status(200).json(jsonData())
                    }
                })
            } else {
                throw { message: 'Failed Edit Data!' }
            }

        } catch (error) {
            console.log(error);
            next(error)
        }
    }

    static async editGoldMember(req, res, next) {
        try {
            let { input_price } = req.body

            if (!input_price) { throw { message: 'Input price is required' } }

            let newPrice = +input_price

            if (isNaN(newPrice)) { throw { message: 'Input must be a Number' } }

            const idConfig = 'uqoqsz1xppoz0qtuot1ptso0'


            const idDecrypt = decryptId(idConfig, 12)


            const editGoldMember = await Config.findOneAndUpdate(
                {
                    '_id': ObjectID(idDecrypt),
                    'data.level': 3
                },
                {
                    '$set': { 'data.$.minimum': newPrice }
                }
            )

            const { email, username } = req.user
            const activity = `${username} mengedit minimum transaksi Gold member`
            const timeUpdate = date2number('')

            const addData = new Sa_activity_log(
                {
                    eml: email,
                    usr: username,
                    act: activity,
                    ep: timeUpdate
                }
            )

            if (editGoldMember.data) {
                addData.save((err) => {
                    if (err) {
                        console.log(err);
                        next(err)
                    } else {
                        res.status(200).json(jsonData())
                    }
                })
            } else {
                throw { message: 'Failed Edit Data!' }
            }

        } catch (error) {
            console.log(error);
            next(error)
        }
    }

    static async editDiamondMember(req, res, next) {
        try {
            let { input_price } = req.body

            if (!input_price) { throw { message: 'Input price is required' } }

            let newPrice = +input_price

            if (isNaN(newPrice)) { throw { message: 'Input must be a Number' } }

            const idConfig = 'uqoqsz1xppoz0qtuot1ptso0'


            const idDecrypt = decryptId(idConfig, 12)


            const editDiamondMember = await Config.findOneAndUpdate(
                {
                    '_id': ObjectID(idDecrypt),
                    'data.level': 4
                },
                {
                    '$set': { 'data.$.minimum': newPrice }
                }
            )

            const { email, username } = req.user
            const activity = `${username} mengedit minimum transaksi Diamond member`
            const timeUpdate = date2number('')

            const addData = new Sa_activity_log(
                {
                    eml: email,
                    usr: username,
                    act: activity,
                    ep: timeUpdate
                }
            )

            if (editDiamondMember.data) {
                addData.save((err) => {
                    if (err) {
                        console.log(err);
                        next(err)
                    } else {
                        res.status(200).json(jsonData())
                    }
                })
            } else {
                throw { message: 'Failed Edit Data!' }
            }

        } catch (error) {
            console.log(error);
            next(error)
        }
    }

    static async getMembershipData(req, res, next) {
        try {
            const idDecrypt = decryptId('uqoqsz1xppoz0qtuot1ptso0', 12)
            const getMembershipData = await Config.aggregate(
                [
                    {
                        '$match': { '_id': ObjectID(idDecrypt) }
                    },
                    {
                        '$project': {
                            'data': '$data',
                            '_id': 0
                        }
                    }
                ]
            )

            let newArr = []

            let result = getMembershipData[0].data
            for (let i = 0; i < result.length; i++) {

                let newObject = {}

                newObject.type = result[i].type
                newObject.minimum = result[i].minimum
                newObject.level = result[i].level

                if (result[i].level >= 1 && result[i].level < result.length) {
                    newObject.maximum = result[i + 1].minimum - 1
                } else {
                    newObject.maximum = 'infinity'
                }

                newArr.push(newObject)

            }

            res.status(200).json(jsonData(newArr))
        } catch (error) {
            console.log(error)
            next(error)
        }
    }

    static async storeBex(req, res, next) {
        try {
            const { page, item_limit, search_name } = req.query

            const id = 'uq1pqrtz21ru0xzpwzzopwzx'
            const idDecrypt = decryptId(id, 12)

            let filterName = 0

            if (search_name) {
                filterName = {
                    'store_name': {
                        '$regex': search_name,
                        '$options': 'i'
                    }
                }
            } else {
                filterName = {}
            }

            const storeBex = await Store.aggregate(queryPagination(
                [
                    {
                        '$lookup': {
                            'from': 'doctors',
                            'as': 'dc',
                            'localField': '_id',
                            'foreignField': '_s',
                            'pipeline': [
                                {
                                    '$match': { 'doc.isd': false }
                                },
                                {
                                    '$count': 'total'
                                }
                            ]
                        }
                    },
                    {
                        '$lookup': {
                            'from': 'config',
                            'as': 'cf',
                            'let': {
                                'idstore': '$_id'
                            },
                            'pipeline': [
                                {
                                    '$match': { '_id': ObjectID(idDecrypt) }
                                },
                                {
                                    '$addFields': {
                                        'defaultstatus': {
                                            '$first': {
                                                '$filter': {
                                                    'input': {
                                                        '$map': {
                                                            'input': '$data',
                                                            'in': {
                                                                '$cond': {
                                                                    'if': { '$eq': ['$$this.store_id', '$$idstore'] },
                                                                    'then': true,
                                                                    'else': []
                                                                }
                                                            }
                                                        }
                                                    },
                                                    'cond': {
                                                        '$ne': ['$$this', []]
                                                    }
                                                }
                                            }
                                        }
                                    }
                                },
                                {
                                    '$project': {
                                        'default': { '$ifNull': ['$defaultstatus', false] }
                                    }
                                }

                            ]
                        }
                    },
                    {
                        '$addFields': {
                            'store_id': {
                                '$function': {
                                    'body': encrypt,
                                    'args': [{ '$toString': '$_id' }, 12],
                                    'lang': 'js'
                                }
                            },
                            'store_name': '$det.nms',

                        }
                    },
                    {
                        '$match': filterName
                    },
                    {
                        '$unwind': { 'path': '$cf' }
                    }
                ],
                [
                    {
                        '$project': {
                            'store_name': '$det.nms',
                            'store_image': { '$concat': [`${rt_link}store/i/`, { '$toString': '$store_id' }] },
                            'total_bex': { '$ifNull': [{ '$first': '$dc.total' }, { '$toInt': '0' }] },
                            '_id': '$store_id',
                            'default': '$cf.default'
                        }
                    }
                ], page, 3, item_limit
            ))

            res.status(200).json(jsonData(storeBex[0]))
        } catch (error) {
            console.log(error);
            next(error)
        }
    }

    static async newStoreDefault(req, res, next) {
        try {
            const { id_store } = req.query
            const idDecrypt = decryptId(id_store, 12)

            const dataStore = {
                store_id: ObjectID(idDecrypt),
                open: 7200,
                close: 126000
            }

            const list_store = await Config.findById({
                '_id': ObjectID(`62c1235adc36b9a18aa018a9`)
            })

            const find_store = list_store.data.find(el => (el.store_id).toString() === idDecrypt)

            if (find_store) { throw { message: 'This store already in default' } }

            const newDefault = await Config.findOneAndUpdate(
                {
                    '_id': ObjectID(`62c1235adc36b9a18aa018a9`)
                },
                {
                    '$push': {
                        'data': dataStore
                    }
                }
            )

            res.status(200).json(jsonData())


        } catch (error) {
            console.log(error)
            next(error)
        }
    }

    static async deleteDefaultStore(req, res, next) {
        try {
            const { id_store } = req.query
            const idDecrypt = decryptId(id_store, 12)

            const list_store = await Config.findById({
                '_id': ObjectID(`62c1235adc36b9a18aa018a9`)
            })

            const find_store = list_store.data.find(el => (el.store_id).toString() === idDecrypt)

            if (!find_store) { throw { message: 'This store is not in default' } }

            const deleteDefault = await Config.findOneAndUpdate(
                {
                    '_id': ObjectID(`62c1235adc36b9a18aa018a9`)
                },
                {
                    '$pull': {
                        'data': { 'store_id': ObjectID(idDecrypt) }
                    }
                }
            )

            res.status(200).json(jsonData())

        } catch (error) {
            console.log(error);
            next(error)
        }
    }

    static async regisAdmin(req, res, next) {
        try {
            const { new_email, name, password } = req.body

            if (!new_email) { throw { message: 'Email is required' } }
            if (!name) { throw { message: 'Name is required' } }
            if (!password) { throw { message: 'password is required' } }

            let pwdEncrypt = hashPassword(password)

            const { type } = req.query

            if (!type) { throw { message: 'Type is required' } }

            const checkEmail = await Sa_user.findOne({ eml: new_email })

            if (checkEmail !== null) { throw { message: 'Email already in used' } }

            let levelAdmin = 0

            if (type === 'finance_admin') { levelAdmin = 2 }
            if (type === 'admin') { levelAdmin = 3 }
            if (type === 'superadmin') { levelAdmin = 99 }

            const regisAdmin = new Sa_user({
                usr: name,
                eml: new_email,
                pwd: pwdEncrypt,
                acs: levelAdmin
            })

            const transporter = nodemailer.createTransport(configTrasnport1);

            const mailOptions = {
                from: configMongo['email']['from'],
                to: new_email,
                subject: 'New Admin',
                text: `CONGRATULATIONS ${name}!\n\nYour email already been registered as ${type} Skin Mystery by :\n\nname : ${req.user.username}\n\nemail : ${req.user.email}`
            };

            transporter.sendMail(mailOptions, (err) => {
                if (err) {
                    throw { message: 'Failed send email' }
                } else {
                    regisAdmin.save((err) => {
                        if (err) {
                            console.log(err);
                            next(err)
                        } else {
                            res.status(200).json(jsonData())
                        }
                    })
                }
            })

        } catch (error) {
            console.log(error);
            next(error)
        }
    }

    static async deleteSuperAdmin(req, res, next) {
        try {
            const { admin_id } = req.params

            const idDecrypt = decryptId(admin_id, 12)

            const deleteSuperAdmin = await Sa_user.deleteOne({ _id: ObjectID(idDecrypt) })

            if (deleteSuperAdmin.deletedCount === 0) { throw { message: 'id not found' } }

            res.status(200).json(jsonData())

        } catch (error) {
            console.log(error);
            next(error)
        }
    }

    static async showAllAdmin(req, res, next) {
        try {
            const superAdmin = await Sa_user.aggregate(
                [
                    {
                        '$match': { 'acs': 99 }
                    },
                    {
                        '$project': {
                            '_id': {
                                '$function': {
                                    'body': encrypt,
                                    'args': [{ '$toString': '$_id' }, 12],
                                    'lang': 'js'
                                }
                            },
                            'username': '$usr',
                            'email': '$eml'
                        }
                    }
                ]
            )

            const admin = await Sa_user.aggregate(
                [
                    {
                        '$match': { 'acs': 3 }
                    },
                    {
                        '$project': {
                            '_id': {
                                '$function': {
                                    'body': encrypt,
                                    'args': [{ '$toString': '$_id' }, 12],
                                    'lang': 'js'
                                }
                            },
                            'username': '$usr',
                            'email': '$eml'
                        }
                    }
                ]
            )

            const financeAdmin = await Sa_user.aggregate(
                [
                    {
                        '$match': { 'acs': 2 }
                    },
                    {
                        '$project': {
                            '_id': {
                                '$function': {
                                    'body': encrypt,
                                    'args': [{ '$toString': '$_id' }, 12],
                                    'lang': 'js'
                                }
                            },
                            'username': '$usr',
                            'email': '$eml'
                        }
                    }
                ]
            )

            const result = {
                superadmin: superAdmin,
                finance_admin: financeAdmin,
                admin: admin
            }

            res.status(200).json(jsonData(result))
        } catch (error) {
            console.log(error);
            next(error)
        }
    }


    static async magicMirrorDaily(req, res, next) {
        try {

            const magicMirrorDaily = await Config.aggregate(getDataMagicMirror('daily'))

            let [showResult] = magicMirrorDaily[0].result.filter((el) => { if (el.price > 0) { return el } })

            let end_promo = date2number(showResult.promo.promo_start) + 86400

            let status = showResult.promo.promo_status

            if (end_promo < date2number('') || status === false) {
                const editMagicMirror = await Config.findOneAndUpdate(
                    {
                        '_id': ObjectID('61e11eb66ed4a5ac60b222ef'),
                        'data.type': 'daily'
                    },
                    [
                        query_edit(showResult.price, false, 0, null, null, 'daily')
                    ]
                )

                res.status(200).json(jsonData(showResult))
            } else {
                res.status(200).json(jsonData(showResult))
            }

        } catch (error) {
            console.log(error);
            next(error)
        }
    }


    static async magicMirrorMonthly(req, res, next) {
        try {
            const magicMirrorMonthly = await Config.aggregate(getDataMagicMirror('monthly'))

            const [showResult] = magicMirrorMonthly[0].result.filter((el) => { if (el.price > 0) { return el } })


            let end_promo = date2number(showResult.promo.promo_end)

            let status = showResult.promo.promo_status

            if (end_promo < date2number('') || status === false) {
                const editMagicMirror = await Config.findOneAndUpdate(
                    {
                        '_id': ObjectID('61e11eb66ed4a5ac60b222ef'),
                        'data.type': 'monthly'
                    },
                    [
                        query_edit(showResult.price, false, 0, null, null, 'monthly')
                    ]
                )
                res.status(200).json(jsonData(showResult))

            } else {
                res.status(200).json(jsonData(showResult))

            }

        } catch (error) {
            console.log(error);
            next(error)
        }
    }


    static async magicMirrorYearly(req, res, next) {
        try {
            const magicMirrorYearly = await Config.aggregate(getDataMagicMirror('yearly'))

            const [showResult] = magicMirrorYearly[0].result.filter((el) => { if (el.price > 0) { return el } })

            let end_promo = date2number(showResult.promo.promo_end)

            let status = showResult.promo.promo_status

            if (end_promo < date2number('') || status === false) {
                const editMagicMirror = await Config.findOneAndUpdate(
                    {
                        '_id': ObjectID('61e11eb66ed4a5ac60b222ef'),
                        'data.type': 'yearly'
                    },
                    [
                        query_edit(showResult.price, false, 0, null, null, 'yearly')
                    ]
                )
                res.status(200).json(jsonData(showResult))

            } else {
                res.status(200).json(jsonData(showResult))

            }

            res.status(200).json(jsonData(showResult[0]))
        } catch (error) {
            console.log(error);
            next(error)
        }
    }

    static async editMagicMirror(req, res, next) {
        try {

            let { type } = req.query
            let { price, promo_status, promo_price, promo_start_date, promo_end_date } = req.body

            if (!type) { throw { message: 'Type is required' } }
            if (promo_status.length === 0) { throw { message: 'Promo status is required' } }
            if (!price) { throw { message: 'Price is required' } }

            let convertStartDate = new Date(promo_start_date)
            let convertEnddate = new Date(promo_end_date)

            if (promo_price < 0) {
                throw { message: 'promo price cant be minus' }
            }

            let date_start = {
                "$convert": {
                    "input": {
                        '$divide': [
                            { '$toDecimal': convertStartDate },
                            1000
                        ]
                    },
                    "to": "double",
                    "onError": { "$toDouble": "0.00" },
                    "onNull": { "$toDouble": "0.00" }
                }
            }

            let date_end = {
                "$convert": {
                    "input": {
                        '$divide': [
                            { '$toDecimal': convertEnddate },
                            1000
                        ]
                    },
                    "to": "double",
                    "onError": { "$toDouble": "0.00" },
                    "onNull": { "$toDouble": "0.00" }
                }
            }


            if (promo_status === false) {
                const editMagicMirror = await Config.findOneAndUpdate(
                    {
                        '_id': ObjectID('61e11eb66ed4a5ac60b222ef'),
                        'data.type': type
                    },
                    [
                        query_edit(price, false, 0, null, null, type)
                    ]
                )
            } else {
                const editMagicMirror = await Config.findOneAndUpdate(
                    {
                        '_id': ObjectID('61e11eb66ed4a5ac60b222ef'),
                        'data.type': type
                    },
                    [
                        query_edit(price, true, promo_price, date_start, date_end, type)
                    ]
                )
            }

            const { email, username } = req.user
            const activity = `Update setting ${type} magic mirror`
            const timeUpdate = date2number('')

            const addData = new Sa_activity_log(
                {
                    eml: email,
                    usr: username,
                    act: activity,
                    ep: timeUpdate
                }
            )

            addData.save((err) => {
                if (err) {
                    console.log(err);
                    next(err)
                } else {
                    res.status(200).json(jsonData())
                }
            })

        } catch (error) {
            console.log(error);
            next(error)
        }
    }

    static async getLogSuperAdmin(req, res, next) {
        try {
            const { page, item_limit, search_name } = req.query

            let filterName = 0

            if (search_name) {
                filterName = {
                    'name': {
                        '$regex': search_name,
                        '$options': 'i'
                    }
                }
            } else {
                filterName = {}
            }
            const getLogSuperAdmin = await Sa_activity_log.aggregate(queryPagination(
                [
                    {
                        '$addFields': {
                            'date': {
                                '$dateToString': {
                                    'date': { '$toDate': { '$multiply': ['$ep', 1000] } },
                                    'format': '%Y-%m-%d',
                                    'onNull': '2020-01-01'
                                }
                            },
                            'time': {
                                '$dateToString': {
                                    'date': { '$toDate': { '$multiply': ['$ep', 1000] } },
                                    'format': '%H:%M',
                                    'onNull': '2020-01-01'
                                }
                            },
                            'name': '$usr',
                        }
                    },
                    {
                        '$match': filterName
                    },
                    {
                        '$sort': { 'ep': -1 }
                    }
                ],
                [
                    {
                        '$project': {
                            'email': '$eml',
                            'username': '$name',
                            'activity': '$act',
                            'time': { '$concat': ['$date', ' ', '$time'] },
                            '_id': 0
                        }
                    },

                ], page, 3, item_limit
            ))

            res.status(200).json(jsonData(getLogSuperAdmin[0]))
        } catch (error) {
            console.log(error);
            next(error)
        }
    }

}



module.exports = SettingController