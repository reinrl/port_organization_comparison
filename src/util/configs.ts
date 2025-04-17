import prodactions from "../output/prod/actions.json";
import prodblueprints from "../output/prod/blueprints.json";
import prodintegrations from "../output/prod/integrations.json";
import prodpages from "../output/prod/pages.json";
import prodscorecards from "../output/prod/scorecards.json";

const prodConfig = {
	prodactions,
	prodblueprints,
	prodintegrations,
	prodpages,
	prodscorecards,
};

import devactions from "../output/dev/actions.json";
import devblueprints from "../output/dev/blueprints.json";
import devintegrations from "../output/dev/integrations.json";
import devpages from "../output/dev/pages.json";
import devscorecards from "../output/dev/scorecards.json";

const devConfig = {
	devactions,
	devblueprints,
	devintegrations,
	devpages,
	devscorecards,
};

export { prodConfig,devConfig };
