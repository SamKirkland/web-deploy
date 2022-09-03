import { writeFile, mkdir } from "fs/promises";
import { join } from "path";

const {
    HOME,
    GITHUB_WORKSPACE
} = process.env;

export async function setupSSHPrivateKey(key: string, name: string) {
    const sshFolderPath = join(HOME || __dirname, '.ssh');
    const sshFilePath = join(sshFolderPath, name);

    console.log("HOME", HOME);
    console.log("GITHUB_WORKSPACE", GITHUB_WORKSPACE);

    await mkdir(sshFolderPath, { recursive: true });
    await writeFile(sshFilePath, key, {
        encoding: 'utf8',
        mode: 0o600
    });
    console.log('✅ Ssh key added to `.ssh` dir ', sshFilePath);

    return sshFilePath;
};