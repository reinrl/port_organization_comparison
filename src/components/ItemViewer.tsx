import { useState, useEffect, useMemo, memo } from "react";
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

interface ItemRowProps {
  identifier: string;
  leftItem: any;
  rightItem: any;
  isDarkTheme: boolean;
  itemType?: string;
}

function getValidationInfo(identifier: string, itemType?: string): any[] | null {
  if (itemType !== "Pages") return null;
  const envResults: any[] = [];
  if (validationResults?.environments) {
    Object.entries(validationResults.environments).forEach(
      ([envName, envData]: [string, any]) => {
        if (envData?.pages?.[identifier]) {
          const pageData = envData.pages[identifier];
          if (pageData.violations?.length > 0 || pageData.warnings?.length > 0) {
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
}

const ItemRow = memo(function ItemRow({
  identifier,
  leftItem,
  rightItem,
  isDarkTheme,
  itemType,
}: ItemRowProps) {
  const leftItemAsString = useMemo(() => JSON.stringify(leftItem, null, 2), [leftItem]);
  const rightItemAsString = useMemo(() => JSON.stringify(rightItem, null, 2), [rightItem]);
  const contentsAreIdentical = leftItemAsString === rightItemAsString;
  const validationInfo = useMemo(
    () => getValidationInfo(identifier, itemType),
    [identifier, itemType]
  );

  return (
    <Accordion.Item eventKey={identifier}>
      <Accordion.Header>
        <div className="d-flex justify-content-between align-items-center w-100">
          <div className="me-2 fw-bold">{identifier}</div>
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
        <Accordion.Collapse eventKey={identifier} unmountOnExit>
          <div className="accordion-body">
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
                              {violation.widgetTitle} ({violation.widgetType})
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
                              {vIdx < envInfo.violations.length - 1 && <hr />}
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
                useDarkTheme={isDarkTheme}
              />
            )}
          </div>
        </Accordion.Collapse>
      )}
    </Accordion.Item>
  );
});

export default function ItemViewer({
  filteredLeftContents,
  filteredRightContents,
  itemType,
}: Readonly<ItemViewerProps>) {
  const [isDarkTheme, setIsDarkTheme] = useState(
    () => document.documentElement.dataset.bsTheme === "dark"
  );

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDarkTheme(document.documentElement.dataset.bsTheme === "dark");
    });
    observer.observe(document.documentElement, { attributeFilter: ["data-bs-theme"] });
    return () => observer.disconnect();
  }, []);

  const uniqueItems = useMemo(
    () =>
      Array.from(
        new Set([
          ...(Array.isArray(filteredLeftContents)
            ? filteredLeftContents.map((item) => item?.identifier)
            : []),
          ...(Array.isArray(filteredRightContents)
            ? filteredRightContents.map((item) => item?.identifier)
            : []),
        ])
      ).sort((a, b) => String(a).localeCompare(String(b))),
    [filteredLeftContents, filteredRightContents]
  );

  const leftMap = useMemo(() => {
    const m = new Map<string, any>();
    if (Array.isArray(filteredLeftContents)) {
      filteredLeftContents.forEach((item) => {
        if (item?.identifier) m.set(item.identifier, item);
      });
    }
    return m;
  }, [filteredLeftContents]);

  const rightMap = useMemo(() => {
    const m = new Map<string, any>();
    if (Array.isArray(filteredRightContents)) {
      filteredRightContents.forEach((item) => {
        if (item?.identifier) m.set(item.identifier, item);
      });
    }
    return m;
  }, [filteredRightContents]);

  return (
    <Accordion>
      {uniqueItems.map((identifier) => (
        <ItemRow
          key={identifier}
          identifier={identifier}
          leftItem={leftMap.get(identifier)}
          rightItem={rightMap.get(identifier)}
          isDarkTheme={isDarkTheme}
          itemType={itemType}
        />
      ))}
    </Accordion>
  );
}
