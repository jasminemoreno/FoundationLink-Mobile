import { useEventListener } from "expo";
import { useVideoPlayer, VideoView } from "expo-video";
import { useEffect, useRef, useState } from "react";
import { Animated, StyleSheet, Text, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// The video's first frame is this near-black green, the same as the native
// splash background (app.json), so the splash -> video change has no flash.
export const INTRO_BACKGROUND = "#03130D";

const VIDEO = require("../assets/videos/foundationlink_intro_green.mp4");
// If the video can't play for some reason, never keep the donor waiting
const MAX_WAIT_MS = 9000;

/**
 * The FoundationLink logo video, shown over the app when it starts.
 * The app loads underneath, so Login/Home is ready the moment it ends.
 */
export default function IntroVideo({ onFinish }: { onFinish: () => void }) {
  const insets = useSafeAreaInsets();
  const opacity = useRef(new Animated.Value(1)).current;
  const [leaving, setLeaving] = useState(false);

  const player = useVideoPlayer(VIDEO, (p) => {
    p.muted = true;
    p.loop = false;
    p.play();
  });

  function finish() {
    if (leaving) return;
    setLeaving(true);
    Animated.timing(opacity, {
      toValue: 0,
      duration: 350,
      useNativeDriver: true,
    }).start(() => onFinish());
  }

  useEventListener(player, "playToEnd", finish);
  useEventListener(player, "statusChange", ({ status }) => {
    if (status === "error") finish();
  });

  useEffect(() => {
    // Again now that the video is on screen: on web, play() only reaches a
    // mounted video (on phones it is already playing and this does nothing)
    player.play();
    const timer = setTimeout(finish, MAX_WAIT_MS);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Animated.View style={[styles.wrap, { opacity }]} pointerEvents="box-none">
      <VideoView
        player={player}
        style={styles.video}
        contentFit="cover"
        nativeControls={false}
        allowsFullscreen={false}
        allowsPictureInPicture={false}
      />
      <TouchableOpacity
        style={[styles.skip, { bottom: insets.bottom + 28 }]}
        onPress={finish}
        accessibilityRole="button"
        accessibilityLabel="Skip intro"
      >
        <Text style={styles.skipText}>Skip</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: INTRO_BACKGROUND,
    zIndex: 10,
  },
  // width/height (not just left/right/top/bottom) so a web <video> stretches too
  video: { position: "absolute", top: 0, left: 0, width: "100%", height: "100%" },
  skip: {
    position: "absolute",
    right: 20,
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.45)",
    backgroundColor: "rgba(0,0,0,0.25)",
  },
  skipText: {
    fontFamily: "Nunito_700Bold",
    fontSize: 13,
    color: "#ffffff",
  },
});
