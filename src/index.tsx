import ReactDOM from "react-dom/client";
import App from "./App";
import { EnvSelectionProvider } from "./contexts/EnvSelectionContext";

const rootElement = document.getElementById("root") as HTMLElement;
ReactDOM.createRoot(rootElement).render(
  <EnvSelectionProvider>
    <App />
  </EnvSelectionProvider>
);
