import { createContext, useContext, useMemo, useState } from "react";
import { useItemFilter } from "../hooks/useItemFilter.ts";
import { filterConfig } from "../config/filterConfig.ts";

interface FilterContextValue {
  activeItemType: string | null;
  isFilterPanelOpen: boolean;
  setIsFilterPanelOpen: React.Dispatch<React.SetStateAction<boolean>>;
  activeFilterCount: number;
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

  const filterResult = useItemFilter({
    itemType: activeItemType ?? "",
    typeFieldGetter: config.typeFieldGetter,
    hasPermissions: config.hasPermissions,
    hasExcludeUpdatedAt: config.hasExcludeUpdatedAt,
    hasExcludeCreatedAt: config.hasExcludeCreatedAt,
    typeFilterLabel: config.typeFilterLabel,
    typeAllLabel: config.typeAllLabel,
  });

  const activeFilterCount = [
    filterResult.searchText !== "",
    filterResult.presenceFilter !== "",
    filterResult.typeFilter !== "",
    config.hasPermissions && filterResult.excludePermissions,
    config.hasExcludeUpdatedAt && filterResult.excludeUpdatedAt,
    config.hasExcludeCreatedAt && filterResult.excludeCreatedAt,
  ].filter(Boolean).length;

  const value = useMemo(
    () => ({
      activeItemType,
      isFilterPanelOpen,
      setIsFilterPanelOpen,
      activeFilterCount,
      ...filterResult,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [activeItemType, isFilterPanelOpen, activeFilterCount, filterResult.filteredLeft, filterResult.filteredRight, filterResult.searchText, filterResult.presenceFilter, filterResult.typeFilter, filterResult.excludePermissions, filterResult.excludeUpdatedAt, filterResult.excludeCreatedAt, filterResult.uniqueTypes]
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
