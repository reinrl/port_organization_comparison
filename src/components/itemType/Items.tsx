import Col from "react-bootstrap/Col";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";

import { sourceConfig, destConfig } from "../../util/configs.ts";
import ItemViewer from "../ItemViewer.tsx";

export default function Items() {
  const urlParams = new URLSearchParams(window.location.search);
  const item = urlParams.get("item");

  const leftContents =
    sourceConfig?.[`source${item}` as keyof typeof sourceConfig];
  const rightContents = destConfig?.[`dest${item}` as keyof typeof destConfig];

  return (
    <Container fluid>
      <Row>
        <Col>
          <hr />
          <ItemViewer
            filteredLeftContents={leftContents}
            filteredRightContents={rightContents}
          />
        </Col>
      </Row>
    </Container>
  );
}
