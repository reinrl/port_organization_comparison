import destactions from "../output/dest/actions.json";
import destblueprints from "../output/dest/blueprints.json";
import destintegrations from "../output/dest/integrations.json";
import destpages from "../output/dest/pages.json";
import destscorecards from "../output/dest/scorecards.json";

const destConfig = {
	destactions,
	destblueprints,
	destintegrations,
	destpages,
	destscorecards,
};

import sourceactions from "../output/source/actions.json";
import sourceblueprints from "../output/source/blueprints.json";
import sourceintegrations from "../output/source/integrations.json";
import sourcepages from "../output/source/pages.json";
import sourcescorecards from "../output/source/scorecards.json";

const sourceConfig = {
	sourceactions,
	sourceblueprints,
	sourceintegrations,
	sourcepages,
	sourcescorecards,
};

export { destConfig,sourceConfig };
