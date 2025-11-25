import Accordion from "react-bootstrap/Accordion";
import Alert from "react-bootstrap/Alert";
import Badge from "react-bootstrap/Badge";
import ReactDiffViewer from "react-diff-viewer-continued";
import validationResults from "../output/page_validation_results.json";

interface ItemViewerProps {
  filteredLeftContents: any[];
  filteredRightContents: any[];
  itemType?: string;
}

export default function ItemViewer({
  filteredLeftContents,
  filteredRightContents,
  itemType,
}: Readonly<ItemViewerProps>) {
  // Helper function to get validation info for a page
  const getValidationInfo = (identifier: string) => {
    if (itemType !== "Pages") {
      return null;
    }

    // Check all environments for validation results
    const envResults: any[] = [];
    if (validationResults?.environments) {
      Object.entries(validationResults.environments).forEach(
        ([envName, envData]: [string, any]) => {
          if (envData?.pages?.[identifier]) {
            const pageData = envData.pages[identifier];
            if (
              pageData.violations?.length > 0 ||
              pageData.warnings?.length > 0
            ) {
              envResults.push({
                environment: envName,
                pageTitle: pageData.pageTitle,
                pageType: pageData.pageType,
                violations: pageData.violations || [],
                warnings: pageData.warnings || [],
              });
            }
          }
        }
      );
    }

    return envResults.length > 0 ? envResults : null;
  };

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

        // Get validation info for this item
        const validationInfo = getValidationInfo(item);

        return (
          <Accordion.Item eventKey={item} key={item}>
            <Accordion.Header>
              <div className="d-flex justify-content-between align-items-center w-100">
                <div className="me-2 fw-bold">{item}</div>
                <div className="d-flex gap-2">
                  {validationInfo && (
                    <Badge bg="warning" text="dark">
                      Validation Issues
                    </Badge>
                  )}
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
              </div>
            </Accordion.Header>
            {(!contentsAreIdentical || validationInfo) && (
              <Accordion.Body>
                {validationInfo && (
                  <div className="mb-3">
                    <h5>Validation Results</h5>
                    {validationInfo.map((envInfo: any, idx: number) => (
                      <div key={idx} className="mb-3">
                        <h6>
                          Environment:{" "}
                          <Badge bg="secondary">{envInfo.environment}</Badge>{" "}
                          Page: {envInfo.pageTitle} ({envInfo.pageType})
                        </h6>

                        {envInfo.violations.length > 0 && (
                          <Alert variant="danger">
                            <Alert.Heading>
                              <i className="bi bi-exclamation-triangle-fill me-2"></i>
                              Violations ({envInfo.violations.length})
                            </Alert.Heading>
                            {envInfo.violations.map(
                              (violation: any, vIdx: number) => (
                                <div key={vIdx} className="mb-2">
                                  <strong>Widget:</strong>{" "}
                                  {violation.widgetTitle} (
                                  {violation.widgetType})
                                  <br />
                                  <strong>Issue:</strong> {violation.message}
                                  <br />
                                  {violation.blueprintIdentifier && (
                                    <>
                                      <strong>Blueprint:</strong>{" "}
                                      {violation.blueprintIdentifier}
                                      <br />
                                    </>
                                  )}
                                  {violation.invalidProperty && (
                                    <>
                                      <strong>Property:</strong>{" "}
                                      {violation.invalidProperty}
                                      <br />
                                    </>
                                  )}
                                  <strong>Location:</strong>{" "}
                                  {violation.locationType}
                                  {vIdx < envInfo.violations.length - 1 && (
                                    <hr />
                                  )}
                                </div>
                              )
                            )}
                          </Alert>
                        )}

                        {envInfo.warnings.length > 0 && (
                          <Alert variant="warning">
                            <Alert.Heading>
                              <i className="bi bi-exclamation-circle-fill me-2"></i>
                              Warnings ({envInfo.warnings.length})
                            </Alert.Heading>
                            {envInfo.warnings.map(
                              (warning: any, wIdx: number) => (
                                <div key={wIdx} className="mb-2">
                                  <strong>Widget:</strong> {warning.widgetTitle}{" "}
                                  ({warning.widgetType})
                                  <br />
                                  <strong>Issue:</strong> {warning.message}
                                  <br />
                                  {warning.blueprintIdentifier && (
                                    <>
                                      <strong>Blueprint:</strong>{" "}
                                      {warning.blueprintIdentifier}
                                      <br />
                                    </>
                                  )}
                                  {warning.invalidProperty && (
                                    <>
                                      <strong>Property:</strong>{" "}
                                      {warning.invalidProperty}
                                      <br />
                                    </>
                                  )}
                                  <strong>Location:</strong>{" "}
                                  {warning.locationType}
                                  {wIdx < envInfo.warnings.length - 1 && <hr />}
                                </div>
                              )
                            )}
                          </Alert>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                {!contentsAreIdentical && (
                  <ReactDiffViewer
                    oldValue={leftItemAsString}
                    leftTitle="Source"
                    newValue={rightItemAsString}
                    rightTitle="Destination"
                    splitView={true}
                  />
                )}
              </Accordion.Body>
            )}
          </Accordion.Item>
        );
      })}
    </Accordion>
  );
}
