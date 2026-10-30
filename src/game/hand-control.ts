// Điều khiển bằng bàn tay qua webcam — MediaPipe HandLandmarker chạy hoàn toàn trên thiết bị.
// Video camera không được tải, lưu hay gửi lên máy chủ.
import {
  HandLandmarker,
  type HandLandmarkerResult,
  type NormalizedLandmark,
} from "@mediapipe/tasks-vision";
import wasmAsset from "@/assets/mediapipe-wasm.asset.json";

interface WasmFileset {
  wasmLoaderPath: string;
  wasmBinaryPath: string;
}

export interface HandTuning {
  /** 0.6–2.0 — nhân với biên độ di chuyển */
  sensitivity: number;
  /** 0.04–0.3 — vùng chết để tay đứng yên không làm rối rung */
  deadZone: number;
}

export interface HandFrame {
  moveAxis: number;
  rodAxis: number;
  castPressed: boolean;
  reelHeld: boolean;
  leftPresent: boolean;
  rightPresent: boolean;
}

export type HandStatus = "loading" | "running" | "error";

const CONNECTIONS: [number, number][] = [
  [0, 1], [1, 2], [2, 3], [3, 4],
  [0, 5], [5, 6], [6, 7], [7, 8],
  [5, 9], [9, 10], [10, 11], [11, 12],
  [9, 13], [13, 14], [14, 15], [15, 16],
  [13, 17], [17, 18], [18, 19], [19, 20],
  [0, 17],
];

function dist(a: NormalizedLandmark, b: NormalizedLandmark) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function axis(raw: number, tuning: HandTuning) {
  const v = raw * tuning.sensitivity;
  const dz = tuning.deadZone;
  const a = Math.abs(v);
  if (a < dz) return 0;
  return Math.sign(v) * Math.min(1, (a - dz) / (1 - dz));
}

export class HandController {
  private landmarker: HandLandmarker | null = null;
  private stream: MediaStream | null = null;
  private raf = 0;
  private lastVideoTime = -1;
  private prevPinch = false;
  private smoothMove = 0;
  private smoothRod = 0;
  private video: HTMLVideoElement;
  private preview: HTMLCanvasElement;
  private pctx: CanvasRenderingContext2D;
  tuning: HandTuning;
  frame: HandFrame = {
    moveAxis: 0,
    rodAxis: 0,
    castPressed: false,
    reelHeld: false,
    leftPresent: false,
    rightPresent: false,
  };
  status: HandStatus = "loading";
  errorMessage = "";
  onStatus?: (s: HandStatus, message?: string) => void;

  private constructor(
    video: HTMLVideoElement,
    preview: HTMLCanvasElement,
    tuning: HandTuning,
  ) {
    this.video = video;
    this.preview = preview;
    this.pctx = preview.getContext("2d")!;
    this.tuning = tuning;
  }

  static async create(
    video: HTMLVideoElement,
    preview: HTMLCanvasElement,
    tuning: HandTuning,
    onStatus?: (s: HandStatus, message?: string) => void,
  ) {
    const c = new HandController(video, preview, tuning);
    if (onStatus) c.onStatus = onStatus;
    await c.init();
    return c;
  }

  private setStatus(s: HandStatus, message?: string) {
    this.status = s;
    if (message) this.errorMessage = message;
    this.onStatus?.(s, message);
  }

  private async init() {
    this.setStatus("loading");
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: 640, height: 480 },
        audio: false,
      });
    } catch {
      this.setStatus(
        "error",
        "Không bật được camera. Hãy cho phép truy cập camera trong trình duyệt, hoặc chơi bằng nút bấm.",
      );
      return;
    }
    this.video.srcObject = this.stream;
    this.video.muted = true;
    this.video.playsInline = true;
    try {
      await this.video.play();
    } catch {
      /* Safari có thể chậm; vòng lặp vẫn đọc khung hình khi video sẵn sàng */
    }

    const fileset: WasmFileset = {
      wasmLoaderPath: "/mediapipe/wasm/vision_wasm_internal.js",
      wasmBinaryPath: wasmAsset.url,
    };
    try {
      this.landmarker = await HandLandmarker.createFromOptions(fileset, {
        baseOptions: { modelAssetPath: "/models/hand_landmarker.task", delegate: "GPU" },
        runningMode: "VIDEO",
        numHands: 2,
      });
    } catch {
      try {
        this.landmarker = await HandLandmarker.createFromOptions(fileset, {
          baseOptions: { modelAssetPath: "/models/hand_landmarker.task", delegate: "CPU" },
          runningMode: "VIDEO",
          numHands: 2,
        });
      } catch {
        this.setStatus("error", "Không khởi động được bộ nhận diện bàn tay trên thiết bị này.");
        return;
      }
    }
    this.setStatus("running");
    this.loop();
  }

  private loop = () => {
    const v = this.video;
    if (this.status === "running" && v.readyState >= 2 && v.currentTime !== this.lastVideoTime) {
      this.lastVideoTime = v.currentTime;
      try {
        const res = this.landmarker!.detectForVideo(v, performance.now());
        this.consume(res);
        this.drawPreview(res);
      } catch {
        /* bỏ qua khung hình lỗi */
      }
    }
    this.raf = requestAnimationFrame(this.loop);
  };

  private consume(res: HandLandmarkerResult) {
    const hands = res.landmarks ?? [];
    const labels = res.handednesses ?? [];
    let left: NormalizedLandmark[] | null = null;
    let right: NormalizedLandmark[] | null = null;

    for (let i = 0; i < hands.length; i++) {
      const lm = hands[i];
      if (!lm) continue;
      const cat = labels[i]?.[0]?.categoryName;
      // Khung hình getUserMedia chưa lật gương, MediaPipe mặc định ảnh đã lật → hoán đổi nhãn
      if (cat === "Right") left = lm;
      else right = lm;
    }

    this.frame.leftPresent = !!left;
    this.frame.rightPresent = !!right;

    // Tay trái → lái thuyền ngang
    const l0 = left?.[0];
    if (l0) {
      const mx = 1 - l0.x; // gương tự nhiên
      this.smoothMove += (axis((mx - 0.5) * 2, this.tuning) - this.smoothMove) * 0.35;
    } else {
      this.smoothMove *= 0.82;
    }
    this.frame.moveAxis = Math.abs(this.smoothMove) < 0.02 ? 0 : this.smoothMove;

    // Tay phải → cần câu + cử chỉ
    const hand = right ?? left;
    const h0 = hand?.[0];
    const h4 = hand?.[4];
    const h8 = hand?.[8];
    const h9 = hand?.[9];
    if (hand && h0 && h4 && h8 && h9) {
      const my = h0.y;
      this.smoothRod += (axis((my - 0.5) * 2, this.tuning) - this.smoothRod) * 0.35;
      const scale = Math.max(0.02, dist(h0, h9));
      // chụm cái + trỏ → thả câu (biên tăng)
      const pinch = dist(h4, h8) / scale < 0.38;
      if (pinch && !this.prevPinch) this.frame.castPressed = true;
      this.prevPinch = pinch;
      // mở bàn tay → kéo cần
      const h12 = hand[12] ?? h9;
      const h16 = hand[16] ?? h9;
      const h20 = hand[20] ?? h9;
      const spread =
        (dist(h8, h9) + dist(h12, h9) + dist(h16, h9) + dist(h20, h9)) / (4 * scale);
      this.frame.reelHeld = spread > 1.05;
    } else {
      this.smoothRod *= 0.82;
      this.frame.reelHeld = false;
      this.prevPinch = false;
    }
    this.frame.rodAxis = Math.abs(this.smoothRod) < 0.02 ? 0 : this.smoothRod;
  }

  private drawPreview(res: HandLandmarkerResult) {
    const c = this.pctx;
    const w = this.preview.width;
    const h = this.preview.height;
    c.save();
    c.clearRect(0, 0, w, h);
    // video lật gương
    c.translate(w, 0);
    c.scale(-1, 1);
    c.drawImage(this.video, 0, 0, w, h);
    c.restore();

    const pts = res.landmarks ?? [];
    for (const lm of pts) {
      c.strokeStyle = "rgba(233, 182, 79, 0.9)";
      c.lineWidth = 1.4;
      c.beginPath();
      for (const [a, b] of CONNECTIONS) {
        const pa = lm[a];
        const pb = lm[b];
        if (!pa || !pb) continue;
        c.moveTo((1 - pa.x) * w, pa.y * h);
        c.lineTo((1 - pb.x) * w, pb.y * h);
      }
      c.stroke();
      c.fillStyle = "#f6d67c";
      for (const p of lm) {
        c.beginPath();
        c.arc((1 - p.x) * w, p.y * h, 1.7, 0, Math.PI * 2);
        c.fill();
      }
    }
    if (pts.length === 0) {
      c.fillStyle = "rgba(10, 16, 34, 0.72)";
      c.fillRect(0, 0, w, h);
      c.fillStyle = "#f6d67c";
      c.font = "600 10px 'Be Vietnam Pro', sans-serif";
      c.textAlign = "center";
      c.fillText("Đưa hai bàn tay vào khung hình", w / 2, h / 2 - 4);
    }
  }

  stop() {
    cancelAnimationFrame(this.raf);
    this.raf = 0;
    this.stream?.getTracks().forEach((tr) => tr.stop());
    this.stream = null;
    this.video.srcObject = null;
    try {
      this.landmarker?.close();
    } catch {
      /* đã đóng */
    }
    this.landmarker = null;
    this.status = "loading";
  }
}
