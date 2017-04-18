const childProcess = require('child_process');
const path = require('path');
const os = require('os');
const logger = require('../core/logger');
const jsdocPath = path.normalize('./node_modules/.bin/jsdoc');
const packageJson = require('../../package.json');
const fsExtra = require('fs-extra');

// File locations
const DOCS_TEMP_DIR = path.normalize(os.tmpdir() + '/community-driven-radio-gh-pages-temp/');
const DOCS_DIR = path.normalize('docs/');
const JSDOCS_DIR = path.normalize('docs/jsdocs/');
const COPY_OPTIONS = {
	preserveTimestamps: true
};

const commands = [
	/**
	 * Step1:
	 * 	- Generate jsdocs in `docs/jsdocs/`
	 */
	`${jsdocPath} server/core/ --destination ${JSDOCS_DIR} -t node_modules/docdash`,
	/**
	 * Step2:
	 *  - Cleanup temp folder (if any) from previous operations
	 */
	function cleanTempDir(next) {
		fsExtra.emptyDir(DOCS_TEMP_DIR, next)
	},
	/**
	 * Step3:
	 *  - Copy `docs/` to a temp folder
	 */
	function copyDocsToTemp(next) {
		fsExtra.copy(DOCS_DIR, DOCS_TEMP_DIR, COPY_OPTIONS, next)
	},
	/**
	 * Step3:
	 *  - Copy project .gitignore to temp folder (so it's transferred to gh-pages branch)
	 */
	function copyGitignoreFile(next) {
		fsExtra.copy('.gitignore', DOCS_TEMP_DIR + '.gitignore', COPY_OPTIONS, next);
	},
	/**
	 * Step4:
	 *  - Remove generated jsdocs from `docs/jsdocs/`
	 */
	function cleanGeneratedDocs(next) {
		fsExtra.emptyDir(JSDOCS_DIR, next);
	},
	/**
	 * Step5:
	 *  - Switch to gh-pages branch
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
	function copyTempToCurrent(next) {
		fsExtra.copy(DOCS_TEMP_DIR, '.', COPY_OPTIONS, next);
	}
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
	function cleanTempDir(next) {
		fsExtra.remove(DOCS_TEMP_DIR, next);
	}
	`rm -rf ${docsTempDir}`,
	/**
	 * Step10:
	 *  - Go back to where you were?
	 */
	function printSuccess(next) {
		console.log("SUCCESS! :)");
		return next();
	}
];


/**
 * Receives an array of commands and
 * executes each of them recursively
 */
(function executeAsyncronously(arrayOfCommands) {
	if(commands.length === 0) {
		logger.info("DONE!");
		return;
	}

	function executeSingleItem(item, next) {
		if(typeof item === "function") {
			return item(next);
		} else if(typeof item === "string") {
			return childProcess.exec(item, (err, stdOut, stdErr) => {
				if(err || stdErr) return next(error || stdErr);

				return next(null, stdOut)
			});
		}
	}
	let currentCommand = commands.shift();
	executeSingleItem(currentCommand, (err, response) => {
		if(err) {
			logger.error(`Command: "${currentCommand}" failed with error:\n${err}`);
		} else {
			logger.info(`Current command: "${currentCommand}" executed without errors.\nOutput:\n${response}`);
		}
		// keep going
		return executeAsyncronously(arrayOfCommands);
	});
})(commands);