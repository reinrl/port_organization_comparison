import Home from "./itemType/Home";
import Items from "./itemType/Items";
import Pages from "./itemType/Pages";

interface ContentProps {
  item: string | null;
}

export default function Content({ item }: Readonly<ContentProps>) {
  switch (item) {
    case "actions":
    case "blueprints":
    case "integrations":
    case "scorecards":
      return <Items />;
      case "pages":
        return <Pages />;
    default:
      return <Home />;
  }
}
