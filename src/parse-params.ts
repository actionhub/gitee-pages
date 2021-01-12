import * as core from "@actions/core";

function _get<T>(key: string, defaultValue: T | null = null): string {
    const v: string = core.getInput(key, { required:defaultValue == undefined});
    if (!v && defaultValue === null) {
        throw new Error(`${key} require!`);
    }
    return v;
}

export function get(key: string, defaultValue: string | null = null): string {
    const v: string = _get(key, defaultValue);
    return v ? v : (defaultValue as string)
}
export function getArray(key: string, separator: string, defaultValue: string[] | null = null): string[] {
    let v: string = _get(key, defaultValue);
    if (!v) {
        return defaultValue as string[];
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
    const v: string = _get(key, defaultValue);
    return v ? parseFloat(v) : (defaultValue as number)
}

export function getBoolean(key: string, defaultValue: boolean | null = null): boolean {
    const v: string = _get(key, defaultValue);
    return v ? v.toUpperCase() == "TRUE" : (defaultValue as boolean)
}
