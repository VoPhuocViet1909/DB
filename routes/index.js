const express = require("express");
const router = express.Router();
const controller = require("../controllers/menuController");
const upload = require("../middlewares/upload");

router.get("/", controller.getAll);

router.get("/add", controller.showAddForm);
router.post("/add", upload.single("image"), controller.createItem);

router.get("/edit/:id", controller.showEditForm);
router.post("/edit/:id", upload.single("image"), controller.updateItem);

router.get("/delete/:id", (req, res, next) =>
  controller.deleteItems(req, res, next),
);

router.post("/delete", controller.deleteItems);

module.exports = router;
