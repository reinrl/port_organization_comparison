import Container from "react-bootstrap/Container";

import { useFilterContext } from "../../contexts/FilterContext.tsx";
import ItemViewer from "../ItemViewer.tsx";

export default function Items() {
  const { filteredLeft, filteredRight } = useFilterContext();

  return (
    <Container fluid>
      <ItemViewer
        filteredLeftContents={filteredLeft}
        filteredRightContents={filteredRight}
        itemType="Items"
      />
    </Container>
  );
}
