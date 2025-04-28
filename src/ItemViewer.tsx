import Accordion from "react-bootstrap/Accordion";
import DiffViewer from "./DiffViewer";

interface ItemViewerProps {
  filteredLeftContents: any[];
  filteredRightContents: any[];
}

export default function ItemViewer({
  filteredLeftContents,
  filteredRightContents,
}: Readonly<ItemViewerProps>) {
  // create list of unique types from both left and right contents
  const uniqueItems = Array.from(
    new Set([
      ...(Array.isArray(filteredLeftContents)
        ? filteredLeftContents.map((item) => item?.identifier)
        : []),
      ...(Array.isArray(filteredRightContents)
        ? filteredRightContents.map((item) => item?.identifier)
        : []),
    ])
  ).sort((a, b) => String(a).localeCompare(String(b)));

  return (
    <Accordion>
      {uniqueItems.map((item) => {
        // attempt to find the item in both left and right contents
        const leftItem = filteredLeftContents?.find(
          (i) => i?.identifier === item
        );
        const rightItem = filteredRightContents?.find(
          (i) => i?.identifier === item
        );

        // stringify the contents of left and right contents
        const leftItemAsString = JSON.stringify(leftItem, null, 2);
        const rightItemAsString = JSON.stringify(rightItem, null, 2);
        const contentsAreIdentical = leftItemAsString === rightItemAsString;

        return (
          <Accordion.Item eventKey={item} key={item}>
            <Accordion.Header>
              <div className="d-flex justify-content-between">
                <div className="me-2 fw-bold">{item}</div>
                {leftItem === undefined && (
                  <div className="text-danger">(not in source)</div>
                )}
                {rightItem === undefined && (
                  <div className="text-danger">(not in destination)</div>
                )}
                {contentsAreIdentical && (
                  <div className="text-success">(contents identical)</div>
                )}
              </div>
            </Accordion.Header>
            <Accordion.Body>
              {contentsAreIdentical ? (
                <p>no difference</p>
              ) : (
                <DiffViewer
                  leftContents={leftItemAsString}
                  rightContents={rightItemAsString}
                />
              )}
            </Accordion.Body>
          </Accordion.Item>
        );
      })}
    </Accordion>
  );
}
