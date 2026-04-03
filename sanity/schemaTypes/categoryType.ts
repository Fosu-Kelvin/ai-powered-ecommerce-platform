import { TagIcon } from "@sanity/icons";
import { defineField, defineType } from "sanity";

export const categoryType = defineType({
  name: "category",
  title: "Category",
  type: "document",
  icon: TagIcon,
  fields: [
    defineField({
      name: "title",
      type: "string",
      validation: (rule) => [
        rule.required().error("Category title is required"),
      ],
    }),
    defineField({
      name: "slug",
      type: "slug",
      options: {
        source: "title",
        maxLength: 96,
      },
      validation: (rule) => [
        rule.required().error("Slug is required for URL generation"),
      ],
    }),
    defineField({
      name: "parentCategory",
      title: "Parent Category",
      type: "reference",
      to: [{ type: "category" }],
      description:
        "Optional parent category for nested navigation (e.g., Furniture > Beds).",
    }),
    
    defineField({
      name: "description",
      type: "text",
      rows: 3,
      description: "Brief description of the product category",
    }),
    
    defineField({
      name: "image",
      type: "image",
      options: {
        hotspot: true,
      },
      description: "Category thumbnail image",
    }),
  ],
  preview: {
    select: {
      title: "title",
      media: "image",
      parentTitle: "parentCategory.title",
    },
    prepare({ title, media, parentTitle }) {
      return {
        title,
        subtitle: parentTitle ? `Parent: ${parentTitle}` : "Top-level category",
        media,
      };
    },
  },
});
