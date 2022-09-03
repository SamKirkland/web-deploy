import * as actionsExec from "@actions/exec";
import { mapOutput, syncFiles } from "./main";

// const exec = jest.createMockFromModule('@actions/exec');

describe("syncFiles", () => {
  test("syncFiles ssh port", async () => {
    const spy = jest.spyOn(actionsExec, "exec");

    await syncFiles("/home/.ssh/web_deploy", {
      target_server: "targetserver",
      source_path: "./sourcePath",
      destination_path: "/destFolder/subFolder/",
      remote_user: "username",
      private_ssh_key: "keyname",
      ssh_port: "54321",
      rsync_options: "--test",
    });

    expect(spy).toHaveBeenCalledWith(
      "rsync",
      [
        "-e",
        "ssh -p 54321 -i /home/.ssh/web_deploy -o StrictHostKeyChecking=no",
        "--test",
        "./sourcePath",
        "username@targetserver:/destFolder/subFolder/"
      ],
      mapOutput
    );
  });
});