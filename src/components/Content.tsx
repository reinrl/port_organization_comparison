import Actions from "./itemType/Actions";
import Blueprints from "./itemType/Blueprints";
import Home from "./itemType/Home";
import Integrations from "./itemType/Integrations";
import Items from "./itemType/Items";
import Pages from "./itemType/Pages";

interface ContentProps {
  item: string | null;
}

export default function Content({ item }: Readonly<ContentProps>) {
  switch (item) {
    case null:
      return <Home />;
    case "Actions":
      return <Actions />;
    case "Blueprints":
      return <Blueprints />;
    case "Integrations":
      return <Integrations />;
    case "Pages":
      return <Pages />;
    default:
      return <Items />;
  }
}
