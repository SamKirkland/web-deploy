<p align="center">
  <img alt="web deploy - Continuous integration for everyone" src="images/web-deploy-logo-small.png">
</p>

Automate deploying websites and more with this GitHub action. **It's free!**

![Test web deploy](https://github.com/SamKirkland/web-deploy/workflows/Test%20web%20deploy/badge.svg)

---

### Usage Example
Place the following in `Your_Project/.github/workflows/main.yml`
```yml
on: push
name: Publish Website
jobs:
  web-deploy:
    name: 🚀 Deploy website every commit
    runs-on: ubuntu-latest
    steps:
    - name: 🚚 Get latest code
      uses: actions/checkout@v2.1.0
    
    - name: 📂 Sync files
      uses: SamKirkland/web-deploy@v1.0.0
      with:
        target-server: samkirkland.com
        username: myFtpUserName
        ssh-private-key: ${{ secrets.SSH_PRIVATE_KEY }}
        args: 
        local-dir:
        server-dir:
        exclude: 
```

---

### Requirements
- You must have shell access to your server, please read you webite hosts documentation
- **You CANNOT use a FTP account - they are not the same!**
  - If you don't have SSH access but have ftp access use [FTP-Deploy-Action](https://github.com/SamKirkland/FTP-Deploy-Action) instead
- You will need to create a **SSH** user to deploy. Normally this is your cpanel or hosting providers username and password
- Most web hosts change the default port (22), check with your host for your port number

---

### Setup Steps
1. Select the repository you want to add the action to
2. Select the `Actions` tab
3. Select `Blank workflow file` or `Set up a workflow yourself`, if you don't see these options manually create a yaml file `Your_Project/.github/workflows/main.yml`
4. Paste the example above into your yaml file and save
5. Now you need to add a key to the `secrets` section in your project. To add a `secret` go to the `Settings` tab in your project then select `Secrets`. Add a new `Secret` for `ftp-password`
6. Update your yaml file settings

---

### Settings
Keys can be added directly to your .yml config file or referenced from your project `Secrets` storage.

To add a `secret` go to the `Settings` tab in your project then select `Secrets`.
I strongly recommend you store your `remote-key` as a secret.

| Key Name           | Required? | Example                           | Default                                                                                                                                                                  | Description                                                                                                               |
|--------------------|-----------|-----------------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------------------------------|
| `target-server`    | Yes       | `ftp.samkirkland.com`             |                                                                                                                                                                          | Deployment destination server. Formatted as `domain.com:port`. Port is optional, when not specified it will default to 22 |
| `remote-user`      | Yes       | `username@samkirkland.com`        |                                                                                                                                                                          | SSH user name                                                                                                             |
| `remote-key`       | Yes       | `CrazyUniquePassword&%123`        |                                                                                                                                                                          | SSH private key                                                                                                           |
| `source-path`      | No        | `./myFolderToPublish/`            | `./`                                                                                                                                                                     | Path to upload to on the server, must end with trailing slash `/`                                                         |
| `destination-path` | No        | `ftp.samkirkland.com`             | `./`                                                                                                                                                                     | Folder to upload from, must end with trailing slash `/`                                                                   |
| `rsync-options`    | No        | See `rsync-options` section below | `--archive --verbose --compress --human-readable --progress --delete-after --exclude=.git* --exclude=.git/ --exclude=README.md --exclude=readme.md --exclude=.gitignore` | Custom rsync arguments, this field is passed through directly into the rsync script                                       |

#### Advanced options using `rsync-options`
Custom arguments, this field is passed through directly into the rsync script. See [rsync's manual](https://linux.die.net/man/1/rsync) for all options.
You can use as many arguments as you want, seperate them with a space

Below is an incomplete list of commonly used args:

| Option                 | Description                                                                                                                                |
|------------------------|--------------------------------------------------------------------------------------------------------------------------------------------|
| `--archive`            | A quick way of saying you want recursion and want to preserve almost everything                                                            |
| `--dry-run`            | Does not upload or delete anything, but tells you what it would upload/delete if this was a real deploy                                    |
| `--stats`              | Print verbose statistics on the file transfer, allowing you to tell how effective rsync’s delta-transfer algorithm is for your data        |
| `--links`              | When symlinks are encountered, recreate the symlink on the destination                                                                     |
| `--compress`           | Compresses the file data as it is sent to the destination machine, which reduces the amount of data being transmitted                      |
| `--human-readable`     | Output bytes in a more human-readable format (K, M, G)                                                                                     |
| `--itemize-changes`    | itemized list of the changes that are being made to each file, including attribute changes                                                 |
| `--delete-after`       | When you delete a file on github it will also be deleted on the server. Files are deleted at the end of a deployment to minimize downtime. |
| `--max-size '200K'`    | Ignore syncing files over this limit. Value is a number followed by "K", "M", or "G"                                                       |
| `--exclude 'file.txt'` | Excludes file(s) from the deployment. Supports glob pattterns (ex: `*.jpg`). You can have multiple excludes!                               |
| `--include 'file.txt'` | Includes file(s) even if it was excluded. Supports glob pattterns (ex: `*.jpg`). You can have multiple includes!                           |

See [rsync's manual](https://linux.die.net/man/1/rsync) for all options

# Common Examples
#### Build and Publish React/Angular/Vue Website
Make sure you have an npm script named 'build'. This config should work for most node built websites.

```yml
on: push
name: Publish Website
jobs:
  web-deploy:
    name: 🚀 Deploy website every commit
    runs-on: ubuntu-latest
    steps:
    - name: 🚚 Get latest code
      uses: actions/checkout@v2.1.0

    - name: Use Node.js 12.x
      uses: actions/setup-node@v1
      with:
        node-version: '12.x'
      
    - name: 🔨 Build Project
      run: |
        npm install
        npm run build
    
    - name: 📂 Sync files
      uses: SamKirkland/web-deploy@v1.0.0
      with:
        target-server: samkirkland.com
        remote-user: myFtpUserName
        remote-key: ${{ secrets.SSH_KEY }}
```

#### Log only dry run: Use this mode for testing
Ouputs a list of files that will be created/modified to sync your source without making any actual changes
```yml
on: push
name: Publish Website Dry Run
jobs:
  web-deploy:
    name: 🚀 Deploy website every commit
    runs-on: ubuntu-latest
    steps:
    - name: 🚚 Get latest code
      uses: actions/checkout@v2.1.0

    - name: 📂 Sync files
      uses: SamKirkland/web-deploy@v1.0.0
      with:
        ftp-server: samkirkland.com
        ftp-username: myFTPUsername
        ftp-password: ${{ secrets.FTP_PASSWORD }}
        git-ftp-args: --dry-run
```

_Want another example? Let me know by creating a [github issue](https://github.com/SamKirkland/web-deploy/issues/new)_

---

## FAQ
<details>
  <summary>How to exclude .git files from the publish</summary>

Git files are excluded by default

If have customized `rsync-options` you will need to re-add the default exclude options using `--exclude=.git* --exclude=.git/ --exclude=README.md --exclude=readme.md --exclude=.gitignore`
</details>

<details>
  <summary>How to exclude a specific file or folder</summary>

You can use `rsync-options` and pass in as many `--exclude` options as you want. By default this action excludes github files. If you choose to customize `rsync-options` make sure you copy over the defaults.


Example excluding all `.jpg` files:

`rsync-options: --exclude "*.jpg"`


Example excluding a specific folder:

`rsync-options: --exclude "wp-content/themes/"`
</details>

---

## Common Errors
<details id="rsync-not-installed">
  <summary>rsync not found. Please see https://github.com/SamKirkland/web-deploy#rsync-not-installed</summary>

  
  This library uses `rsync` to sync files. The script was not able to detect `rsync` on the machine running the action.
  If you are using `runs-on: ubuntu-latest` you will always have `rsync`.

  If you are using `windows-latest`, `windows-XXXX`, `macos-latest`, `macos-12` or a [self-hosted](https://docs.github.com/en/actions/hosting-your-own-runners/about-self-hosted-runners) runner you will need to install rsync before the `web-deploy` step.

  This is pretty easy to do!

  On `windows` runners run your windows specific steps, then use a `ubuntu-latest` step to deploy.

  On self-hosted runners install rsync **before** the `web-deploy` step.
  ```yaml
    runs-on: [self-hosted, linux, my-self-hosted-runner-label]
    steps:
      - name: Install rsync
        run: |
          sudo apt-get update
          sudo apt-get install rsync
  ```

  On `macos` runners install rsync **before** the `web-deploy` step.
  ```yaml
    runs-on: macos-latest
    steps:
      - name: Install rsync
        run: |
          brew update
          brew install rsync
  ```

  [Read more about customizing runners](https://docs.github.com/en/actions/using-github-hosted-runners/customizing-github-hosted-runners)



  https://docs.github.com/en/actions/using-github-hosted-runners/customizing-github-hosted-runners
</details>

---
