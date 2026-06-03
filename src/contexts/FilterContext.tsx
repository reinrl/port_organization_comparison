import { createContext, useContext, useMemo, useState } from "react";
import { useItemFilter } from "../hooks/useItemFilter.ts";
import { filterConfig } from "../config/filterConfig.ts";

interface FilterContextValue {
  activeItemType: string | null;
  isFilterPanelOpen: boolean;
  setIsFilterPanelOpen: React.Dispatch<React.SetStateAction<boolean>>;
  activeFilterCount: number;
  hasTypeFilter: boolean;
  hasPermissions: boolean;
  hasExcludeUpdatedAt: boolean;
  hasExcludeCreatedAt: boolean;
  filteredLeft: any[];
  filteredRight: any[];
  searchText: string;
  setSearchText: React.Dispatch<React.SetStateAction<string>>;
  presenceFilter: string;
  setPresenceFilter: React.Dispatch<React.SetStateAction<string>>;
  typeFilter: string;
  setTypeFilter: React.Dispatch<React.SetStateAction<string>>;
  uniqueTypes: string[];
  excludePermissions: boolean;
  setExcludePermissions: React.Dispatch<React.SetStateAction<boolean>>;
  excludeUpdatedAt: boolean;
  setExcludeUpdatedAt: React.Dispatch<React.SetStateAction<boolean>>;
  excludeCreatedAt: boolean;
  setExcludeCreatedAt: React.Dispatch<React.SetStateAction<boolean>>;
  typeFilterLabel: string;
  typeAllLabel: string;
}

const FilterContext = createContext<FilterContextValue | null>(null);

function FilterProviderInner({ activeItemType, children }: Readonly<{ activeItemType: string | null; children: React.ReactNode }>) {
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);

  const config = activeItemType ? (filterConfig[activeItemType] ?? {}) : {};
  const hasTypeFilter = !!config.typeFieldGetter;
  const hasPermissions = !!config.hasPermissions;
  const hasExcludeUpdatedAt = !!config.hasExcludeUpdatedAt;
  const hasExcludeCreatedAt = !!config.hasExcludeCreatedAt;

  const filterResult = useItemFilter({
    itemType: activeItemType ?? "",
    typeFieldGetter: config.typeFieldGetter,
    hasPermissions: config.hasPermissions,
    hasExcludeUpdatedAt: config.hasExcludeUpdatedAt,
    hasExcludeCreatedAt: config.hasExcludeCreatedAt,
    typeFilterLabel: config.typeFilterLabel,
    typeAllLabel: config.typeAllLabel,
  });

  const {
    filteredLeft,
    filteredRight,
    searchText, setSearchText,
    presenceFilter, setPresenceFilter,
    typeFilter, setTypeFilter,
    uniqueTypes,
    excludePermissions, setExcludePermissions,
    excludeUpdatedAt, setExcludeUpdatedAt,
    excludeCreatedAt, setExcludeCreatedAt,
    typeFilterLabel, typeAllLabel,
  } = filterResult;

  const activeFilterCount = [
    searchText !== "",
    presenceFilter !== "",
    typeFilter !== "",
    hasPermissions && excludePermissions,
    hasExcludeUpdatedAt && excludeUpdatedAt,
    hasExcludeCreatedAt && excludeCreatedAt,
  ].filter(Boolean).length;

  const value = useMemo(
    () => ({
      activeItemType,
      isFilterPanelOpen,
      setIsFilterPanelOpen,
      activeFilterCount,
      hasTypeFilter,
      hasPermissions,
      hasExcludeUpdatedAt,
      hasExcludeCreatedAt,
      filteredLeft,
      filteredRight,
      searchText, setSearchText,
      presenceFilter, setPresenceFilter,
      typeFilter, setTypeFilter,
      uniqueTypes,
      excludePermissions, setExcludePermissions,
      excludeUpdatedAt, setExcludeUpdatedAt,
      excludeCreatedAt, setExcludeCreatedAt,
      typeFilterLabel, typeAllLabel,
    }),
    [
      activeItemType, isFilterPanelOpen, activeFilterCount,
      hasTypeFilter, hasPermissions, hasExcludeUpdatedAt, hasExcludeCreatedAt,
      filteredLeft, filteredRight,
      searchText, setSearchText,
      presenceFilter, setPresenceFilter,
      typeFilter, setTypeFilter,
      uniqueTypes,
      excludePermissions, setExcludePermissions,
      excludeUpdatedAt, setExcludeUpdatedAt,
      excludeCreatedAt, setExcludeCreatedAt,
      typeFilterLabel, typeAllLabel,
    ]
  );

  return (
    <FilterContext.Provider value={value}>
      {children}
    </FilterContext.Provider>
  );
}

export function FilterProvider({ children }: Readonly<{ children: React.ReactNode }>) {
  const urlParams = new URLSearchParams(globalThis.location.search);
  const activeItemType = urlParams.get("itemType");
  return (
    <FilterProviderInner activeItemType={activeItemType}>
      {children}
    </FilterProviderInner>
  );
}

export function useFilterContext(): FilterContextValue {
  const ctx = useContext(FilterContext);
  if (!ctx) throw new Error("useFilterContext must be used within FilterProvider");
  return ctx;
}
