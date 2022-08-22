import * as core from '@actions/core';
import * as exec from '@actions/exec';
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
    core.setFailed(error as any);
  }
}

run();

function getUserArguments(): IActionArguments {
  return {
    target_server: core.getInput("target-server", { required: true }),
    destination_path: withDefault(core.getInput("destination-path", { required: false }), "./"),
    remote_user: core.getInput("remote-user", { required: true }),
    remote_key: core.getInput("remote-key", { required: true }),
    source_path: withDefault(core.getInput("source-path", { required: false }), "./"),
    rsync_options: withDefault(core.getInput("rsync-options"), "--archive --verbose --compress --human-readable --delete --exclude=.git* --exclude=.git/ --exclude=README.md --exclude=readme.md --exclude .gitignore")
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
    await core.group("Uploading files", async () => {
      const destination = `${args.remote_user}@${args.target_server}:${args.destination_path}`;

      return await exec.exec(
        "rsync",
        [
          args.rsync_options,
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
    core.setFailed(error as any);
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