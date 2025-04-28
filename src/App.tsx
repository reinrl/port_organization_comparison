import Container from "react-bootstrap/Container";
import Nav from "react-bootstrap/Nav";
import Navbar from "react-bootstrap/Navbar";

import NavBarItem from "./components/NavBarItem";
import Content from "./components/Content";

export default function App() {
  const urlParams = new URLSearchParams(window.location.search);
  const itemType = urlParams.get("itemType");

  let activeKey;
  switch (itemType) {
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

  return (
    <>
      <Navbar expand="lg" className="bg-body-tertiary" sticky="top">
        <Container>
          <Nav className="me-auto" activeKey={activeKey}>
            <NavBarItem eventKey="home" href="/" label="Home" />
            <NavBarItem
              eventKey="actions"
              href="/?itemType=actions"
              label="Actions"
            />
            <NavBarItem
              eventKey="blueprints"
              href="/?itemType=blueprints"
              label="Blueprints"
            />
            <NavBarItem
              eventKey="integrations"
              href="/?itemType=integrations"
              label="Integrations"
            />
            <NavBarItem eventKey="pages" href="/?itemType=pages" label="Pages" />
            <NavBarItem
              eventKey="scorecards"
              href="/?itemType=scorecards"
              label="Scorecards"
            />
          </Nav>
        </Container>
      </Navbar>
      <Content item={itemType} />
    </>
  );
}
