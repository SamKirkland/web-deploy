import { getInput, setFailed, group } from '@actions/core';
import { exec } from '@actions/exec';
import { IActionArguments } from './types';
import commandExistsSync from "command-exists";

const errorDeploying = "⚠️ Error deploying";

async function run() {
  try {
    const userArguments = getUserArguments();

    await verifyRsyncInstalled();
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
    rsync_options: withDefault(getInput("rsync-options"), "--archive --verbose --compress --human-readable --delete --exclude=.git* --exclude=.git/ --exclude=README.md --exclude=readme.md --exclude .gitignore")
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

      return await exec(
        "rsync",
        [
          ...args.rsync_options.split(" "),
          args.source_path,
          destination
        ],
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