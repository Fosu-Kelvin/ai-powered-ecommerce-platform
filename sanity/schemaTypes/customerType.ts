import { UserIcon } from "@sanity/icons";
import { defineField, defineType } from "sanity";

export const customerType = defineType({
  name: "customer",
  title: "Customer",
  type: "document",
  icon: UserIcon,
  groups: [
    { name: "details", title: "Customer Details", default: true },
    { name: "paystack", title: "Paystack" }, // Renamed group from stripe
  ],
  fields: [
    defineField({
      name: "email",
      type: "string",
      group: "details",
      validation: (rule) => [rule.required().error("Email is required")],
    }),
    defineField({
      name: "name",
      type: "string",
      group: "details",
      description: "Customer's full name",
    }),
    defineField({
      name: "clerkUserId",
      type: "string",
      group: "details",
      description: "Clerk user ID for authentication",
    }),
    defineField({
      name: "paystackCustomerCode", // Renamed from stripeCustomerId
      title: "Paystack Customer Code",
      type: "string",
      group: "paystack", // Updated to match new group name
      readOnly: true,
      description: "Paystack customer code (e.g., CUS_xxxxxxxx)",
      validation: (rule) => [
        rule.required().error("Paystack customer code is required"),
      ],
    }),
    defineField({
      name: "createdAt",
      type: "datetime",
      group: "details",
      readOnly: true,
      initialValue: () => new Date().toISOString(),
    }),
  ],
  preview: {
    select: {
      email: "email",
      name: "name",
      customerCode: "paystackCustomerCode", // Updated selector
    },
    prepare({ email, name, customerCode }) {
      return {
        title: name ?? email ?? "Unknown Customer",
        subtitle: customerCode
          ? `${email ?? ""} • ${customerCode}`
          : (email ?? ""),
      };
    },
  },
  orderings: [
    {
      title: "Newest First",
      name: "createdAtDesc",
      by: [{ field: "createdAt", direction: "desc" }],
    },
    {
      title: "Email A-Z",
      name: "emailAsc",
      by: [{ field: "email", direction: "asc" }],
    },
  ],
});