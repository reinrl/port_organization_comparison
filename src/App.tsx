import { useState, useEffect } from "react";
import Button from "react-bootstrap/Button";
import Container from "react-bootstrap/Container";
import Nav from "react-bootstrap/Nav";
import Navbar from "react-bootstrap/Navbar";

import NavBarItem from "./components/NavBarItem";
import Content from "./components/Content";

export default function App() {
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    const saved = localStorage.getItem("theme");
    if (saved === "light" || saved === "dark") return saved;
    return globalThis.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  });

  useEffect(() => {
    document.documentElement.dataset.bsTheme = theme;
    localStorage.setItem("theme", theme);
  }, [theme]);

  useEffect(() => {
    const mediaQuery = globalThis.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = (e: MediaQueryListEvent) => {
      if (!localStorage.getItem("theme")) {
        setTheme(e.matches ? "dark" : "light");
      }
    };
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  const urlParams = new URLSearchParams(window.location.search);
  const itemType = urlParams.get("itemType");

  let activeKey;
  switch (itemType) {
    case "Actions":
      activeKey = "Actions";
      break;
    case "Blueprints":
      activeKey = "Blueprints";
      break;
    case "Integrations":
      activeKey = "Integrations";
      break;
    case "Pages":
      activeKey = "Pages";
      break;
    case "Scorecards":
      activeKey = "Scorecards";
      break;
      case "Webhooks":
        activeKey = "Webhooks";
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
              eventKey="Actions"
              href="/?itemType=Actions"
              label="Actions"
            />
            <NavBarItem
              eventKey="Blueprints"
              href="/?itemType=Blueprints"
              label="Blueprints"
            />
            <NavBarItem
              eventKey="Integrations"
              href="/?itemType=Integrations"
              label="Integrations"
            />
            <NavBarItem eventKey="Pages" href="/?itemType=Pages" label="Pages" />
            <NavBarItem
              eventKey="Scorecards"
              href="/?itemType=Scorecards"
              label="Scorecards"
            />
            <NavBarItem
              eventKey="Webhooks"
              href="/?itemType=Webhooks"
              label="Webhooks"
            />
          </Nav>
          <Nav className="ms-auto">
            <Button
              variant="outline-secondary"
              size="sm"
              onClick={() => setTheme(t => t === "dark" ? "light" : "dark")}
            >
              {theme === "dark" ? "Show me the light!" : "Dark mode, please!"}
            </Button>
          </Nav>
        </Container>
      </Navbar>
      <Content item={itemType} />
    </>
  );
}
