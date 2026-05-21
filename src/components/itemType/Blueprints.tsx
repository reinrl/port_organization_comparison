import Col from "react-bootstrap/Col";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";

import { useItemFilter } from "../../hooks/useItemFilter.ts";
import ExcludePermissionsControl from "../filters/ExcludePermissionsControl.tsx";
import PresenceFilterControl from "../filters/PresenceFilterControl.tsx";
import SearchControl from "../filters/SearchControl.tsx";
import ItemViewer from "../ItemViewer.tsx";

export default function Blueprints() {
  const {
    filteredLeft,
    filteredRight,
    searchText,
    setSearchText,
    presenceFilter,
    setPresenceFilter,
    excludePermissions,
    setExcludePermissions,
  } = useItemFilter({
    itemType: "Blueprints",
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
            itemType="Blueprints"
          />
        </Col>
      </Row>
    </Container>
  );
}
