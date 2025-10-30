const { spawnSync } = require("node:child_process");

function isMdmMacOS() {
	let enrolled = true; // let's assume we're managed and correct ourselves if we prove we're not

	const command = spawnSync("/usr/bin/profiles", [
		"status",
		"-type",
		"enrollment",
	]).stdout.toString();

	if (
		command.includes("Enrolled via DEP: No") &&
		command.includes("MDM enrollment: No")
	) {
		enrolled = false;
	}

	return enrolled;
}

function isMdmWindows() {
	let enrolled = true; // let's assume we're managed and correct ourselves if we prove we're not

	const command = spawnSync("dsregcmd", ["/status"]).stdout.toString();

	if (!command.includes("MdmUrl")) {
		enrolled = false;
	}

	return enrolled;
}

function isMdm() {
	if (process.platform === "darwin") {
		return isMdmMacOS();
	}

	if (process.platform === "win32") {
		return isMdmWindows();
	}
}

module.exports = isMdm;
