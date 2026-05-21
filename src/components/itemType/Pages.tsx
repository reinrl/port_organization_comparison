import { useState } from "react";
import Button from "react-bootstrap/Button";
import Col from "react-bootstrap/Col";
import Container from "react-bootstrap/Container";
import Form from "react-bootstrap/Form";
import Row from "react-bootstrap/Row";

import { sourceConfig, destConfig } from "../../util/configs.ts";
import ItemViewer from "../ItemViewer.tsx";

export default function Pages() {
  const itemType = "Pages";
  const [typeFilter, setTypeFilter] = useState("");
  const [excludePermissions, setExcludePermissions] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [presenceFilter, setPresenceFilter] = useState("");

  const leftContents =
    sourceConfig?.[`source${itemType}` as keyof typeof sourceConfig];
  const rightContents =
    destConfig?.[`dest${itemType}` as keyof typeof destConfig];

  // Extract unique types from both arrays
  const uniqueTypes = Array.from(
    new Set([
      ...(Array.isArray(leftContents)
        ? leftContents.map((item) => item?.type)
        : []),
      ...(Array.isArray(rightContents)
        ? rightContents.map((item) => item?.type)
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
        (item) => item?.type === typeFilter
      );
    }

    if (searchText) {
      filteredLeftContents = filteredLeftContents.filter(
        (item) =>
          item?.identifier?.toLowerCase().includes(lowerSearch) ||
          item?.title?.toLowerCase().includes(lowerSearch)
      );
    }

    if (excludePermissions) {
      filteredLeftContents = filteredLeftContents.map((item) => {
        if (!item) return item;
        const { permissions, ...rest } = item;
        return rest;
      });
    }
  }

  let filteredRightContents = rightContents;
  if (Array.isArray(rightContents)) {
    if (typeFilter) {
      filteredRightContents = rightContents.filter(
        (item) => item?.type === typeFilter
      );
    }

    if (searchText) {
      filteredRightContents = filteredRightContents.filter(
        (item) =>
          item?.identifier?.toLowerCase().includes(lowerSearch) ||
          item?.title?.toLowerCase().includes(lowerSearch)
      );
    }

    if (excludePermissions) {
      filteredRightContents = filteredRightContents.map((item) => {
        if (!item) return item;
        const { permissions, ...rest } = item;
        return rest;
      });
    }
  }

  if (presenceFilter === "not-in-destination") {
    const rightIdentifiers = new Set(
      (Array.isArray(filteredRightContents) ? filteredRightContents : []).map(
        (item: any) => item?.identifier
      )
    );
    filteredLeftContents = Array.isArray(filteredLeftContents)
      ? filteredLeftContents.filter(
          (item: any) => !rightIdentifiers.has(item?.identifier)
        )
      : filteredLeftContents;
    filteredRightContents = [];
  } else if (presenceFilter === "not-in-source") {
    const leftIdentifiers = new Set(
      (Array.isArray(filteredLeftContents) ? filteredLeftContents : []).map(
        (item: any) => item?.identifier
      )
    );
    filteredLeftContents = [];
    filteredRightContents = Array.isArray(filteredRightContents)
      ? filteredRightContents.filter(
          (item: any) => !leftIdentifiers.has(item?.identifier)
        )
      : filteredRightContents;
  }

  const handleTypeFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setTypeFilter(e.target.value);
  };

  const handleExcludePermissionsChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const isChecked = e.target.checked;
    setExcludePermissions(isChecked);
  };

  const handleSearchTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchText(e.target.value);
  };

  const handlePresenceFilterChange = (
    e: React.ChangeEvent<HTMLSelectElement>
  ) => {
    setPresenceFilter(e.target.value);
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
          <Form.Group className="mb-3" controlId="presenceFilter">
            <Form.Label>Filter by presence</Form.Label>
            <Form.Select
              id="presenceFilter"
              value={presenceFilter}
              onChange={handlePresenceFilterChange}
            >
              <option value="">show all</option>
              <option value="not-in-source">not in source</option>
              <option value="not-in-destination">not in destination</option>
            </Form.Select>
          </Form.Group>
        </Col>
      </Row>
      <Row>
        <Col>
          {!!uniqueTypes.length && (
            <form>
              <label htmlFor="typeFilter">Filter by type: </label>
              <Form.Select
                id="typeFilter"
                name="typeFilter"
                value={typeFilter}
                onChange={handleTypeFilterChange}
              >
                <option value="">all types</option>
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
          <Form.Group className="mb-3" controlId="excludePermissions">
            <Form.Check
              type="checkbox"
              label="Exclude Permissions from Comparison"
              checked={excludePermissions}
              onChange={handleExcludePermissionsChange}
            />
            <Form.Text className="text-muted">
              When checked, permissions will be excluded from the comparison.
            </Form.Text>
          </Form.Group>
        </Col>
      </Row>
      <Row>
        <Col>
          <hr />
          <ItemViewer
            filteredLeftContents={filteredLeftContents}
            filteredRightContents={filteredRightContents}
            itemType="Pages"
          />
        </Col>
      </Row>
    </Container>
  );
}
