import actions from "../../output/dest/Actions.json";
import portConfig from "../../envs/dest.json";

/**
 * Custom logger function that logs to console with timestamp (browser-compatible)
 * Note: File logging is not available in browser environment
 * @param message - Message to log
 * @param isError - Whether this is an error message
 */
function logToConsole(message: string, isError: boolean = false): void {
  const timestamp = new Date().toISOString();
  const formattedMessage = `[${timestamp}] ${message}`;

  // Log to console
  if (isError) {
    console.error(formattedMessage);
  } else {
    console.log(formattedMessage);
  }
}

export default function CorrectRunUrl() {
  const automations = actions.filter(
    (item) =>
      item?.trigger?.type === "automation" &&
      item?.invocationMethod?.mapping?.properties?.run_url
  );

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    // prevent default form submission behavior
    event.preventDefault();

    // Get form data
    const formData = new FormData(event.currentTarget);
    const checkedIds: string[] = [];

    // Iterate through form data entries to find checked checkboxes
    for (const [name, value] of formData.entries()) {
      if (value === "on") {
        // Checkbox checked value is 'on' by default
        checkedIds.push(name); // The name attribute contains our ID pattern
      }
    }

    // loop over checkedIds and update the run_url to make sure that the domain is correct
    for (const id of checkedIds) {
      const actionIdx = automations.findIndex(
        (action) => action.identifier === id
      );
      const action = automations[actionIdx];
      if (action) {
        const runUrl = action?.invocationMethod?.mapping?.properties?.run_url;

        logToConsole(
          `Processing action: ${action.identifier} with run_url: ${runUrl}`
        );
        if (runUrl) {
          try {
            // Parse URLs to compare protocol and domain
            const url = new URL(runUrl);
            const portUrl = new URL(portConfig.portWebDomain);

            // Check if protocol and domain match
            if (
              url.protocol !== portUrl.protocol ||
              url.host !== portUrl.host
            ) {
              // Update URL with correct protocol and domain
              url.protocol = portUrl.protocol;
              url.host = portUrl.host;

              if (action.invocationMethod?.mapping?.properties) {
                // Update the run_url
                action.invocationMethod.mapping.properties.run_url =
                  url.toString();
                // Update the action in the automations array
                automations[actionIdx] = action;
                logToConsole(
                  `Updated run_url for ${action.identifier}: ${url.toString()}`
                );
              }
            }
          } catch (error) {
            logToConsole(
              `Error processing run_url for ${action.identifier}: ${error}`,
              true
            );
          }
        }
      }
    }

    logToConsole(`Selected IDs: ${checkedIds.join(", ")}`);
  };

  return (
    <form onSubmit={handleSubmit}>
      <h1>Correct selected automation run URLs:</h1>
      {automations.map((action, index) => (
        <div key={index} className="mb-3 d-flex align-items-start">
          <input
            type="checkbox"
            id={action.identifier}
            name={action.identifier}
            className="mt-1"
          />
          <label className="ms-2" htmlFor={action.identifier}>
            {" "}
            {action.description}
            <br />
            (run_url:{" "}
            <span className="fst-italic">
              {action?.invocationMethod?.mapping?.properties?.run_url})
            </span>
          </label>
          <br />
          {/*<strong>Action {index + 1}:</strong>
            <pre>{JSON.stringify(action, null, 2)}</pre>*/}
        </div>
      ))}
      <button type="submit" className="btn btn-primary">
        Update dest run URL
      </button>
    </form>
  );
}
