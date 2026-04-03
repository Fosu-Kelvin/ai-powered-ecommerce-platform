export interface CategoryAttributeConfig {
  supportsColor: boolean;
  supportsMaterial: boolean;
  supportsDimensions: boolean;
  supportsAssembly: boolean;
}

export interface CategoryFilterConfig {
  supportsColor: boolean;
  supportsMaterial: boolean;
}

const DEFAULT_CONFIG: CategoryAttributeConfig = {
  supportsColor: true,
  supportsMaterial: true,
  supportsDimensions: true,
  supportsAssembly: true,
};

const DEFAULT_FILTER_CONFIG: CategoryFilterConfig = {
  supportsColor: true,
  supportsMaterial: false,
};

const FURNITURE_CONFIG: CategoryAttributeConfig = {
  supportsColor: true,
  supportsMaterial: true,
  supportsDimensions: true,
  supportsAssembly: true,
};

const CATEGORY_CONFIG_BY_SLUG: Record<string, CategoryAttributeConfig> = {
  electronics: {
    supportsColor: true,
    supportsMaterial: false,
    supportsDimensions: false,
    supportsAssembly: false,
  },
  fashion: {
    supportsColor: true,
    supportsMaterial: true,
    supportsDimensions: false,
    supportsAssembly: false,
  },
  beauty: {
    supportsColor: true,
    supportsMaterial: false,
    supportsDimensions: false,
    supportsAssembly: false,
  },
  furniture: FURNITURE_CONFIG,
  "home-furniture": FURNITURE_CONFIG,
  chairs: FURNITURE_CONFIG,
  tables: FURNITURE_CONFIG,
  desks: FURNITURE_CONFIG,
  beds: FURNITURE_CONFIG,
  storage: FURNITURE_CONFIG,
};

function isFurnitureLikeCategory(slug: string): boolean {
  return /(furniture|chair|table|desk|bed|storage|sofa|wardrobe|cabinet)/.test(
    slug
  );
}

export function getCategoryAttributeConfig(
  categorySlug?: string | null
): CategoryAttributeConfig {
  if (!categorySlug) {
    return DEFAULT_CONFIG;
  }

  const normalizedSlug = categorySlug.trim().toLowerCase();
  if (!normalizedSlug) {
    return DEFAULT_CONFIG;
  }

  const explicitConfig = CATEGORY_CONFIG_BY_SLUG[normalizedSlug];
  if (explicitConfig) {
    return explicitConfig;
  }

  if (isFurnitureLikeCategory(normalizedSlug)) {
    return FURNITURE_CONFIG;
  }

  return DEFAULT_CONFIG;
}

export function getCategoryFilterConfig(
  categorySlug?: string | null
): CategoryFilterConfig {
  if (!categorySlug) {
    return DEFAULT_FILTER_CONFIG;
  }

  const normalizedSlug = categorySlug.trim().toLowerCase();
  if (!normalizedSlug) {
    return DEFAULT_FILTER_CONFIG;
  }

  const explicitConfig = CATEGORY_CONFIG_BY_SLUG[normalizedSlug];
  if (explicitConfig) {
    return {
      supportsColor: explicitConfig.supportsColor,
      supportsMaterial: explicitConfig.supportsMaterial,
    };
  }

  if (isFurnitureLikeCategory(normalizedSlug)) {
    return {
      supportsColor: true,
      supportsMaterial: true,
    };
  }

  return DEFAULT_FILTER_CONFIG;
}
