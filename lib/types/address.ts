export interface ShippingAddress {
  name: string;
  hostelName: string;
  roomNumber: string;
  location: string;
}

export const EMPTY_SHIPPING_ADDRESS: ShippingAddress = {
  name: "",
  hostelName: "",
  roomNumber: "",
  location: "",
};

export function isShippingAddressComplete(address: ShippingAddress) {
  return Boolean(
    address.name.trim() &&
      address.hostelName.trim() &&
      address.roomNumber.trim() &&
      address.location.trim(),
  );
}
