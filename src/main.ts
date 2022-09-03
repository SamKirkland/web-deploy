import { getInput, setFailed, group } from "@actions/core";
import { exec } from "@actions/exec";
import { IActionArguments } from "./types";
import commandExistsSync from "command-exists";
import stringArgv from "string-argv";
import { existsSync, promises, writeFile } from "fs";
import { join } from "path";

const errorDeploying = "⚠️ Error deploying";

async function run() {
  try {
    const userArguments = getUserArguments();

    await verifyRsyncInstalled();
    const privateKeyPath = await setupSSHPrivateKey(userArguments.remote_key);
    await syncFiles(userArguments);

    console.log("✅ Deploy Complete");
  }
  catch (error) {
    console.error(errorDeploying);
    setFailed(error as any);
  }
}

run();

function getUserArguments(): IActionArguments {
  return {
    target_server: getInput("target-server", { required: true }),
    destination_path: withDefault(getInput("destination-path", { required: false }), "./"),
    remote_user: getInput("remote-user", { required: true }),
    remote_key: getInput("remote-key", { required: true }),
    source_path: withDefault(getInput("source-path", { required: false }), "./"),
    rsync_options: withDefault(getInput("rsync-options"), "--archive --verbose --compress --human-readable --progress --delete-after --exclude=.git* --exclude=.git/ --exclude=README.md --exclude=readme.md --exclude .gitignore")
  };
}

function withDefault(value: string, defaultValue: string) {
  if (value === "" || value === null || value === undefined) {
    return defaultValue;
  }

  return value;
}

/**
 * Sync changed files
 */
async function syncFiles(args: IActionArguments) {
  try {
    await group("Uploading files", async () => {
      const destination = `${args.remote_user}@${args.target_server}:${args.destination_path}`;

      const rsyncArguments: string[] = stringArgv(args.rsync_options);

      if (args.source_path !== undefined) {
        rsyncArguments.push(args.source_path);
      }

      rsyncArguments.push(destination);

      return await exec(
        "rsync",
        rsyncArguments,
        {
          listeners: {
            stdout: (data: Buffer) => {
              console.log(data);
            },
            stderr: (data: Buffer) => {
              console.error(data);
            },
            stdline: (data: string) => {
              console.log(data);
            },
            errline: (data: string) => {
              console.error(data);
            },
            debug: (data: string) => {
              console.info(data);
            }
          }
        }
      );
    });
  }
  catch (error) {
    setFailed(error as any);
  }
}

async function verifyRsyncInstalled() {
  try {
    await commandExistsSync("rsync");

    // command exists, continue
    return;
  }
  catch (commandExistsError) {
    throw new Error("rsync not installed. For instructions on how to fix see https://github.com/SamKirkland/web-deploy#rsync-not-installed");
  }
};

const {
  HOME,
  GITHUB_WORKSPACE
} = process.env;

export async function setupSSHPrivateKey(key: string) {
  const sshFolderPath = join(HOME || __dirname, '.ssh');
  const privateKeyPath = join(sshFolderPath, "web_deploy_key");

  console.log("HOME", HOME);
  console.log("GITHUB_WORKSPACE", GITHUB_WORKSPACE);

  const knownHostsPath = `${sshFolderPath}/known_hosts`;

  if (!existsSync(knownHostsPath)) {
    console.log(`[SSH] Creating ${knownHostsPath} file in `, GITHUB_WORKSPACE);
    await promises.writeFile(knownHostsPath, "", {
      encoding: 'utf8',
      mode: 0o600
    });
    console.log('✅ [SSH] file created.');
  } else {
    console.log(`[SSH] ${knownHostsPath} file exist`);
  }

  await promises.mkdir(sshFolderPath, { recursive: true });
  await promises.writeFile(privateKeyPath, key, {
    encoding: 'utf8',
    mode: 0o600
  });
  console.log('✅ Ssh key added to `.ssh` dir ', privateKeyPath);

  return privateKeyPath;
};