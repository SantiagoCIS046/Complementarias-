const express = require("express");
const router = express.Router();
const controller = require("./companies.controller");

// Ruta activada para integración
router.get("/", controller.getAll);

module.exports = router;
