import ReactDOM from "react-dom/client";
import App from "./App";
import { EnvSelectionProvider } from "./contexts/EnvSelectionContext";
import { FilterProvider } from "./contexts/FilterContext";

const rootElement = document.getElementById("root") as HTMLElement;
ReactDOM.createRoot(rootElement).render(
  <EnvSelectionProvider>
    <FilterProvider>
      <App />
    </FilterProvider>
  </EnvSelectionProvider>
);
