// File: /src/services/pusherService.ts

import { encodeHex } from "https://deno.land/std@0.224.0/encoding/hex.ts";
import { crypto } from "https://deno.land/std@0.224.0/crypto/mod.ts";

// Load env vars
const PUSHER_APP_ID = Deno.env.get("PUSHER_APP_ID")!;
const PUSHER_KEY = Deno.env.get("PUSHER_KEY")!;
const PUSHER_SECRET = Deno.env.get("PUSHER_SECRET")!;
const PUSHER_CLUSTER = Deno.env.get("PUSHER_CLUSTER")!;

/**
 * Trigger a Pusher event
 */
export async function triggerPusherEvent(channel: string, event: string, data: object) {
  const timestamp = Math.floor(Date.now() / 1000).toString();

  const body = JSON.stringify({
    name: event,
    channel: channel,
    data: JSON.stringify(data), // must be string
  });

  const bodyMD5 = await hashMD5(body);
  const queryString = `auth_key=${PUSHER_KEY}&auth_timestamp=${timestamp}&auth_version=1.0&body_md5=${bodyMD5}`;
  const stringToSign = `POST\n/apps/${PUSHER_APP_ID}/events\n${queryString}`;
  const authSignature = await signHMAC(PUSHER_SECRET, stringToSign);

  const url = `https://api-${PUSHER_CLUSTER}.pusher.com/apps/${PUSHER_APP_ID}/events?${queryString}&auth_signature=${authSignature}`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body,
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("❌ Pusher trigger failed:", errorText);
    throw new Error("Failed to trigger Pusher event");
  }
}

// HMAC SHA256 signature
async function signHMAC(secret: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message));
  return encodeHex(new Uint8Array(signature));
}

// MD5 hash for body
async function hashMD5(message: string): Promise<string> {
  const msgUint8 = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest("MD5", msgUint8);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
