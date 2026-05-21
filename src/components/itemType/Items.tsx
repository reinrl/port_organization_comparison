import Col from "react-bootstrap/Col";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";

import { useItemFilter } from "../../hooks/useItemFilter.ts";
import PresenceFilterControl from "../filters/PresenceFilterControl.tsx";
import SearchControl from "../filters/SearchControl.tsx";
import ItemViewer from "../ItemViewer.tsx";

export default function Items() {
  const urlParams = new URLSearchParams(globalThis.location.search);
  const itemType = urlParams.get("itemType") ?? "";

  const {
    filteredLeft,
    filteredRight,
    searchText,
    setSearchText,
    presenceFilter,
    setPresenceFilter,
  } = useItemFilter({ itemType });

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
          <ItemViewer
            filteredLeftContents={filteredLeft}
            filteredRightContents={filteredRight}
            itemType="Items"
          />
        </Col>
      </Row>
    </Container>
  );
}
