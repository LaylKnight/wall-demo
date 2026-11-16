const fs = require("fs");
const path = require("path");

// Normalize the workspace path on Windows virtual/junction drives (like C:\AADrive)
// so Next.js dev server and Watchpack resolve all project files under the same root.
const projectRoot = path.resolve(__dirname);
const selfFlag = `--require "${__filename.replace(/\\/g, "/")}"`;
if (!process.env.NODE_OPTIONS || !process.env.NODE_OPTIONS.includes("fix-realpath.cjs")) {
  process.env.NODE_OPTIONS = `${process.env.NODE_OPTIONS || ""} ${selfFlag}`.trim();
}
const realRoot = (() => {
  try {
    return fs.realpathSync(projectRoot);
  } catch {
    return projectRoot;
  }
})();

function normalizePath(p) {
  if (typeof p !== "string") return p;
  if (realRoot && realRoot.toLowerCase() !== projectRoot.toLowerCase()) {
    if (p.toLowerCase().startsWith(realRoot.toLowerCase())) {
      return projectRoot + p.slice(realRoot.length);
    }
  }
  if (p.toLowerCase().startsWith(projectRoot.toLowerCase())) {
    return projectRoot + p.slice(projectRoot.length);
  }
  return p;
}

try {
  process.chdir(projectRoot);
} catch {
  // ignore
}

const origCwd = process.cwd.bind(process);
process.cwd = () => normalizePath(origCwd());

const origRealpathSync = fs.realpathSync;
function patchedRealpathSync(p, options) {
  try {
    return normalizePath(origRealpathSync(p, options));
  } catch {
    return normalizePath(path.resolve(String(p)));
  }
}
patchedRealpathSync.native = function (p, options) {
  try {
    return normalizePath(origRealpathSync.native(p, options));
  } catch {
    return normalizePath(path.resolve(String(p)));
  }
};
fs.realpathSync = patchedRealpathSync;

const origRealpath = fs.realpath;
function patchedRealpath(p, options, callback) {
  if (typeof options === "function") {
    callback = options;
    options = undefined;
  }
  origRealpath(p, options, (err, resolved) => {
    if (err) {
      callback(null, normalizePath(path.resolve(String(p))));
    } else {
      callback(null, normalizePath(resolved));
    }
  });
}
patchedRealpath.native = function (p, options, callback) {
  if (typeof options === "function") {
    callback = options;
    options = undefined;
  }
  origRealpath.native(p, options, (err, resolved) => {
    if (err) {
      callback(null, normalizePath(path.resolve(String(p))));
    } else {
      callback(null, normalizePath(resolved));
    }
  });
};
fs.realpath = patchedRealpath;

if (fs.promises && fs.promises.realpath) {
  const origPromisesRealpath = fs.promises.realpath.bind(fs.promises);
  fs.promises.realpath = async function (p, options) {
    try {
      const res = await origPromisesRealpath(p, options);
      return normalizePath(res);
    } catch {
      return normalizePath(path.resolve(String(p)));
    }
  };
}
