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

  const leftContents = sourceConfig?.[
    `source${itemType}` as keyof typeof sourceConfig
  ] as any[];
  const rightContents = destConfig?.[
    `dest${itemType}` as keyof typeof destConfig
  ] as any[];

  // Filter contents based on selected identifier
  let filteredLeftContents: any[] = leftContents || [];
  if (Array.isArray(leftContents)) {
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

  const handleExcludePermissionsChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const isChecked = e.target.checked;
    setExcludePermissions(isChecked);
  };

  return (
    <Container fluid>
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
