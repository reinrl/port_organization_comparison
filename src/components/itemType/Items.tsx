import { useState } from "react";
import Col from "react-bootstrap/Col";
import Container from "react-bootstrap/Container";
import Form from "react-bootstrap/Form";
import Row from "react-bootstrap/Row";

import { sourceConfig, destConfig } from "../../util/configs.ts";
import ItemViewer from "../ItemViewer.tsx";

export default function Items() {
  const urlParams = new URLSearchParams(window.location.search);
  const item = urlParams.get("itemType");
  const [searchText, setSearchText] = useState("");

  const leftContents =
    sourceConfig?.[`source${item}` as keyof typeof sourceConfig];
  const rightContents = destConfig?.[`dest${item}` as keyof typeof destConfig];

  const lowerSearch = searchText.toLowerCase();

  let filteredLeftContents = leftContents;
  if (Array.isArray(leftContents) && searchText) {
    filteredLeftContents = leftContents.filter(
      (i) =>
        i?.identifier?.toLowerCase().includes(lowerSearch) ||
        i?.title?.toLowerCase().includes(lowerSearch)
    );
  }

  let filteredRightContents = rightContents;
  if (Array.isArray(rightContents) && searchText) {
    filteredRightContents = rightContents.filter(
      (i) =>
        i?.identifier?.toLowerCase().includes(lowerSearch) ||
        i?.title?.toLowerCase().includes(lowerSearch)
    );
  }

  const handleSearchTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchText(e.target.value);
  };

  return (
    <Container fluid>
      <Row>
        <Col>
          <Form.Group className="mb-3" controlId="searchText">
            <Form.Label>Search by identifier or title</Form.Label>
            <Form.Control
              type="text"
              placeholder="Search by identifier or title..."
              value={searchText}
              onChange={handleSearchTextChange}
            />
          </Form.Group>
        </Col>
      </Row>
      <Row>
        <Col>
          <hr />
          <ItemViewer
            filteredLeftContents={filteredLeftContents}
            filteredRightContents={filteredRightContents}
            itemType="Items"
          />
        </Col>
      </Row>
    </Container>
  );
}
