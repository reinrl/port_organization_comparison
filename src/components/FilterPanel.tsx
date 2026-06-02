import Col from "react-bootstrap/Col";
import Collapse from "react-bootstrap/Collapse";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";

import { useFilterContext } from "../contexts/FilterContext.tsx";
import { filterConfig } from "../config/filterConfig.ts";
import ExcludePermissionsControl from "./filters/ExcludePermissionsControl.tsx";
import ExcludeUpdatedAtControl from "./filters/ExcludeUpdatedAtControl.tsx";
import PresenceFilterControl from "./filters/PresenceFilterControl.tsx";
import SearchControl from "./filters/SearchControl.tsx";
import TypeFilterControl from "./filters/TypeFilterControl.tsx";

export default function FilterPanel() {
  const {
    activeItemType,
    isFilterPanelOpen,
    searchText,
    setSearchText,
    presenceFilter,
    setPresenceFilter,
    typeFilter,
    setTypeFilter,
    uniqueTypes,
    typeFilterLabel,
    typeAllLabel,
    excludePermissions,
    setExcludePermissions,
    excludeUpdatedAt,
    setExcludeUpdatedAt,
  } = useFilterContext();

  if (!activeItemType) return null;

  const config = filterConfig[activeItemType] ?? {};

  return (
    <Collapse in={isFilterPanelOpen}>
      <div>
        <Container fluid className="bg-body-tertiary border-bottom py-2">
          <Row className="align-items-center g-2 flex-wrap">
            <Col xs="auto">
              <SearchControl
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
              />
            </Col>
            <Col xs="auto">
              <PresenceFilterControl
                value={presenceFilter}
                onChange={(e) => setPresenceFilter(e.target.value)}
              />
            </Col>
            {config.typeFieldGetter && (
              <Col xs="auto">
                <TypeFilterControl
                  uniqueTypes={uniqueTypes}
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  label={typeFilterLabel}
                  allLabel={typeAllLabel}
                />
              </Col>
            )}
            {config.hasPermissions && (
              <Col xs="auto">
                <ExcludePermissionsControl
                  checked={excludePermissions}
                  onChange={(e) => setExcludePermissions(e.target.checked)}
                />
              </Col>
            )}
            {config.hasExcludeUpdatedAt && (
              <Col xs="auto">
                <ExcludeUpdatedAtControl
                  checked={excludeUpdatedAt}
                  onChange={(e) => setExcludeUpdatedAt(e.target.checked)}
                />
              </Col>
            )}
          </Row>
        </Container>
      </div>
    </Collapse>
  );
}
