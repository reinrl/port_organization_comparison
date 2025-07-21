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

  const leftContents =
    sourceConfig?.[`source${itemType}` as keyof typeof sourceConfig];
  const rightContents = destConfig?.[`dest${itemType}` as keyof typeof destConfig];

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

    // Filter contents based on selected type
    let filteredLeftContents = leftContents;
    if (Array.isArray(leftContents)) {
      if (typeFilter) {
        filteredLeftContents = leftContents.filter(item => item?.type === typeFilter);
      }
      
      if (excludePermissions) {
        filteredLeftContents = filteredLeftContents.map(item => {
          if (!item) return item;
          const { permissions, ...rest } = item;
          return rest;
        });
      }
    }

    let filteredRightContents = rightContents;
    if (Array.isArray(rightContents)) {
      if (typeFilter) {
        filteredRightContents = rightContents.filter(item => item?.type === typeFilter);
      }
      
      if (excludePermissions) {
        filteredRightContents = filteredRightContents.map(item => {
          if (!item) return item;
          const { permissions, ...rest } = item;
          return rest;
        });
      }
    }

  const handleTypeFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setTypeFilter(e.target.value);
  };

  const handleExcludePermissionsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const isChecked = e.target.checked;
    setExcludePermissions(isChecked);
  };

  return (
    <Container fluid>
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
          />
        </Col>
      </Row>
    </Container>
  );
}
