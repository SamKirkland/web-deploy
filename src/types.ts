export interface IActionArguments {
    target_server: string;
    port: string | undefined;
    source_path: string | undefined;
    destination_path: string;
    remote_user: string;
    remote_key: string;

    /** @default "--verbose --recursive --compress --human-readable" */
    rsync_options: string;
}
