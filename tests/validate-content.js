const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.resolve(__dirname, "..");
const sourcePath = path.join(root, "data", "content.js");
const source = fs.readFileSync(sourcePath, "utf8");
const sandbox = { window: {} };

vm.runInNewContext(source, sandbox, { filename: sourcePath });

const db = sandbox.window.DATABANK;
const errors = [];
const validTypes = new Set(["video", "image", "article", "tool"]);

function check(condition, message) {
  if (!condition) errors.push(message);
}

function localFileExists(value) {
  if (!value || /^(https?:|data:|blob:)/.test(value)) return true;
  return fs.existsSync(path.join(root, value.replace(/\//g, path.sep)));
}

check(db && typeof db === "object", "window.DATABANK must be an object.");
check(db && Array.isArray(db.elements), "elements must be an array.");
check(db && Array.isArray(db.subjects), "subjects must be an array.");
check(db && Array.isArray(db.items), "items must be an array.");

if (db && Array.isArray(db.elements) && Array.isArray(db.subjects) && Array.isArray(db.items)) {
  const elementIds = new Set(db.elements.map((element) => element.id));
  const subjectIds = new Set();
  const itemIds = new Set();

  db.subjects.forEach((subject, index) => {
    const label = subject.id || `subject ${index + 1}`;
    check(/^[a-z0-9][a-z0-9-]*$/.test(subject.id || ""), `${label}: invalid subject id.`);
    check(Boolean(String(subject.zh || "").trim()), `${label}: missing Chinese name.`);
    check(Boolean(String(subject.en || "").trim()), `${label}: missing English name.`);
    check(!subjectIds.has(subject.id), `${label}: duplicate subject id.`);
    subjectIds.add(subject.id);
  });

  db.items.forEach((item, index) => {
    const label = item.id || `item ${index + 1}`;
    check(/^[a-z0-9][a-z0-9-]*$/.test(item.id || ""), `${label}: invalid item id.`);
    check(!itemIds.has(item.id), `${label}: duplicate item id.`);
    itemIds.add(item.id);
    check(Boolean(String(item.title || "").trim()), `${label}: missing title.`);
    check(elementIds.has(item.element), `${label}: unknown element "${item.element}".`);
    check(validTypes.has(item.type), `${label}: unsupported type "${item.type}".`);
    check(Boolean(item.cover), `${label}: missing cover.`);
    check(localFileExists(item.cover), `${label}: cover file does not exist: ${item.cover}.`);
    check(!item.subject || subjectIds.has(item.subject), `${label}: unknown subject "${item.subject}".`);

    if (item.type === "video") {
      check(Boolean(item.video && item.video.provider), `${label}: video configuration is missing.`);
      if (item.video && item.video.provider === "local") {
        check(localFileExists(item.video.src), `${label}: local video does not exist: ${item.video.src}.`);
      }
    }
    if (item.type === "image") {
      check(Array.isArray(item.images) && item.images.length > 0, `${label}: image collection is empty.`);
    }
    (item.images || []).forEach((image) => {
      check(localFileExists(image.src), `${label}: image does not exist: ${image.src}.`);
    });
    if (item.type === "article") {
      check(Boolean(String(item.body || "").trim()), `${label}: article body is empty.`);
    }
    if (item.type === "tool") {
      check(Boolean(item.tool), `${label}: tool path is missing.`);
      check(localFileExists(item.tool), `${label}: tool file does not exist: ${item.tool}.`);
    }
  });
}

if (errors.length) {
  console.error(`Content validation failed with ${errors.length} problem(s):`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exitCode = 1;
} else {
  console.log(`Content validation passed: ${db.subjects.length} subjects, ${db.items.length} items.`);
}
