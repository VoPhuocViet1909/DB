const {
  ScanCommand,
  PutCommand,
  DeleteCommand,
  GetCommand,
  BatchWriteCommand,
} = require("@aws-sdk/lib-dynamodb");
const { v4: uuidv4 } = require("uuid");
const { docClient } = require("../config/aws");
const {
  validateMenuItem,
  calcSalePrice,
  searchItems,
  filterByCategory,
  filterByAvailability,
  countByCategory,
  VALID_CATEGORIES,
} = require("../utils/logic");
const { uploadImage, deleteImage } = require("../utils/s3Service");

const TABLE_NAME = "CafeMenu";

exports.getAll = async (req, res) => {
  try {
    const { search, category, isAvailable } = req.query;
    let items =
      (await docClient.send(new ScanCommand({ TableName: TABLE_NAME })))
        .Items || [];

    items = items.map((item) => ({
      ...item,
      salePrice: calcSalePrice(item.price, item.discountPercent),
    }));

    items = searchItems(items, search);
    items = filterByCategory(items, category);
    items = filterByAvailability(items, isAvailable);

    const allItems =
      (await docClient.send(new ScanCommand({ TableName: TABLE_NAME })))
        .Items || [];
    const countByCat = countByCategory(allItems);

    res.render("index", {
      items,
      search,
      category,
      isAvailable,
      VALID_CATEGORIES,
      countByCat,
    });
  } catch (error) {
    res.status(500).send("Lỗi: " + error.message);
  }
};

exports.showAddForm = (req, res) =>
  res.render("add", { item: {}, errors: [], VALID_CATEGORIES });

exports.createItem = async (req, res) => {
  const data = req.body;
  const errors = validateMenuItem(data);
  if (req.fileValidationError) errors.push(req.fileValidationError);
  if (errors.length > 0)
    return res.render("add", { item: data, errors, VALID_CATEGORIES });

  const imageUrl = req.file ? await uploadImage(req.file) : "";
  const isAvailable = data.isAvailable === "true" || data.isAvailable === true;
  const newItem = {
    itemId: uuidv4(),
    itemName: data.itemName.trim(),
    category: data.category,
    price: Number(data.price),
    discountPercent: Number(data.discountPercent),
    isAvailable,
    imageUrl,
    createdAt: new Date().toISOString(),
  };
  await docClient.send(
    new PutCommand({ TableName: TABLE_NAME, Item: newItem }),
  );
  res.redirect("/");
};

exports.showEditForm = async (req, res) => {
  const result = await docClient.send(
    new GetCommand({ TableName: TABLE_NAME, Key: { itemId: req.params.id } }),
  );
  if (!result.Item) return res.redirect("/");
  res.render("edit", { item: result.Item, errors: [], VALID_CATEGORIES });
};

exports.updateItem = async (req, res) => {
  const data = req.body;
  const errors = validateMenuItem(data);
  if (req.fileValidationError) errors.push(req.fileValidationError);
  if (errors.length > 0)
    return res.render("edit", {
      item: { itemId: req.params.id, ...data },
      errors,
      VALID_CATEGORIES,
    });

  let imageUrl = data.oldImageUrl || "";
  if (req.file) {
    imageUrl = await uploadImage(req.file);
    if (data.oldImageUrl) await deleteImage(data.oldImageUrl);
  }
  const isAvailable = data.isAvailable === "true" || data.isAvailable === true;
  const updated = {
    itemId: req.params.id,
    itemName: data.itemName.trim(),
    category: data.category,
    price: Number(data.price),
    discountPercent: Number(data.discountPercent),
    isAvailable,
    imageUrl,
    createdAt: data.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  delete updated.oldImageUrl;
  await docClient.send(
    new PutCommand({ TableName: TABLE_NAME, Item: updated }),
  );
  res.redirect("/");
};

exports.deleteItems = async (req, res) => {
  try {
    let ids = [];
    if (req.params.id) {
      ids = [req.params.id];
    } else if (req.body.ids) {
      ids = Array.isArray(req.body.ids) ? req.body.ids : [req.body.ids];
    }

    for (const id of ids) {
      const result = await docClient.send(
        new GetCommand({ TableName: TABLE_NAME, Key: { itemId: id } }),
      );
      if (result.Item && result.Item.imageUrl)
        await deleteImage(result.Item.imageUrl);
      await docClient.send(
        new DeleteCommand({ TableName: TABLE_NAME, Key: { itemId: id } }),
      );
    }
    res.redirect("/");
  } catch (error) {
    res.status(500).send("Lỗi xóa: " + error.message);
  }
};
