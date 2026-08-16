type LogMeta = Record<string, unknown>;

const REDACT_KEYS = [
    "password",
    "token",
    "accesstoken",
    "refreshtoken",
    "authorization",
    "cookie",
    "secret",
    "apikey",
    "activationcode",
    "email",
    "avatar",
];

function redact(meta: LogMeta): LogMeta {
    const out: LogMeta = {};
    for (const [key, value] of Object.entries(meta)) {
        const lower = key.toLowerCase();
        if (REDACT_KEYS.some((k) => lower.includes(k))) {
            out[key] = "[redacted]";
        } else if (value && typeof value === "object" && !Array.isArray(value)) {
            out[key] = redact(value as LogMeta);
        } else {
            out[key] = value;
        }
    }
    return out;
}

function write(level: "info" | "warn" | "error", event: string, meta: LogMeta = {}) {
    const entry = {
        level,
        event,
        time: new Date().toISOString(),
        ...redact(meta),
    };
    const line = JSON.stringify(entry);
    if (level === "error") console.error(line);
    else if (level === "warn") console.warn(line);
    else console.log(line);
}

export const logger = {
    info: (event: string, meta?: LogMeta) => write("info", event, meta),
    warn: (event: string, meta?: LogMeta) => write("warn", event, meta),
    error: (event: string, meta?: LogMeta) => write("error", event, meta),
};