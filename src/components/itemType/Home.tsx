import Col from "react-bootstrap/Col";
import Container from "react-bootstrap/Container";
import Form from "react-bootstrap/Form";
import Row from "react-bootstrap/Row";
import { useEnvSelection } from "../../contexts/EnvSelectionContext.tsx";

export default function Home() {
  const { sourceEnv, destEnv, setSourceEnv, setDestEnv, availableEnvs } =
    useEnvSelection();

  const sourceName =
    availableEnvs.find((e) => e.envName === sourceEnv)?.displayName ?? sourceEnv;
  const destName =
    availableEnvs.find((e) => e.envName === destEnv)?.displayName ?? destEnv;

  return (
    <Container className="mt-4">
      <Row className="mb-3 g-3">
        <Col md={4}>
          <Form.Group>
            <Form.Label>Source</Form.Label>
            <Form.Select
              value={sourceEnv}
              onChange={(e) => setSourceEnv(e.target.value)}
            >
              {availableEnvs.map(({ envName, displayName }) => (
                <option key={envName} value={envName} disabled={envName === destEnv}>
                  {displayName}
                </option>
              ))}
            </Form.Select>
          </Form.Group>
        </Col>
        <Col md={4}>
          <Form.Group>
            <Form.Label>Destination</Form.Label>
            <Form.Select
              value={destEnv}
              onChange={(e) => setDestEnv(e.target.value)}
            >
              {availableEnvs.map(({ envName, displayName }) => (
                <option key={envName} value={envName} disabled={envName === sourceEnv}>
                  {displayName}
                </option>
              ))}
            </Form.Select>
          </Form.Group>
        </Col>
      </Row>
      <p className="text-muted">
        Currently comparing: <strong>{sourceName}</strong> &rarr;{" "}
        <strong>{destName}</strong>. Select an option from the menu above to
        view the diff.
      </p>
    </Container>
  );
}
