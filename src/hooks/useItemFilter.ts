import { useState } from "react";
import { allEnvConfigs } from "../util/configs.ts";
import { useEnvSelection } from "../contexts/EnvSelectionContext.tsx";

interface UseItemFilterOptions {
  itemType: string;
  typeFieldGetter?: (item: any) => any;
  hasPermissions?: boolean;
  typeFilterLabel?: string;
  typeAllLabel?: string;
}

interface UseItemFilterResult {
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
  typeFilterLabel: string;
  typeAllLabel: string;
}

export function useItemFilter({
  itemType,
  typeFieldGetter,
  hasPermissions = false,
  typeFilterLabel = "Filter by type",
  typeAllLabel = "all types",
}: UseItemFilterOptions): UseItemFilterResult {
  const [searchText, setSearchText] = useState("");
  const [presenceFilter, setPresenceFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [excludePermissions, setExcludePermissions] = useState(false);

  const { sourceEnv, destEnv } = useEnvSelection();

  const rawLeft = itemType ? allEnvConfigs[sourceEnv]?.[itemType] : undefined;
  const rawRight = itemType ? allEnvConfigs[destEnv]?.[itemType] : undefined;

  const leftArray: any[] = Array.isArray(rawLeft) ? rawLeft : [];
  const rightArray: any[] = Array.isArray(rawRight) ? rawRight : [];

  // Collect unique type values from both sides
  const uniqueTypes: string[] = typeFieldGetter
    ? Array.from(
        new Set([
          ...leftArray.map(typeFieldGetter),
          ...rightArray.map(typeFieldGetter),
        ])
      )
        .filter(Boolean)
        .sort((a, b) => String(a).localeCompare(String(b)))
    : [];

  const lowerSearch = searchText.toLowerCase();

  function applyFilters(items: any[]): any[] {
    let result = items;

    if (typeFieldGetter && typeFilter) {
      result = result.filter((item) => typeFieldGetter(item) === typeFilter);
    }

    if (searchText) {
      result = result.filter(
        (item) =>
          item?.identifier?.toLowerCase().includes(lowerSearch) ||
          item?.title?.toLowerCase().includes(lowerSearch)
      );
    }

    if (hasPermissions && excludePermissions) {
      result = result.map((item) => {
        if (!item) return item;
        const { permissions, ...rest } = item;
        return rest;
      });
    }

    return result;
  }

  let filteredLeft = applyFilters(leftArray);
  let filteredRight = applyFilters(rightArray);

  // Presence filter runs last — it crosses both sides
  if (presenceFilter === "not-in-destination") {
    const rightIdentifiers = new Set(filteredRight.map((item) => item?.identifier));
    filteredLeft = filteredLeft.filter(
      (item) => !rightIdentifiers.has(item?.identifier)
    );
    filteredRight = [];
  } else if (presenceFilter === "not-in-source") {
    const leftIdentifiers = new Set(filteredLeft.map((item) => item?.identifier));
    filteredRight = filteredRight.filter(
      (item) => !leftIdentifiers.has(item?.identifier)
    );
    filteredLeft = [];
  }

  return {
    filteredLeft,
    filteredRight,
    searchText,
    setSearchText,
    presenceFilter,
    setPresenceFilter,
    typeFilter,
    setTypeFilter,
    uniqueTypes,
    excludePermissions,
    setExcludePermissions,
    typeFilterLabel,
    typeAllLabel,
  };
}
