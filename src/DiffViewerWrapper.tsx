import { sourceConfig, destConfig } from "./util/configs.ts";
import DiffViewer from "./DiffViewer.tsx";

export default function DiffViewerWrapper() {
  const urlParams = new URLSearchParams(window.location.search);
  const item = urlParams.get("item");

  const sourceConfigItem = sourceConfig?.[`source${item}`];
  const destConfigItem = destConfig?.[`dest${item}`];

  return (
    <>
      <h1>
        <a href="/">Home</a> | {item}
      </h1>
      <hr />
      <DiffViewer
        leftContents={JSON.stringify(sourceConfigItem, null, 2)}
        rightContents={JSON.stringify(destConfigItem, null, 2)}
      />
    </>
  );
}
