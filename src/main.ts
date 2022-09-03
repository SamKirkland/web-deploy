import { getInput, setFailed, group } from "@actions/core";
import { exec } from "@actions/exec";
import { IActionArguments } from "./types";
import commandExistsSync from "command-exists";
import stringArgv from "string-argv";
import { existsSync, promises, writeFile } from "fs";
import { join } from "path";

// note: when updating also update README.md, action.yml
const default_rsync_options = "--archive --verbose --compress --human-readable --progress --delete-after --exclude=.git* --exclude=.git/ --exclude=README.md --exclude=readme.md --exclude=.gitignore";
const errorDeploying = "⚠️ Error deploying";

async function run() {
  try {
    const userArguments = getUserArguments();

    await verifyRsyncInstalled();
    const privateKeyPath = await setupSSHPrivateKey(userArguments.remote_key);
    await syncFiles(privateKeyPath, userArguments);

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
    ssh_port: withDefault(getInput("ssh-port"), "22"),
    rsync_options: withDefault(getInput("rsync-options"), default_rsync_options)
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
async function syncFiles(privateKeyPath: string, args: IActionArguments) {
  try {
    const destination = `${args.remote_user}@${args.target_server}:${args.destination_path}`;

    const rsyncArguments: string[] = [];

    rsyncArguments.push(`-e 'ssh -p ${args.ssh_port} -i ${privateKeyPath} -o StrictHostKeyChecking=no'`);

    if (args.source_path !== undefined) {
      rsyncArguments.push(args.source_path);
    }

    rsyncArguments.push(destination);

    rsyncArguments.push(...stringArgv(args.rsync_options));

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
        }
      }
    );
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

  await promises.mkdir(sshFolderPath, { recursive: true });

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

  await promises.writeFile(privateKeyPath, key, {
    encoding: 'utf8',
    mode: 0o600
  });
  console.log('✅ Ssh key added to `.ssh` dir ', privateKeyPath);

  return privateKeyPath;
};