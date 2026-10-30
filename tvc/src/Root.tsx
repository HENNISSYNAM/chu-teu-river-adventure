import { Composition } from "remotion";
import { HeriTrustTVC, TVC_DURATION, type TVCProps } from "./HeriTrustTVC";

const defaults: TVCProps = {
  // Đặt file nhạc vào public/ rồi ghi tên ở đây (vd. "music.mp3"), để trống = không nhạc.
  music: "",
  presenter: "Đinh Văn Nam",
};

export const RemotionRoot = () => (
  <>
    {/* Bản ngang 16:9 cho màn hình sân khấu, YouTube */}
    <Composition
      id="HeriTrustTVC"
      component={HeriTrustTVC}
      durationInFrames={TVC_DURATION}
      fps={30}
      width={1920}
      height={1080}
      defaultProps={defaults}
    />
    {/* Bản dọc 9:16 cho TikTok, Reels, Shorts */}
    <Composition
      id="HeriTrustTVCVertical"
      component={HeriTrustTVC}
      durationInFrames={TVC_DURATION}
      fps={30}
      width={1080}
      height={1920}
      defaultProps={defaults}
    />
  </>
);
