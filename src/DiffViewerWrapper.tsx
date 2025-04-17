import { devConfig, prodConfig } from "./util/configs.ts";
import DiffViewer from "./DiffViewer.tsx";

export default function DiffViewerWrapper() {
  const urlParams = new URLSearchParams(window.location.search);
  const item = urlParams.get("item");

  const devConfigItem = devConfig?.[`dev${item}`];
  const prodConfigItem = prodConfig?.[`prod${item}`];

  return (
    <>
      <h1>
        <a href="/">Home</a> | {item}
      </h1>
      <hr />
      <DiffViewer
        leftContents={JSON.stringify(devConfigItem, null, 2)}
        rightContents={JSON.stringify(prodConfigItem, null, 2)}
      />
    </>
  );
}
