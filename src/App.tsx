import { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFilter, faLightbulb as faLightbulbSolid } from "@fortawesome/free-solid-svg-icons";
import { faLightbulb as faLightbulbRegular } from "@fortawesome/free-regular-svg-icons";
import Badge from "react-bootstrap/Badge";
import Button from "react-bootstrap/Button";
import Container from "react-bootstrap/Container";
import Nav from "react-bootstrap/Nav";
import Navbar from "react-bootstrap/Navbar";

import NavBarItem from "./components/NavBarItem";
import Content from "./components/Content";
import FilterPanel from "./components/FilterPanel";
import { useEnvSelection } from "./contexts/EnvSelectionContext";
import { useFilterContext } from "./contexts/FilterContext";

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

  const { sourceEnv, destEnv, availableEnvs } = useEnvSelection();
  const { activeItemType, isFilterPanelOpen, setIsFilterPanelOpen, activeFilterCount } = useFilterContext();
  const sourceName =
    availableEnvs.find((e) => e.envName === sourceEnv)?.displayName ?? sourceEnv;
  const destName =
    availableEnvs.find((e) => e.envName === destEnv)?.displayName ?? destEnv;

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
    <div className="sticky-top">
      <Navbar expand="lg" className="bg-body-tertiary">
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
          <Nav className="ms-auto align-items-center gap-3">
            <Nav.Item>
              <span className="text-muted small">
                {sourceName} &rarr; {destName}
              </span>
            </Nav.Item>
            {activeItemType && (
              <Button
                variant={isFilterPanelOpen ? "secondary" : "outline-secondary"}
                size="sm"
                onClick={() => setIsFilterPanelOpen((v) => !v)}
                className="d-flex align-items-center gap-1"
                title={isFilterPanelOpen ? "Hide available filters" : "Show available filters"}
              >
                <FontAwesomeIcon icon={faFilter} />
                {activeFilterCount > 0 && (
                  <Badge bg="primary" pill>
                    {activeFilterCount}
                  </Badge>
                )}
              </Button>
            )}
            <Button
              variant="outline-secondary"
              size="sm"
              onClick={() => setTheme(t => t === "dark" ? "light" : "dark")}
              className="d-flex align-items-center"
              title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            >
              <FontAwesomeIcon icon={theme === "light" ? faLightbulbSolid : faLightbulbRegular} />
            </Button>
          </Nav>
        </Container>
      </Navbar>
      <FilterPanel />
    </div>
      <Content item={itemType} />
    </>
  );
}
