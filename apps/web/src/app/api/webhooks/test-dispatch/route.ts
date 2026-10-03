import { NextRequest, NextResponse } from "next/server";
import { lookup } from "dns/promises";
import net from "net";

const ALLOWED_METHODS = ["POST", "PUT", "PATCH"];

function isPrivateIp(ip: string) {
    if (net.isIPv6(ip)) return ip === "::1" || ip.startsWith("fc") || ip.startsWith("fd") || ip.startsWith("fe80");
    const [a, b] = ip.split(".").map(Number);
    return (
        a === 10 || a === 127 || a === 0 ||
        (a === 172 && b >= 16 && b <= 31) ||
        (a === 192 && b === 168) ||
        (a === 169 && b === 254) // cloud metadata
    );
}

export async function POST(req: NextRequest) {
    // TODO: require an authenticated session here
    const { url, method = "POST", headers = {}, body } = await req.json();

    let target: URL;
    try { target = new URL(url); } catch {
        return NextResponse.json({ ok: false, error: "Invalid URL" }, { status: 400 });
    }
    if (!["http:", "https:"].includes(target.protocol) || !ALLOWED_METHODS.includes(method)) {
        return NextResponse.json({ ok: false, error: "Unsupported protocol or method" }, { status: 400 });
    }

    const allowLocal = process.env.NODE_ENV !== "production";
    if (!allowLocal) {
        const { address } = await lookup(target.hostname);
        if (isPrivateIp(address)) {
            return NextResponse.json({ ok: false, error: "Private addresses are blocked" }, { status: 400 });
        }
    }

    const started = Date.now();
    try {
        const res = await fetch(target, {
            method,
            headers: { "Content-Type": "application/json", ...headers },
            body: typeof body === "string" ? body : JSON.stringify(body ?? { test: true }),
            signal: AbortSignal.timeout(10_000),
            redirect: "manual",
        });
        const text = (await res.text()).slice(0, 5000);
        return NextResponse.json({
            ok: res.ok, status: res.status, statusText: res.statusText,
            durationMs: Date.now() - started, body: text,
        });
    } catch (e: unknown) {
        const message = e instanceof Error ? e.message : "Failed to dispatch request";
        return NextResponse.json({ ok: false, error: message, durationMs: Date.now() - started });
    }
}