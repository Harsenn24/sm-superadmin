const express = require("express");
const DocumentController = require("../controllers/document");
const { authentif } = require("../middleware/authentif");
const router = express.Router();

router.use(authentif)
router.get('/document/npwp', DocumentController.npwp)
router.get('/document/siup', DocumentController.siup)
router.get('/document/cbto', DocumentController.cbto)


module.exports = router


























module.exports = router
