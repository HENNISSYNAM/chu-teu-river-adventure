// Sổ cái HeriTrust mô phỏng — mỗi màn chơi xong được "neo" thành một bản ghi có
// HeriID, mã băm và số khối, nối chuỗi bằng mã băm của khối trước giống chuỗi khối
// liên minh FISCO BCOS trong đề án. Chỉ lưu trên trình duyệt, không gửi đi đâu.

export interface LedgerRecord {
  heriId: string;
  game: string;
  title: string;
  summary: string;
  block: number;
  time: string;
  hash: string;
  prevHash: string;
}

const KEY = "heritrust-ledger-v1";
const GENESIS = "0".repeat(64);

export function readLedger(): LedgerRecord[] {
  try {
    const raw = window.localStorage.getItem(KEY);
    const list = raw ? (JSON.parse(raw) as LedgerRecord[]) : [];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

function writeLedger(list: LedgerRecord[]) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(list.slice(-50)));
  } catch {
    // trình duyệt chặn lưu trữ: bản ghi vẫn hiện trong lượt chơi này
  }
}

/** FNV-1a 64 lần nối thành 256 bit — chỉ dùng khi không có crypto.subtle (http). */
function fallbackHash(text: string) {
  let out = "";
  for (let round = 0; round < 8; round++) {
    let h = 0x811c9dc5 ^ round;
    for (let i = 0; i < text.length; i++) {
      h ^= text.charCodeAt(i);
      h = Math.imul(h, 0x01000193) >>> 0;
    }
    out += h.toString(16).padStart(8, "0");
  }
  return out;
}

export async function sha256Hex(text: string): Promise<string> {
  try {
    const subtle = globalThis.crypto?.subtle;
    if (!subtle) return fallbackHash(text);
    const buf = await subtle.digest("SHA-256", new TextEncoder().encode(text));
    return Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, "0")).join("");
  } catch {
    return fallbackHash(text);
  }
}

export function shortHash(hash: string) {
  return `${hash.slice(0, 10)}…${hash.slice(-6)}`;
}

/** Neo một kết quả lên sổ cái: trả về bản ghi mới đã nối vào chuỗi. */
export async function anchorRecord(input: {
  game: string;
  code: string;
  title: string;
  summary: string;
  payload: unknown;
}): Promise<LedgerRecord> {
  const list = readLedger();
  const prev = list.at(-1);
  const block = (prev?.block ?? 1024) + 1;
  const time = new Date().toISOString();
  const prevHash = prev?.hash ?? GENESIS;
  const hash = await sha256Hex(
    JSON.stringify({ prevHash, block, time, game: input.game, payload: input.payload }),
  );
  const heriId = `HTR-VN-${input.code}-${String(block).padStart(5, "0")}`;
  const record: LedgerRecord = {
    heriId,
    game: input.game,
    title: input.title,
    summary: input.summary,
    block,
    time,
    hash,
    prevHash,
  };
  writeLedger([...list, record]);
  return record;
}
