export interface IActionArguments {
    target_server: string;
    source_path: string | undefined;
    destination_path: string;
    remote_user: string;
    remote_key: string;

    ssh_port: string;
    rsync_options: string;
}
