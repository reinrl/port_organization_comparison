import Container from "react-bootstrap/Container";
import CorrectRunUrl from "../actions/CorrectRunUrl";

export default function Home() {
  return (
    <Container>
      <h1>
        Select an option from the menu above to view the current diff.
      </h1>
      <hr />
      <CorrectRunUrl />
    </Container>
  );
}