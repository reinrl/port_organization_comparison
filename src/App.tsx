import Container from "react-bootstrap/Container";
import Nav from "react-bootstrap/Nav";
import Navbar from "react-bootstrap/Navbar";

import Items from "./Items";
import NavBarItem from "./NavBarItem";

export default function App() {
  const urlParams = new URLSearchParams(window.location.search);
  const view = urlParams.get("view");
  const item = urlParams.get("item");

  let activeKey;
  if (view === "diff") {
    switch (item) {
      case "actions":
        activeKey = "actions";
        break;
      case "blueprints":
        activeKey = "blueprints";
        break;
      case "integrations":
        activeKey = "integrations";
        break;
      case "pages":
        activeKey = "pages";
        break;
      case "scorecards":
        activeKey = "scorecards";
        break;
      default:
        activeKey = "home";
    }
  }

  return (
    <>
      <Navbar expand="lg" className="bg-body-tertiary" sticky="top">
        <Container>
          <Nav className="me-auto" activeKey={activeKey}>
            <NavBarItem eventKey="home" href="/" label="Home" />
            <NavBarItem
              eventKey="actions"
              href="/?view=diff&item=actions"
              label="Actions"
            />
            <NavBarItem
              eventKey="blueprints"
              href="/?view=diff&item=blueprints"
              label="Blueprints"
            />
            <NavBarItem
              eventKey="integrations"
              href="/?view=diff&item=integrations"
              label="Integrations"
            />
            <NavBarItem
              eventKey="pages"
              href="/?view=diff&item=pages"
              label="Pages"
            />
            <NavBarItem
              eventKey="scorecards"
              href="/?view=diff&item=scorecards"
              label="Scorecards"
            />
          </Nav>
        </Container>
      </Navbar>
      {view === "diff" ? (
        <Items />
      ) : (
        <Container>
          <h1>
            Select an option from the menu above to view the current diff.
          </h1>
        </Container>
      )}
    </>
  );
}
