import DiffViewerWrapper from "./DiffViewerWrapper";

export default function App() {
  const urlParams = new URLSearchParams(window.location.search);
  const view = urlParams.get("view");

  if (view === "diff") {
    return <DiffViewerWrapper />;
  }

  return (
    <div>
      <h1>Home</h1>
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
    </div>
  );
}
