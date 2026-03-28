import { useEffect, useRef } from 'react';

const VIDEO_ID = 'pxHruRgNGsk';
const START_SEC = 3;
const END_SEC = 15;

function loadYouTubeAPI() {
  return new Promise((resolve) => {
    if (window.YT && window.YT.Player) {
      resolve();
      return;
    }
    if (window.YT) {
      window.onYouTubeIframeAPIReady = resolve;
      return;
    }
    window.onYouTubeIframeAPIReady = resolve;
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    tag.async = true;
    const first = document.getElementsByTagName('script')[0];
    first.parentNode.insertBefore(tag, first);
  });
}

export default function HeroVideoBackground() {
  const playerRef = useRef(null);

  useEffect(() => {
    let intervalId;

    loadYouTubeAPI().then(() => {
      const container = document.getElementById('hero-video-yt');
      if (!container) return;

      try {
        playerRef.current = new window.YT.Player('hero-video-yt', {
        videoId: VIDEO_ID,
        playerVars: {
          autoplay: 1,
          mute: 1,
          loop: 1,
          playsinline: 1,
          controls: 0,
          showinfo: 0,
          rel: 0,
          modestbranding: 1,
          start: START_SEC,
          playlist: VIDEO_ID,
        },
        events: {
          onReady: (e) => {
            e.target.mute();
            e.target.playVideo();
            intervalId = setInterval(() => {
              try {
                const t = e.target.getCurrentTime();
                if (t >= END_SEC) e.target.seekTo(START_SEC, true);
              } catch (_) {}
            }, 500);
          },
        },
      });
      } catch (err) {
        console.warn('YouTube player init failed:', err);
      }
    });

    return () => clearInterval(intervalId);
  }, []);

  return (
    <div className="hero-video-wrap" dir="ltr">
      <div id="hero-video-yt" className="hero-video-iframe" />
    </div>
  );
}
