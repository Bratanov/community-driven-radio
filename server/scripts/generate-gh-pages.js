const childProcess = require('child_process');
const path = require('path');
const os = require('os');
const logger = require('../core/logger');
const jsdocPath = path.normalize('./node_modules/.bin/jsdoc');
const docsTempDir = path.normalize(os.tmpdir() + '/community-driven-radio-gh-pages-temp/');
const packageJson = require('../../package.json');

const commands = [
	/**
	 * Step1:
	 * 	- Generate jsdocs in `docs/jsdocs/`
	 */
	`${jsdocPath} server/core/ --destination docs/jsdocs/ -t node_modules/docdash`,
	/**
	 * Step2:
	 *  - Cleanup temp folder (if any) from previous operations
	 */
	`rm -rf ${docsTempDir}`,
	/**
	 * Step3:
	 *  - Copy `docs/` to a temp folder
	 */
	`cp -rf docs/ ${docsTempDir}`,
	/**
	 * Step4:
	 *  - Remove generated jsdocs from `docs/jsdocs/`
	 */
	`rm -rf docs/jsdocs/`,
	/**
	 * Step5:
	 *  - git checkout gh-pages
	 */
	`git checkout gh-pages`,
	/**
	 * Step6:
	 *  - cleanup all files (sirech - old documentation)
	 */
	`git rm -rf .`, // delete everything in the gh-pages branch
	/**
	 * Step7:
	 *  - Copy contents of `docs/` folder in the temp dir into root directory
	 */
	`cp ${jsdocPath} ./`,
	/**
	 * Step8:
	 *  - Commit, push to `gh-pages` branch
	 */
	`git add --all`,
	`git commit -m "Updated docs for Version ${packageJson.version}"`,
	`git push origin gh-pages`,
	/**
	 * Step9:
	 *  - Cleanup temp dir
	 */
	`rm -rf ${docsTempDir}`,
	/**
	 * Step10:
	 *  - Go back to where you were?
	 */
];

(function executeAsyncronously(arrayOfCommands) {
	if(commands.length === 0) {
		logger.info("DONE!");
		return;
	}
	let currentCommand = commands.shift();
	childProcess.exec(currentCommand, (error, stdOut, stdErr) => {
		if(stdErr) {
			logger.info(`Command: "${currentCommand}" failed with error:\n${stdOut}`);
		}

		// print output
		logger.info(`Current command: "${currentCommand}" executed without errors.\nOutput:\n${stdOut}`);

		// keep going
		return executeAsyncronously(arrayOfCommands);
	});
})(commands);