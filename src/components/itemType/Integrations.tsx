import { useState } from "react";
import Button from "react-bootstrap/Button";
import Col from "react-bootstrap/Col";
import Container from "react-bootstrap/Container";
import Form from "react-bootstrap/Form";
import Row from "react-bootstrap/Row";

import { sourceConfig, destConfig } from "../../util/configs.ts";
import ItemViewer from "../ItemViewer.tsx";

export default function Integrations() {
  const itemType = "Integrations";
  const [typeFilter, setTypeFilter] = useState("");
  const [searchText, setSearchText] = useState("");

  const leftContents =
    sourceConfig?.[`source${itemType}` as keyof typeof sourceConfig];
  const rightContents =
    destConfig?.[`dest${itemType}` as keyof typeof destConfig];

  // Extract unique types from both arrays
  const uniqueTypes = Array.from(
    new Set([
      ...(Array.isArray(leftContents)
        ? leftContents.map((item) => item?.installationType)
        : []),
      ...(Array.isArray(rightContents)
        ? rightContents.map((item) => item?.installationType)
        : []),
    ])
  )
    .filter(Boolean)
    .sort((a, b) => String(a).localeCompare(String(b)));

  const lowerSearch = searchText.toLowerCase();

  // Filter contents based on selected type
  let filteredLeftContents = leftContents;
  if (Array.isArray(leftContents)) {
    if (typeFilter) {
      filteredLeftContents = leftContents.filter(
        (item) => item?.installationType === typeFilter
      );
    }

    if (searchText) {
      filteredLeftContents = filteredLeftContents.filter(
        (item) =>
          item?.identifier?.toLowerCase().includes(lowerSearch) ||
          item?.title?.toLowerCase().includes(lowerSearch)
      );
    }
  }

  let filteredRightContents = rightContents;
  if (Array.isArray(rightContents)) {
    if (typeFilter) {
      filteredRightContents = rightContents.filter(
        (item) => item?.installationType === typeFilter
      );
    }

    if (searchText) {
      filteredRightContents = filteredRightContents.filter(
        (item) =>
          item?.identifier?.toLowerCase().includes(lowerSearch) ||
          item?.title?.toLowerCase().includes(lowerSearch)
      );
    }
  }

  const handleTypeFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setTypeFilter(e.target.value);
  };

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
          {!!uniqueTypes.length && (
            <form>
              <label htmlFor="typeFilter">Filter by installation type: </label>
              <Form.Select
                id="typeFilter"
                name="typeFilter"
                value={typeFilter}
                onChange={handleTypeFilterChange}
              >
                <option value="">all installation types</option>
                {uniqueTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </Form.Select>
              {typeFilter && (
                <div style={{ marginTop: "10px" }}>
                  <small>
                    Currently filtering by type: <strong>{typeFilter}</strong>{" "}
                    <Button
                      variant="secondary"
                      onClick={() => setTypeFilter("")}
                    >
                      Clear filter
                    </Button>
                  </small>
                </div>
              )}
            </form>
          )}
        </Col>
      </Row>
      <Row>
        <Col>
          <hr />
          <ItemViewer
            filteredLeftContents={filteredLeftContents}
            filteredRightContents={filteredRightContents}
            itemType="Integrations"
          />
        </Col>
      </Row>
    </Container>
  );
}
