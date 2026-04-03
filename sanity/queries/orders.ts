import { defineQuery } from "next-sanity";

/**
 * Get orders by Clerk user ID
 * Used on orders list page
 */

export const ORDERS_BY_USER_QUERY = defineQuery(`
  *[_type == "order" && clerkUserId == $clerkUserId] | order(createdAt desc) {
    _id,
    orderNumber,
    paystackReference, // Include this for the AI to reference
    total,
    status,
    "itemCount": count(items),
    "itemNames": items[].product->name,
    "itemImages": items[].product->images[0].asset->url,
    createdAt
  }
`);

/**
 * Get single order by ID with full details
 * Used on order detail page
 */
export const ORDER_BY_ID_QUERY = defineQuery(`*[
  _type == "order"
  && _id == $id
][0] {
  _id,
  orderNumber,
  clerkUserId,
  email,
  items[]{
    _key,
    quantity,
    priceAtPurchase,
    product->{
      _id,
      name,
      "slug": slug.current,
      // We wrap it in 'image' and 'asset' to match your DetailPage code
      "image": {
        "asset": images[0].asset->{
          _id,
          url
        }
      }
    }
  },
  total,
  status,
  address{
    name,
    hostelName,
    roomNumber,
    location
  },
  paystackReference, // Changed from stripePaymentId to match your new system
  createdAt
}`);

/**
 * Get recent orders (for admin dashboard)
 */
export const RECENT_ORDERS_QUERY = defineQuery(`*[
  _type == "order"
] | order(createdAt desc) [0...$limit] {
  _id,
  orderNumber,
  email,
  total,
  status,
  createdAt
}`);

/**
 * Check if order exists by Stripe payment ID
 * Used for webhook idempotency check
 */
export const ORDER_BY_STRIPE_PAYMENT_ID_QUERY = defineQuery(`*[
  _type == "order"
  && stripePaymentId == $stripePaymentId
][0]{ _id }`);
