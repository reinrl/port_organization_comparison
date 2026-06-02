import { useState, useMemo } from "react";
import { allEnvConfigs } from "../util/configs.ts";
import { useEnvSelection } from "../contexts/EnvSelectionContext.tsx";

function deepOmitKeys(value: any, keys: ReadonlySet<string>): any {
  if (Array.isArray(value)) {
    return value.map((v) => deepOmitKeys(v, keys));
  }
  if (value !== null && typeof value === "object") {
    const result: Record<string, any> = {};
    for (const [k, v] of Object.entries(value)) {
      if (!keys.has(k)) {
        result[k] = deepOmitKeys(v, keys);
      }
    }
    return result;
  }
  return value;
}

const UPDATED_AT_KEYS = new Set(["updatedAt", "updatedBy"]);
const CREATED_AT_KEYS = new Set(["createdAt", "createdBy"]);
const UPDATED_AND_CREATED_AT_KEYS = new Set(["updatedAt", "updatedBy", "createdAt", "createdBy"]);

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
  excludeUpdatedAt: boolean;
  setExcludeUpdatedAt: React.Dispatch<React.SetStateAction<boolean>>;
  excludeCreatedAt: boolean;
  setExcludeCreatedAt: React.Dispatch<React.SetStateAction<boolean>>;
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
  const [excludePermissions, setExcludePermissions] = useState(true);
  const [excludeUpdatedAt, setExcludeUpdatedAt] = useState(true);
  const [excludeCreatedAt, setExcludeCreatedAt] = useState(true);

  const { sourceEnv, destEnv } = useEnvSelection();

  const rawLeft = itemType ? allEnvConfigs[sourceEnv]?.[itemType] : undefined;
  const rawRight = itemType ? allEnvConfigs[destEnv]?.[itemType] : undefined;

  const leftArray: any[] = Array.isArray(rawLeft) ? rawLeft : [];
  const rightArray: any[] = Array.isArray(rawRight) ? rawRight : [];

  // Collect unique type values from both sides
  const uniqueTypes = useMemo<string[]>(() => {
    if (!typeFieldGetter) return [];
    return Array.from(
      new Set([
        ...leftArray.map(typeFieldGetter),
        ...rightArray.map(typeFieldGetter),
      ])
    )
      .filter(Boolean)
      .sort((a, b) => String(a).localeCompare(String(b)));
  }, [leftArray, rightArray, typeFieldGetter]);

  const { filteredLeft, filteredRight } = useMemo(() => {
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

      if (excludeUpdatedAt && excludeCreatedAt) {
        result = result.map((item) => (item ? deepOmitKeys(item, UPDATED_AND_CREATED_AT_KEYS) : item));
      } else if (excludeUpdatedAt) {
        result = result.map((item) => (item ? deepOmitKeys(item, UPDATED_AT_KEYS) : item));
      } else if (excludeCreatedAt) {
        result = result.map((item) => (item ? deepOmitKeys(item, CREATED_AT_KEYS) : item));
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

    return { filteredLeft, filteredRight };
  }, [
    leftArray,
    rightArray,
    searchText,
    typeFilter,
    typeFieldGetter,
    hasPermissions,
    excludePermissions,
    excludeUpdatedAt,
    excludeCreatedAt,
    presenceFilter,
  ]);

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
    excludeUpdatedAt,
    setExcludeUpdatedAt,
    excludeCreatedAt,
    setExcludeCreatedAt,
    typeFilterLabel,
    typeAllLabel,
  };
}
