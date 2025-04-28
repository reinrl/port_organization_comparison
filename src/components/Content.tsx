import Actions from "./itemType/Actions";
import Home from "./itemType/Home";
import Items from "./itemType/Items";
import Pages from "./itemType/Pages";

interface ContentProps {
  item: string | null;
}

export default function Content({ item }: Readonly<ContentProps>) {
  switch (item) {
    case "blueprints":
    case "integrations":
    case "scorecards":
      return <Items />;
      case "actions":
        return <Actions />;
      case "pages":
        return <Pages />;
    default:
      return <Home />;
  }
}
