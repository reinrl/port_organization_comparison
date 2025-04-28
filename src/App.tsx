import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import DiffViewerWrapper from "./DiffViewerWrapper";

export default function App() {
  const urlParams = new URLSearchParams(window.location.search);
  const view = urlParams.get("view");

  if (view === "diff") {
    return <DiffViewerWrapper />;
  }

  return (
    <Container>
      <Row>
        <Col>
          <h1>Home</h1>
        </Col>
      </Row>
      <Row>
        <Col>
          <p>Select an item below to view the current diff:</p>
          <ul>
            <li>
              <a href="/?view=diff&item=actions">actions</a>
            </li>
            <li>
              <a href="/?view=diff&item=blueprints">blueprints</a>
            </li>
            <li>
              <a href="/?view=diff&item=integrations">integrations</a>
            </li>
            <li>
              <a href="/?view=diff&item=pages">pages</a>
            </li>
            <li>
              <a href="/?view=diff&item=scorecards">scorecards</a>
            </li>
          </ul>
        </Col>
      </Row>
    </Container>
  );
}
