export interface FilterConfig {
  typeFieldGetter?: (item: any) => any;
  hasPermissions?: boolean;
  hasExcludeUpdatedAt?: boolean;
  hasExcludeCreatedAt?: boolean;
  typeFilterLabel?: string;
  typeAllLabel?: string;
}

export const filterConfig: Record<string, FilterConfig> = {
  Actions: {
    typeFieldGetter: (item: any) => item?.trigger?.type,
    hasPermissions: true,
  },
  Blueprints: {
    hasPermissions: true,
  },
  Integrations: {
    typeFieldGetter: (item: any) => item?.installationType,
    typeFilterLabel: "Filter by installation type",
    typeAllLabel: "all installation types",
  },
  Pages: {
    typeFieldGetter: (item: any) => item?.type,
    hasPermissions: true,
    hasExcludeUpdatedAt: true,
    hasExcludeCreatedAt: true,
  },
  Scorecards: {},
  Webhooks: {},
};
