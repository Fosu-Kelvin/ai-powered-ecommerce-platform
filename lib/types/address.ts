export interface ShippingAddress {
  name: string;
  line1: string;
  line2?: string;
  city: string;
  postcode: string;
  country: string;
}

export const EMPTY_SHIPPING_ADDRESS: ShippingAddress = {
  name: "",
  line1: "",
  line2: "",
  city: "",
  postcode: "",
  country: "",
};

export function isShippingAddressComplete(address: ShippingAddress) {
  return Boolean(
    address.name.trim() &&
      address.line1.trim() &&
      address.city.trim() &&
      address.postcode.trim() &&
      address.country.trim(),
  );
}
