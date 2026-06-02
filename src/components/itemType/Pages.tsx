import Col from "react-bootstrap/Col";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";

import { useItemFilter } from "../../hooks/useItemFilter.ts";
import ExcludePermissionsControl from "../filters/ExcludePermissionsControl.tsx";
import ExcludeUpdatedAtControl from "../filters/ExcludeUpdatedAtControl.tsx";
import PresenceFilterControl from "../filters/PresenceFilterControl.tsx";
import SearchControl from "../filters/SearchControl.tsx";
import TypeFilterControl from "../filters/TypeFilterControl.tsx";
import ItemViewer from "../ItemViewer.tsx";

export default function Pages() {
  const {
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
    typeFilterLabel,
    typeAllLabel,
  } = useItemFilter({
    itemType: "Pages",
    typeFieldGetter: (item) => item?.type,
    hasPermissions: true,
  });

  return (
    <Container fluid>
      <Row>
        <Col>
          <SearchControl
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
        </Col>
      </Row>
      <Row>
        <Col>
          <PresenceFilterControl
            value={presenceFilter}
            onChange={(e) => setPresenceFilter(e.target.value)}
          />
        </Col>
      </Row>
      <Row>
        <Col>
          <TypeFilterControl
            uniqueTypes={uniqueTypes}
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            onClear={() => setTypeFilter("")}
            label={typeFilterLabel}
            allLabel={typeAllLabel}
          />
        </Col>
      </Row>
      <Row className="mt-3">
        <Col>
          <ExcludePermissionsControl
            checked={excludePermissions}
            onChange={(e) => setExcludePermissions(e.target.checked)}
          />
        </Col>
        <Col>
          <ExcludeUpdatedAtControl
            checked={excludeUpdatedAt}
            onChange={(e) => setExcludeUpdatedAt(e.target.checked)}
          />
        </Col>
      </Row>
      <Row>
        <Col>
          <hr />
          <ItemViewer
            filteredLeftContents={filteredLeft}
            filteredRightContents={filteredRight}
            itemType="Pages"
          />
        </Col>
      </Row>
    </Container>
  );
}
