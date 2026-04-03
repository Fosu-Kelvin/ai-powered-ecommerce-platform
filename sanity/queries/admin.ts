import { defineQuery } from "next-sanity";

export const ADMIN_DASHBOARD_STATS_QUERY = defineQuery(`{
  "productCount": count(*[_type == "product"]),
  "orderCount": count(*[_type == "order"]),
  "lowStockCount": count(*[_type == "product" && stock <= $lowStockThreshold])
}`);

export const ADMIN_LOW_STOCK_PRODUCTS_QUERY = defineQuery(`*[
  _type == "product"
  && stock <= $lowStockThreshold
] | order(stock asc, name asc)[0...$limit] {
  _id,
  name,
  stock,
  "imageUrl": images[0].asset->url
}`);

export const ADMIN_RECENT_ORDERS_QUERY = defineQuery(`*[
  _type == "order"
] | order(createdAt desc)[0...$limit] {
  _id,
  orderNumber,
  email,
  total,
  status,
  createdAt
}`);

export const ADMIN_ORDERS_QUERY = defineQuery(`*[
  _type == "order"
  && ($status == "all" || status == $status)
  && (
    $searchPattern == ""
    || orderNumber match $searchPattern
    || email match $searchPattern
  )
] | order(createdAt desc)[0...200] {
  _id,
  orderNumber,
  email,
  total,
  status,
  createdAt,
  "itemCount": count(items)
}`);

export const ADMIN_ORDER_DETAIL_QUERY = defineQuery(`*[
  _type == "order"
  && _id == $id
][0] {
  _id,
  orderNumber,
  email,
  total,
  status,
  createdAt,
  paystackReference,
  "itemCount": count(items),
  "itemImages": items[].product->images[0].asset->url,
  items[]{
    _key,
    quantity,
    priceAtPurchase,
    product->{
      _id,
      name,
      "slug": slug.current,
      "imageUrl": images[0].asset->url
    }
  },
  address
}`);

export const ADMIN_PRODUCTS_QUERY = defineQuery(`*[
  _type == "product"
  && ($inventoryFilter != "low-stock" || stock <= $lowStockThreshold)
  && (
    $searchPattern == ""
    || name match $searchPattern
    || description match $searchPattern
  )
] | order(stock asc, name asc)[0...200] {
  _id,
  name,
  price,
  stock,
  featured,
  "slug": slug.current,
  "imageUrl": images[0].asset->url
}`);

export const ADMIN_PRODUCT_DETAIL_QUERY = defineQuery(`*[
  _type == "product"
  && _id == $id
][0] {
  _id,
  name,
  "slug": slug.current,
  description,
  price,
  stock,
  featured,
  assemblyRequired,
  material,
  color,
  dimensions,
  customAttributes[]{
    _key,
    name,
    value
  },
  "imageUrls": images[].asset->url,
  category->{
    _id,
    title,
    "slug": slug.current
  }
}`);
