import * as core from '@actions/core';
import * as exec from '@actions/exec';
import { IActionArguments } from './types';
const { sync: commandExistsSync } = require('command-exists');

const errorDeploying = "⚠️ Error deploying";

async function run() {
  try {
    const userArguments = getUserArguments();

    await installCommand("rsync");
    await syncFiles(userArguments);

    console.log("✅ Deploy Complete");
  }
  catch (error) {
    console.error(errorDeploying);
    core.setFailed(error.message);
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
        ]
      );
    });
  }
  catch (error) {
    core.setFailed(error.message);
  }
}

async function installCommand(command: string) {
  const commandExists = commandExistsSync(command);
  if (commandExists) {
    return;
  }

  try {
    await core.group(`Installing ${command}`, async () => {
      return await exec.exec(
        `sudo apt-get --no-install-recommends install ${command}`,
        undefined,
        {
          listeners: {
            stderr: (data: Buffer) => {
              throw data.toString();
            },
            errline: (data: string) => {
              throw data;
            }
          }
        }
      );
    });
  }
  catch (error) {
    console.error(`⚠️ Failed to install ${command}`);
    core.setFailed(error.message);
  }
};