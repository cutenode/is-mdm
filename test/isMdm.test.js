const { test, afterEach, mock } = require("node:test");
const assert = require("node:assert");
const childProcess = require("node:child_process");

const MODULE_PATH = require.resolve("../isMdm.cjs");
const originalPlatformDescriptor = Object.getOwnPropertyDescriptor(
	process,
	"platform",
);

// isMdm.cjs destructures `spawnSync` at load time and dispatches on
// `process.platform`, so each test overrides the platform, mocks
// `child_process.spawnSync`, and re-requires the module fresh.

function setPlatform(value) {
	Object.defineProperty(process, "platform", {
		value,
		configurable: true,
	});
}

function mockSpawn(stdout) {
	return mock.method(childProcess, "spawnSync", () => ({
		stdout: Buffer.from(stdout),
	}));
}

function loadIsMdm() {
	delete require.cache[MODULE_PATH];
	return require("../isMdm.cjs");
}

afterEach(() => {
	mock.restoreAll();
	Object.defineProperty(process, "platform", originalPlatformDescriptor);
	delete require.cache[MODULE_PATH];
});

test("macOS: returns true when the device is enrolled in MDM", () => {
	setPlatform("darwin");
	const spawn = mockSpawn(
		"Enrolled via DEP: Yes\nMDM enrollment: Yes (User Approved)",
	);

	const isMdm = loadIsMdm();

	assert.strictEqual(isMdm(), true);
	assert.strictEqual(spawn.mock.callCount(), 1);
	assert.deepStrictEqual(spawn.mock.calls[0].arguments, [
		"/usr/bin/profiles",
		["status", "-type", "enrollment"],
	]);
});

test("macOS: returns false when both DEP and MDM enrollment report No", () => {
	setPlatform("darwin");
	mockSpawn("Enrolled via DEP: No\nMDM enrollment: No");

	const isMdm = loadIsMdm();

	assert.strictEqual(isMdm(), false);
});

test("macOS: returns true when only one of the two No markers is present", () => {
	setPlatform("darwin");
	// DEP reports No but MDM enrollment reports Yes, so the `&&` is false
	// and the device is still considered managed.
	mockSpawn("Enrolled via DEP: No\nMDM enrollment: Yes (User Approved)");

	const isMdm = loadIsMdm();

	assert.strictEqual(isMdm(), true);
});

test("Windows: returns true when the status output contains MdmUrl", () => {
	setPlatform("win32");
	const spawn = mockSpawn(
		"AzureAdJoined : YES\n            MdmUrl : https://enrollment.manage.microsoft.com/enrollmentserver/discovery.svc\n",
	);

	const isMdm = loadIsMdm();

	assert.strictEqual(isMdm(), true);
	assert.strictEqual(spawn.mock.callCount(), 1);
	assert.deepStrictEqual(spawn.mock.calls[0].arguments, [
		"dsregcmd",
		["/status"],
	]);
});

test("Windows: returns false when the status output has no MdmUrl", () => {
	setPlatform("win32");
	mockSpawn("AzureAdJoined : NO\nWorkplaceJoined : NO\n");

	const isMdm = loadIsMdm();

	assert.strictEqual(isMdm(), false);
});

test("returns undefined on an unsupported platform without spawning", () => {
	setPlatform("linux");
	const spawn = mockSpawn("this should never be read");

	const isMdm = loadIsMdm();

	assert.strictEqual(isMdm(), undefined);
	assert.strictEqual(spawn.mock.callCount(), 0);
});

test("the .mjs entry re-exports isMdm as both default and named export", async () => {
	// Unsupported platform keeps this from shelling out to a real binary.
	setPlatform("linux");

	const mod = await import("../isMdm.mjs");

	assert.strictEqual(typeof mod.default, "function");
	assert.strictEqual(typeof mod.isMdm, "function");
	assert.strictEqual(mod.default, mod.isMdm);
	assert.strictEqual(mod.default(), undefined);
});
