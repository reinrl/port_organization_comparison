import devConfig from "./output/dev/blueprints.json";
import prodConfig from "./output/prod/blueprints.json";
import DiffViewer from "./DiffViewer";

export default function App() {
  return (
    <DiffViewer
      configItemName="blueprints"
      leftContents={JSON.stringify(devConfig, null, 2)}
      rightContents={JSON.stringify(prodConfig, null, 2)}
    />
  );
}
