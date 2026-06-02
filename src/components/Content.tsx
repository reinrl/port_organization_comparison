import Container from "react-bootstrap/Container";

import { useFilterContext } from "../contexts/FilterContext.tsx";
import Home from "./itemType/Home";
import ItemViewer from "./ItemViewer";

interface ContentProps {
  item: string | null;
}

export default function Content({ item }: Readonly<ContentProps>) {
  const { filteredLeft, filteredRight } = useFilterContext();

  if (item === null) return <Home />;

  return (
    <Container fluid>
      <ItemViewer
        filteredLeftContents={filteredLeft}
        filteredRightContents={filteredRight}
        itemType={item}
      />
    </Container>
  );
}
