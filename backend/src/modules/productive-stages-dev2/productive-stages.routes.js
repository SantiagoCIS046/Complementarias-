const express = require("express");
const router = express.Router();
const controller = require("./productive-stages.controller");

// Ruta activada para integración
router.get("/", controller.getAll);

module.exports = router;
