const VALID_CATEGORIES = ["Coffee", "Tea", "Juice", "Cake"];

function validateMenuItem(data) {
  const errors = [];
  if (!data.itemName || data.itemName.trim() === "")
    errors.push("Tên món không được rỗng.");
  if (Number(data.price) <= 0 || isNaN(Number(data.price)))
    errors.push("Giá phải > 0.");
  const discount = Number(data.discountPercent);
  if (isNaN(discount) || discount < 0 || discount > 50)
    errors.push("discountPercent phải trong khoảng 0..50.");
  if (!VALID_CATEGORIES.includes(data.category))
    errors.push(`Category phải thuộc {${VALID_CATEGORIES.join(", ")}}.`);
  return errors;
}

function calcSalePrice(price, discountPercent) {
  return Number(price) * (1 - Number(discountPercent) / 100);
}

function searchItems(items, keyword) {
  if (!keyword) return items;
  const kw = keyword.toLowerCase();
  return items.filter((i) => i.itemName.toLowerCase().includes(kw));
}

function filterByCategory(items, category) {
  if (!category) return items;
  return items.filter((i) => i.category === category);
}

function filterByAvailability(items, isAvailable) {
  if (isAvailable === undefined || isAvailable === "") return items;
  const flag = isAvailable === "true" || isAvailable === true;
  return items.filter((i) => String(i.isAvailable) === String(flag));
}

function countByCategory(items) {
  const result = {};
  VALID_CATEGORIES.forEach((cat) => {
    result[cat] = items.filter(
      (i) =>
        i.category === cat &&
        (i.isAvailable === true || i.isAvailable === "true"),
    ).length;
  });
  return result;
}

module.exports = {
  validateMenuItem,
  calcSalePrice,
  searchItems,
  filterByCategory,
  filterByAvailability,
  countByCategory,
  VALID_CATEGORIES,
};
