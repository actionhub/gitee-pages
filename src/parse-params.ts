import * as core from "@actions/core";

function _get<T>(key: string, defaultValue: T | null = null): string {
    const v: string | null = core.getInput(key, { required:defaultValue == undefined});
    if (v == null && defaultValue === null) {
        throw new Error(`${key} require!`);
    }
    return v;
}

export function get(key: string, defaultValue: string | null = null): string {
    const v: string | null = _get(key, defaultValue);
    return v != null ? v : (defaultValue as string)
}
export function getArray(key: string, separator: string, defaultValue: string[] | null = null): string[] {
    let v: string | null = _get(key, defaultValue);
    if (v == null) {
        return defaultValue as string[];
    }
    if (v == "") {
        return [];
    }
    if (v.startsWith(separator)) {
        v = v.substr(separator.length);
    }
    if (v.endsWith(separator)) {
        v = v.substr(0,v.length - separator.length);
    }
    return v.split(separator);
}

export function getNumber(key: string, defaultValue: number | null = null): number {
    const v: string | null = _get(key, defaultValue);
    return v != null ? parseFloat(v) : (defaultValue as number)
}

export function getBoolean(key: string, defaultValue: boolean | null = null): boolean {
    const v: string | null = _get(key, defaultValue);
    return v != null ? v.toUpperCase() == "TRUE" : (defaultValue as boolean)
}
