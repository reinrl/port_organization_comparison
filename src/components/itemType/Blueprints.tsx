import Container from "react-bootstrap/Container";

import { useFilterContext } from "../../contexts/FilterContext.tsx";
import ItemViewer from "../ItemViewer.tsx";

export default function Blueprints() {
  const { filteredLeft, filteredRight } = useFilterContext();

  return (
    <Container fluid>
      <ItemViewer
        filteredLeftContents={filteredLeft}
        filteredRightContents={filteredRight}
        itemType="Blueprints"
      />
    </Container>
  );
}
