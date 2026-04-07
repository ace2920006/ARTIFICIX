import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { execSync } from "node:child_process";

const root = resolve(".");

function run(command, cwd = root) {
  execSync(command, { cwd, stdio: "inherit" });
}

function ensureEnv(examplePath, targetPath) {
  if (existsSync(targetPath)) {
    return false;
  }

  const content = readFileSync(examplePath, "utf8");
  mkdirSync(dirname(targetPath), { recursive: true });
  writeFileSync(targetPath, content, "utf8");
  return true;
}

console.log("Installing root dependencies...");
run("npm install");

console.log("Installing server dependencies...");
run("npm install", resolve(root, "server"));

console.log("Installing client dependencies...");
run("npm install", resolve(root, "client"));

const createdServerEnv = ensureEnv(
  resolve(root, "server/.env.example"),
  resolve(root, "server/.env")
);
const createdClientEnv = ensureEnv(
  resolve(root, "client/.env.example"),
  resolve(root, "client/.env")
);

console.log(
  `Setup complete. server/.env ${createdServerEnv ? "created" : "already exists"}, client/.env ${
    createdClientEnv ? "created" : "already exists"
  }.`
);
