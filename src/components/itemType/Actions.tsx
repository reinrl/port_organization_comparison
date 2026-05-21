import Col from "react-bootstrap/Col";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";

import { useItemFilter } from "../../hooks/useItemFilter.ts";
import ExcludePermissionsControl from "../filters/ExcludePermissionsControl.tsx";
import PresenceFilterControl from "../filters/PresenceFilterControl.tsx";
import SearchControl from "../filters/SearchControl.tsx";
import TypeFilterControl from "../filters/TypeFilterControl.tsx";
import ItemViewer from "../ItemViewer.tsx";

export default function Actions() {
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
    typeFilterLabel,
    typeAllLabel,
  } = useItemFilter({
    itemType: "Actions",
    typeFieldGetter: (item) => item?.trigger?.type,
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
      <Row>
        <Col>
          <hr />
          <ExcludePermissionsControl
            checked={excludePermissions}
            onChange={(e) => setExcludePermissions(e.target.checked)}
          />
        </Col>
      </Row>
      <Row>
        <Col>
          <hr />
          <ItemViewer
            filteredLeftContents={filteredLeft}
            filteredRightContents={filteredRight}
            itemType="Actions"
          />
        </Col>
      </Row>
    </Container>
  );
}
