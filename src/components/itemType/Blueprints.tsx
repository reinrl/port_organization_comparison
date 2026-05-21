import { useState } from "react";
import Button from "react-bootstrap/Button";
import Col from "react-bootstrap/Col";
import Container from "react-bootstrap/Container";
import Form from "react-bootstrap/Form";
import Row from "react-bootstrap/Row";

import { sourceConfig, destConfig } from "../../util/configs.ts";
import ItemViewer from "../ItemViewer.tsx";

export default function Blueprints() {
  const itemType = "Blueprints";
  const [excludePermissions, setExcludePermissions] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [presenceFilter, setPresenceFilter] = useState("");

  const leftContents = sourceConfig?.[
    `source${itemType}` as keyof typeof sourceConfig
  ] as any[];
  const rightContents = destConfig?.[
    `dest${itemType}` as keyof typeof destConfig
  ] as any[];

  const lowerSearch = searchText.toLowerCase();

  // Filter contents based on selected identifier
  let filteredLeftContents: any[] = leftContents || [];
  if (Array.isArray(leftContents)) {
    if (searchText) {
      filteredLeftContents = filteredLeftContents.filter(
        (item) =>
          item?.identifier?.toLowerCase().includes(lowerSearch) ||
          item?.title?.toLowerCase().includes(lowerSearch)
      );
    }

    if (excludePermissions) {
      filteredLeftContents = (filteredLeftContents as any[]).map((item) => {
        if (!item) return item;
        // Use type assertion to handle the blueprint type
        const itemWithPermissions = item as any;
        const { permissions, ...rest } = itemWithPermissions;
        return rest;
      });
    }
  }

  let filteredRightContents: any[] = rightContents || [];
  if (Array.isArray(rightContents)) {
    if (searchText) {
      filteredRightContents = filteredRightContents.filter(
        (item) =>
          item?.identifier?.toLowerCase().includes(lowerSearch) ||
          item?.title?.toLowerCase().includes(lowerSearch)
      );
    }

    if (excludePermissions) {
      filteredRightContents = (filteredRightContents as any[]).map((item) => {
        if (!item) return item;
        // Use type assertion to handle the blueprint type
        const itemWithPermissions = item as any;
        const { permissions, ...rest } = itemWithPermissions;
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
            itemType="Blueprints"
          />
        </Col>
      </Row>
    </Container>
  );
}
