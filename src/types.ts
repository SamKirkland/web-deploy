export interface IActionArguments {
    target_server: string;
    source_path: string;
    destination_path: string;
    remote_user: string;
    remote_key: string;

    /** @default "--verbose --recursive --compress --human-readable" */
    rsync_options: string;
}
