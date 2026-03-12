import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Home, Search, Bell, Mail, User, MoreHorizontal,
  Heart, MessageCircle, Repeat2, Upload, BarChart2, Smile, Calendar,
  X, Star, LogOut, Pencil, Send, ArrowLeft, ImagePlus,
  Plus, ChevronUp, ChevronDown, Trash2,
  Check, Loader2, Play, Pause, SkipBack, SkipForward, Music, Users,
  Settings, Compass,
} from "lucide-react";
import {
  fetchUser, fetchPosts, fetchUserPosts, fetchTop8, fetchPlaylist,
  fetchUserPreferences, fetchUserByAuthId, fetchUserLikes, fetchUserReposts,
  fetchReplies, createReply, toggleLike, toggleRepost,
  followUser, unfollowUser, checkFollowing, addToTop8, removeFromTop8,
  addPlaylistTrack, removePlaylistTrack, reorderPlaylistTrack,
  searchUsers, fetchNotifications, markAllNotificationsRead, getUnreadCount,
  getOrCreateConversation, createGroupConversation, fetchConversations, fetchMessages, sendMessage,
  uploadAvatar, updateUserProfile, createPost, deletePost,
  fetchUserStatus, updateStatus, updateUserInterests, updateProfileEmoji,
} from "./lib/queries";
import { signUp, signIn, signOut, onAuthChange } from "./lib/auth";
import { supabase } from "./lib/supabase";

// ─── Nosta Color Constants ───────────────────────────────────────────────

const R = {
  bg: "#0a0a0a",
  card: "#131313",
  border: "#1e1e1e",
  text: "#e7e9ea",
  gray: "#71767b",
  hover: "#0f0f0f",
  search: "#1a1a1a",
  pink: "#f91880",
  green: "#22c55e",
};

// ─── Vibe Rooms ──────────────────────────────────────────────────────────

const ROOMS = [
  { id: "chill", name: "Chill Zone", emoji: "🧊", accent: "#7C5CFC", description: "Slow down. Breathe. Post." },
  { id: "hype", name: "Hype", emoji: "🔥", accent: "#FF4D6A", description: "Energy. Chaos. Let's go." },
  { id: "creative", name: "Creative", emoji: "🎨", accent: "#FFA033", description: "Show what you made." },
  { id: "latenight", name: "Late Night", emoji: "🌙", accent: "#3B82F6", description: "Thoughts after midnight." },
  { id: "feelgood", name: "Feel Good", emoji: "☀️", accent: "#22C55E", description: "Good news only." },
];

const DEFAULT_ACCENT = "#7C5CFC";

function getRoomById(id) {
  return ROOMS.find((r) => r.id === id) || null;
}

function getAccent(roomId) {
  const room = getRoomById(roomId);
  return room ? room.accent : DEFAULT_ACCENT;
}

// ─── Mock Data ────────────────────────────────────────────────────────────

const MOCK_USER = {
  name: "nova_dreams",
  displayName: "Nova",
  bio: "building nosta one vibe at a time. web archaeologist. digital gardener.",
  avatar: null,
  joinDate: "Jan 2025",
  followers: 847,
  following: 312,
  interests: "web design, lo-fi music, retro internet, pixel art",
  profileEmoji: "✨",
};

const MOCK_STATUS = { id: "mock-status-1", content: "vibing in the chill zone", emoji: "🧊", timestamp: Date.now() - 30 * 60000 };

const MOCK_TOP8 = [
  { id: 1, name: "pixel_witch", label: "pixel_witch" },
  { id: 2, name: "retro_ron", label: "retro_ron" },
  { id: 3, name: "css_goddess", label: "css_goddess" },
  { id: 4, name: "byte_me", label: "byte_me" },
  { id: 5, name: "lo_fi_luke", label: "lo_fi_luke" },
  { id: 6, name: "html_hera", label: "html_hera" },
  { id: 7, name: "vibe_check", label: "vibe_check" },
  { id: 8, name: "zen_coder", label: "zen_coder" },
];

const MOCK_PLAYLIST = [
  { title: "Digital Love", artist: "Daft Punk" },
  { title: "Midnight City", artist: "M83" },
  { title: "Eventually", artist: "Tame Impala" },
];

const now = Date.now();
const MOCK_POSTS = [
  { id: 1, user: "pixel_witch", displayName: "Pixel Witch", avatarImg: 1, content: "just discovered you can still use <marquee> tags and honestly? respect.", timestamp: now - 2 * 60000, humanVerified: true, likes: 42, replies: 7, reposts: 3, views: 12400, room: "chill" },
  { id: 2, user: "retro_ron", displayName: "Retro Ron", avatarImg: 12, content: "hot take: the internet peaked when we had custom cursors and auto-playing midi files on every page #nostalgia", timestamp: now - 8 * 60000, humanVerified: true, likes: 1283, replies: 34, reposts: 128, views: 89000, room: "hype" },
  { id: 3, user: "vibe_check", displayName: "Vibe Check", avatarImg: 3, content: "3am thoughts: what if we just made the internet cozy again? like a digital living room. that's the vibe.", timestamp: now - 12 * 60000, humanVerified: true, likes: 567, replies: 23, reposts: 45, views: 23400, room: "latenight" },
  { id: 4, user: "css_goddess", displayName: "CSS Goddess", avatarImg: 25, content: "made an entire solar system with nothing but box-shadows. no javascript. fight me. #CSS #WebDev", timestamp: now - 25 * 60000, humanVerified: true, likes: 4256, replies: 219, reposts: 847, views: 450000, hasImage: true, room: "creative" },
  { id: 5, user: "byte_me", displayName: "Byte Me", avatarImg: 36, content: "friendly reminder that your personal website doesn't need to be a portfolio. it can just be weird. be weird on the internet again.", timestamp: now - 45 * 60000, humanVerified: true, likes: 5120, replies: 267, reposts: 1245, views: 320000, room: "feelgood" },
  { id: 6, user: "zen_coder", displayName: "Zen Coder", avatarImg: 7, content: "wrote 3 lines of code today. mass deleted 200 lines. productivity has never been higher.", timestamp: now - 50 * 60000, humanVerified: true, likes: 892, replies: 45, reposts: 67, views: 34000, room: "chill" },
  { id: 7, user: "lo_fi_luke", displayName: "Lo-Fi Luke", avatarImg: 52, content: "new album dropped. recorded everything on a four-track from 1998. link in bio.", timestamp: now - 90 * 60000, humanVerified: true, likes: 89, replies: 12, reposts: 5, views: 3400, hasImage: true, room: "creative" },
  { id: 8, user: "html_hera", displayName: "HTML Hera", avatarImg: 44, content: "normalize having a guestbook on your website @pixel_witch knows what's up", timestamp: now - 3 * 3600000, humanVerified: true, likes: 3340, replies: 145, reposts: 522, views: 178000, room: "hype" },
  { id: 9, user: "pixel_witch", displayName: "Pixel Witch", avatarImg: 1, content: "working on a browser extension that replaces all modern web fonts with Comic Sans. you're welcome. #indieweb", timestamp: now - 4 * 3600000, humanVerified: true, likes: 892, replies: 45, reposts: 67, views: 34000, hasImage: true, room: "creative" },
  { id: 10, user: "retro_ron", displayName: "Retro Ron", avatarImg: 12, content: "just bought a domain for my cat's personal website. yes it will have a hit counter. #webdesign", timestamp: now - 5 * 3600000, humanVerified: true, likes: 456, replies: 23, reposts: 34, views: 15600, room: "feelgood" },
  { id: 11, user: "css_goddess", displayName: "CSS Goddess", avatarImg: 25, content: "the fact that @byte_me's website still loads in under 200ms with zero JS gives me hope for humanity", timestamp: now - 7 * 3600000, humanVerified: true, likes: 2891, replies: 89, reposts: 234, views: 145000, room: "feelgood" },
  { id: 12, user: "byte_me", displayName: "Byte Me", avatarImg: 36, content: "people really out here building 47MB React apps to display a single paragraph of text", timestamp: now - 10 * 3600000, humanVerified: true, likes: 12400, replies: 567, reposts: 3400, views: 890000, room: "hype" },
  { id: 13, user: "lo_fi_luke", displayName: "Lo-Fi Luke", avatarImg: 52, content: "recorded a 3 hour ambient set on a beach at sunrise. best music I've ever made and nobody will hear it lol", timestamp: now - 14 * 3600000, humanVerified: true, likes: 67, replies: 8, reposts: 3, views: 2100, hasImage: true, room: "chill" },
  { id: 14, user: "html_hera", displayName: "HTML Hera", avatarImg: 44, content: "spent 6 hours making my <table> layout responsive. yes I still use tables for layout. no I will not be taking questions.", timestamp: now - 18 * 3600000, humanVerified: true, likes: 1567, replies: 78, reposts: 123, views: 67000, room: "latenight" },
  { id: 15, user: "pixel_witch", displayName: "Pixel Witch", avatarImg: 1, content: "my geocities tribute page now has more daily visitors than some VC-funded startups lmao #indieweb", timestamp: now - 24 * 3600000, humanVerified: true, likes: 3456, replies: 134, reposts: 456, views: 234000, room: "hype" },
  { id: 16, user: "retro_ron", displayName: "Retro Ron", avatarImg: 12, content: "found my old Winamp skins folder. I'm not crying you're crying", timestamp: now - 36 * 3600000, humanVerified: true, likes: 789, replies: 56, reposts: 89, views: 28000, hasImage: true, room: "feelgood" },
  { id: 17, user: "vibe_check", displayName: "Vibe Check", avatarImg: 3, content: "the chill zone at 2am hits different. just me, lo-fi beats, and existential dread wrapped in a cozy blanket", timestamp: now - 40 * 3600000, humanVerified: true, likes: 234, replies: 18, reposts: 12, views: 8900, room: "latenight" },
  { id: 18, user: "css_goddess", displayName: "CSS Goddess", avatarImg: 25, content: "just pushed a commit that's 100% CSS animations. my laptop fans started a small jet engine. #cssart", timestamp: now - 60 * 3600000, humanVerified: true, likes: 678, replies: 34, reposts: 56, views: 23000, hasImage: true, room: "creative" },
  { id: 19, user: "byte_me", displayName: "Byte Me", avatarImg: 36, content: "the best code is no code. the second best code is deleted code. I'm incredibly productive today.", timestamp: now - 72 * 3600000, humanVerified: true, likes: 8900, replies: 234, reposts: 1200, views: 456000, room: "chill" },
  { id: 20, user: "html_hera", displayName: "HTML Hera", avatarImg: 44, content: "me: I should build something productive today\nalso me: *spends 4 hours perfecting a CSS gradient*\n\n#devlife", timestamp: now - 96 * 3600000, humanVerified: true, likes: 2345, replies: 67, reposts: 189, views: 89000, hasImage: true, room: "creative" },
  { id: 21, user: "zen_coder", displayName: "Zen Coder", avatarImg: 7, content: "hot take: the best debugging tool is a good night's sleep. shipped 0 bugs this week by simply not writing code after 6pm.", timestamp: now - 100 * 3600000, humanVerified: true, likes: 1234, replies: 56, reposts: 89, views: 45000, room: "chill" },
  { id: 22, user: "lo_fi_luke", displayName: "Lo-Fi Luke", avatarImg: 52, content: "just finished scoring a short film with nothing but cassette tape loops and a broken synth. the director cried. good tears.", timestamp: now - 110 * 3600000, humanVerified: true, likes: 345, replies: 28, reposts: 19, views: 12000, room: "creative" },
  { id: 23, user: "pixel_witch", displayName: "Pixel Witch", avatarImg: 1, content: "EVERYONE GO LOOK AT THE MOON RIGHT NOW. I don't care if it's daytime where you are just trust me", timestamp: now - 120 * 3600000, humanVerified: true, likes: 6789, replies: 345, reposts: 890, views: 567000, room: "hype" },
  { id: 24, user: "vibe_check", displayName: "Vibe Check", avatarImg: 3, content: "daily reminder: you don't owe the internet your productivity. sometimes the best post is no post. but here I am posting about it.", timestamp: now - 130 * 3600000, humanVerified: true, likes: 456, replies: 34, reposts: 67, views: 23000, room: "feelgood" },
  { id: 25, user: "retro_ron", displayName: "Retro Ron", avatarImg: 12, content: "built a web radio station that only plays songs from flash games. the nostalgia is overwhelming. join at retroradio.fun", timestamp: now - 140 * 3600000, humanVerified: true, likes: 2345, replies: 123, reposts: 345, views: 89000, room: "creative" },
];

const MOCK_TRENDING_ROOMS = [
  { roomId: "hype", postCount: "2.4K", topPost: "the internet peaked when we had custom cursors..." },
  { roomId: "creative", postCount: "1.8K", topPost: "made an entire solar system with box-shadows..." },
  { roomId: "chill", postCount: "1.2K", topPost: "the best code is no code..." },
  { roomId: "latenight", postCount: "890", topPost: "3am thoughts: what if we just..." },
  { roomId: "feelgood", postCount: "756", topPost: "your personal website can just be weird..." },
];

const MOCK_SUGGESTIONS = [
  { username: "web_archaeologist", displayName: "Web Archaeologist", avatarImg: 15 },
  { username: "terminal_dreams", displayName: "Terminal Dreams", avatarImg: 22 },
  { username: "midi_maestro", displayName: "MIDI Maestro", avatarImg: 33 },
];

// ─── Helpers ──────────────────────────────────────────────────────────────

function timeAgo(ts) {
  const diff = Date.now() - ts;
  const secs = Math.floor(diff / 1000);
  if (secs < 60) return `${secs}s`;
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const d = new Date(ts);
  const n = new Date();
  if (d.getFullYear() === n.getFullYear()) return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function formatCount(n) {
  if (!n) return "0";
  if (n >= 1000000) return `${(n / 1000000).toFixed(1).replace(/\.0$/, "")}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, "")}K`;
  return String(n);
}

function renderContent(text, accent = DEFAULT_ACCENT) {
  if (!text) return null;
  return text.split(/(@\w+|#\w+|https?:\/\/\S+)/g).map((part, i) => {
    if (/^[@#]/.test(part)) return <span key={i} style={{ color: accent }}>{part}</span>;
    if (/^https?:/.test(part)) {
      const display = part.length > 30 ? part.slice(0, 30) + "\u2026" : part;
      return <span key={i} style={{ color: accent }}>{display}</span>;
    }
    return part;
  });
}

function getAvatarUrl(post) {
  if (post.avatar) return post.avatar;
  if (post.avatarImg) return `https://i.pravatar.cc/150?img=${post.avatarImg}`;
  return null;
}

// ─── useIsMobile Hook ─────────────────────────────────────────────────────

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(typeof window !== "undefined" ? window.innerWidth < 768 : false);
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);
  return isMobile;
}

// ─── Styles ───────────────────────────────────────────────────────────────

function StyleTag({ accent = DEFAULT_ACCENT }) {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
      * { box-sizing: border-box; }
      body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; margin: 0; background: #0a0a0a; color: #e7e9ea; }
      ::-webkit-scrollbar { width: 0; }
      textarea:focus, input:focus, button:focus { outline: none; }

      .tweet-hover { transition: background 150ms ease; }
      .tweet-hover:hover { background: #0f0f0f; }
      .post-card .tweet-hover { border-bottom: none !important; }
      .post-card .tweet-hover:hover { background: ${accent}0d; border-radius: 16px; }
      .hover-underline:hover { text-decoration: underline; cursor: pointer; }
      .nav-item-hover { transition: background 150ms ease; border-radius: 12px; }
      .nav-item-hover:hover { background: #1a1a1a; }
      .post-btn-main:hover { filter: brightness(1.1); }

      .action-reply, .action-repost, .action-like, .action-views, .action-share {
        display: flex; align-items: center; gap: 4; background: none; border: none;
        cursor: pointer; color: #71767b; padding: 0; font-family: inherit; transition: color 150ms ease; font-size: 13px;
      }
      .action-circle { width: 34px; height: 34px; border-radius: 50%; display: flex; align-items: center; justify-content: center; transition: background 150ms ease; }
      .action-reply:hover { color: ${accent}; } .action-reply:hover .action-circle { background: ${accent}18; }
      .action-repost:hover { color: #22c55e; } .action-repost:hover .action-circle { background: rgba(34,197,94,0.1); }
      .action-like:hover { color: #f91880; } .action-like:hover .action-circle { background: rgba(249,24,128,0.1); }
      .action-views:hover { color: ${accent}; } .action-views:hover .action-circle { background: ${accent}18; }
      .action-share:hover { color: ${accent}; } .action-share:hover .action-circle { background: ${accent}18; }

      @keyframes like-pop { 0% { transform: scale(1); } 25% { transform: scale(1.2); } 100% { transform: scale(1); } }
      .like-animate { animation: like-pop 200ms ease; }

      .tab-item { flex: 1; display: flex; align-items: center; justify-content: center; padding: 16px 0; font-size: 15px; cursor: pointer; position: relative; transition: background 150ms ease; background: none; border: none; font-family: inherit; }
      .tab-item:hover { background: rgba(231,233,234,0.06); }

      .follow-btn { transition: all 150ms ease; }
      .follow-btn-following:hover { border-color: rgb(103,7,15) !important; color: rgb(244,33,46) !important; background: rgba(244,33,46,0.1) !important; }

      .search-input:focus { border-color: ${accent} !important; background: #0a0a0a !important; }
      .compose-textarea { border: none; background: transparent; color: #e7e9ea; font-size: 20px; line-height: 24px; width: 100%; resize: none; font-family: inherit; }
      .compose-textarea::placeholder { color: #71767b; }

      .room-pill { transition: all 150ms ease; cursor: pointer; border: none; font-family: inherit; }
      .room-pill:hover { filter: brightness(1.2); }

      .avatar-upload-overlay { pointer-events: none; }
      *:hover > .avatar-upload-overlay { opacity: 1 !important; }

      .left-sidebar { width: 275px; flex-shrink: 0; position: sticky; top: 0; height: 100vh; overflow-y: auto; display: flex; flex-direction: column; padding: 0 12px; }
      .left-sidebar .nav-label { display: inline; }
      .left-sidebar .room-labels { display: block; }
      .left-sidebar .post-btn-text { display: inline; }
      .left-sidebar .post-btn-icon-only { display: none; }
      .left-sidebar .post-btn { width: 225px; }
      .left-sidebar .user-pill-text { display: flex; }
      .center-column { width: 600px; min-height: 100vh; border-left: 1px solid #1e1e1e; border-right: 1px solid #1e1e1e; flex-shrink: 0; }
      .right-sidebar { width: 350px; flex-shrink: 0; padding: 12px 32px 0 24px; position: sticky; top: 0; height: 100vh; overflow-y: auto; }
      .mobile-bottom-bar { display: none; position: fixed; bottom: 0; left: 0; right: 0; background: rgba(10,10,10,0.75); backdrop-filter: blur(12px); border-top: 1px solid #1e1e1e; z-index: 50; justify-content: space-around; padding: 8px 0; }
      .mobile-room-bar { display: none; }

      @media (max-width: 1279px) {
        .left-sidebar { width: 88px; align-items: center; }
        .left-sidebar .nav-label { display: none; }
        .left-sidebar .room-labels { display: none; }
        .left-sidebar .post-btn-text { display: none; }
        .left-sidebar .post-btn-icon-only { display: flex; align-items: center; justify-content: center; }
        .left-sidebar .post-btn { width: 50px !important; height: 50px; padding: 0; }
        .left-sidebar .user-pill-text { display: none; }
      }
      @media (max-width: 1023px) {
        .right-sidebar { display: none; }
        .center-column { flex: 1; width: auto; max-width: 600px; }
      }
      .mobile-tab-pill {
        display: flex; align-items: center; justify-content: center; gap: 6px;
        padding: 8px 16px; border-radius: 20px; border: none; cursor: pointer;
        font-family: inherit; font-size: 13px; font-weight: 600; transition: all 150ms ease;
        background: transparent; color: #71767b;
      }
      .mobile-tab-pill.active { color: #fff; }

      .status-bubble {
        background: #131313; border: 1px solid #1e1e1e; border-radius: 16px;
        padding: 12px 16px; display: flex; align-items: center; gap: 10px;
      }

      @media (max-width: 767px) {
        .left-sidebar { display: none !important; }
        .center-column { width: 100%; max-width: none; border: none; padding-bottom: 60px; }
        .mobile-bottom-bar { display: flex; }
        .mobile-room-bar { display: flex; gap: 8px; overflow-x: auto; padding: 8px 16px; border-bottom: 1px solid #1e1e1e; }
        .mobile-room-bar::-webkit-scrollbar { display: none; }
        .desktop-compose { display: none; }
        .desktop-only { display: none !important; }
        .post-card { background: #131313; border: 1px solid #1e1e1e; border-radius: 16px; margin: 6px 12px; overflow: hidden; }
        .mobile-fab { display: flex; position: fixed; bottom: 76px; right: 16px; width: 56px; height: 56px; border-radius: 50%; border: none; cursor: pointer; align-items: center; justify-content: center; z-index: 40; box-shadow: 0 4px 12px rgba(0,0,0,0.4); }
        .mobile-top-bar { display: flex; position: sticky; top: 0; z-index: 30; height: 48px; align-items: center; justify-content: space-between; padding: 0 16px; background: rgba(10,10,10,0.85); backdrop-filter: blur(12px); border-bottom: 1px solid #1e1e1e; }
        .mobile-profile-header { display: block; }
        .desktop-profile-header { display: none !important; }
      }
      @media (min-width: 768px) {
        .mobile-fab { display: none !important; }
        .mobile-top-bar { display: none !important; }
        .mobile-profile-header { display: none !important; }
        .desktop-profile-header { display: block; }
        .mobile-only { display: none !important; }
        .post-card { background: #131313; border: 1px solid #1e1e1e; border-radius: 16px; margin: 6px 12px; overflow: hidden; transition: border-color 150ms ease; }
        .post-card:hover { border-color: #2a2a2a; }
        .desktop-compose-card { background: #131313; border: 1px solid #1e1e1e; border-radius: 16px; margin: 12px 12px 6px 12px; overflow: hidden; }
        .notification-card { background: #131313; border: 1px solid #1e1e1e; border-radius: 16px; margin: 6px 12px; overflow: hidden; transition: border-color 150ms ease; }
        .notification-card:hover { border-color: #2a2a2a; }
        .notification-card .tweet-hover { border-bottom: none !important; }
        .profile-header-card { background: #131313; border: 1px solid #1e1e1e; border-radius: 20px; margin: 12px; padding: 24px; }
        .profile-section-card { background: #131313; border: 1px solid #1e1e1e; border-radius: 16px; margin: 0 12px 12px 12px; padding: 16px; }
        .profile-status-card { background: #131313; border: 1px solid #1e1e1e; border-radius: 16px; margin: 0 12px 8px 12px; padding: 14px 16px; }
      }
    `}</style>
  );
}

// ─── Verified Badge ───────────────────────────────────────────────────────

function VerifiedBadge({ accent = DEFAULT_ACCENT }) {
  return (
    <svg viewBox="0 0 22 22" width={18} height={18} style={{ flexShrink: 0 }}>
      <path fill={accent} d="M20.396 11c-.018-.646-.215-1.275-.57-1.816-.354-.54-.852-.972-1.438-1.246.223-.607.27-1.264.14-1.897-.131-.634-.437-1.218-.882-1.687-.47-.445-1.053-.75-1.687-.882-.633-.13-1.29-.083-1.897.14-.273-.587-.704-1.086-1.245-1.44S11.647 1.62 11 1.604c-.646.017-1.273.213-1.813.568s-.969.855-1.24 1.44c-.608-.223-1.267-.272-1.902-.14-.635.13-1.22.436-1.69.882-.445.47-.749 1.055-.878 1.688-.13.633-.08 1.29.144 1.896-.587.274-1.087.705-1.443 1.245-.356.54-.555 1.17-.574 1.817.02.647.218 1.276.574 1.817.356.54.856.972 1.443 1.245-.224.607-.274 1.264-.144 1.897.13.634.433 1.218.877 1.688.47.443 1.054.747 1.687.878.633.132 1.29.084 1.897-.136.274.586.705 1.084 1.246 1.439.54.354 1.17.551 1.816.569.647-.016 1.276-.213 1.817-.567s.972-.854 1.245-1.44c.604.239 1.266.296 1.903.164.636-.132 1.22-.447 1.68-.907.46-.46.776-1.044.908-1.681s.075-1.299-.165-1.903c.586-.274 1.084-.705 1.439-1.246.354-.54.551-1.17.569-1.816zM9.662 14.85l-3.429-3.428 1.293-1.302 2.072 2.072 4.4-4.794 1.347 1.246z" />
    </svg>
  );
}

// ─── Avatar ───────────────────────────────────────────────────────────────

function Avatar({ src, size = 40, onClick }) {
  const radius = Math.round(size * 0.2);
  return src ? (
    <img
      src={src}
      alt=""
      onClick={onClick}
      style={{ width: size, height: size, borderRadius: radius, flexShrink: 0, cursor: onClick ? "pointer" : "default", objectFit: "cover" }}
    />
  ) : (
    <div
      onClick={onClick}
      style={{ width: size, height: size, borderRadius: radius, flexShrink: 0, cursor: onClick ? "pointer" : "default", background: R.search, display: "flex", alignItems: "center", justifyContent: "center" }}
    >
      <User size={size * 0.5} style={{ color: R.gray }} />
    </div>
  );
}

// ─── Room Badge ──────────────────────────────────────────────────────────

function RoomBadge({ roomId }) {
  const room = getRoomById(roomId);
  if (!room) return null;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 12, fontWeight: 600, color: room.accent, background: `${room.accent}15`, padding: "2px 8px", borderRadius: 20 }}>
      <span>{room.emoji}</span>
      <span>{room.name}</span>
    </span>
  );
}

// ─── Tweet ────────────────────────────────────────────────────────────────

function Tweet({ post, isLiked, isReposted, onToggleLike, onToggleRepost, onDeletePost, onNavigateToProfile, onToggleReplies, repliesExpanded, replies, onCreateReply, appUserId, accent = DEFAULT_ACCENT }) {
  const [replyText, setReplyText] = useState("");
  const [replySending, setReplySending] = useState(false);
  const [likeAnimating, setLikeAnimating] = useState(false);

  const avatarUrl = getAvatarUrl(post);
  const views = post.views || Math.max((post.likes + post.replies + (post.reposts || 0)) * 12, 100);

  const handleLike = (e) => {
    e.stopPropagation();
    if (!onToggleLike || !appUserId) return;
    setLikeAnimating(true);
    setTimeout(() => setLikeAnimating(false), 300);
    onToggleLike(post.id);
  };

  const handleSendReply = async () => {
    const text = replyText.trim();
    if (!text || !onCreateReply) return;
    setReplySending(true);
    await onCreateReply(post.id, text);
    setReplyText("");
    setReplySending(false);
  };

  return (
    <div className="tweet-hover" style={{ padding: "12px 16px", borderBottom: `1px solid ${R.border}`, cursor: "pointer" }}>
      <div style={{ display: "flex", gap: 12 }}>
        <Avatar src={avatarUrl} onClick={(e) => { e.stopPropagation(); onNavigateToProfile?.(post.userId); }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Author info */}
          <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 15, lineHeight: "20px", overflow: "hidden" }}>
            <span className="hover-underline" onClick={(e) => { e.stopPropagation(); onNavigateToProfile?.(post.userId); }} style={{ fontWeight: 700, color: R.text, whiteSpace: "nowrap" }}>
              {post.displayName || post.user}
            </span>
            {post.profileEmoji && <span style={{ fontSize: 14, flexShrink: 0 }}>{post.profileEmoji}</span>}
            {post.humanVerified && <VerifiedBadge accent={accent} />}
            <span style={{ color: R.gray, whiteSpace: "nowrap" }}>@{post.user}</span>
            <span style={{ color: R.gray }}>&middot;</span>
            <span style={{ color: R.gray, whiteSpace: "nowrap" }}>{timeAgo(post.timestamp)}</span>
            {appUserId && post.userId === appUserId && onDeletePost && (
              <button
                onClick={(e) => { e.stopPropagation(); if (window.confirm("Delete this post?")) onDeletePost(post.id); }}
                style={{ marginLeft: "auto", background: "none", border: "none", color: R.gray, cursor: "pointer", padding: 4, display: "flex" }}
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>

          {/* Room Badge */}
          {post.room && <div style={{ marginTop: 4 }}><RoomBadge roomId={post.room} /></div>}

          {/* Content */}
          <div style={{ color: R.text, fontSize: 15, lineHeight: "20px", wordWrap: "break-word", marginTop: 4, whiteSpace: "pre-wrap" }}>
            {renderContent(post.content, accent)}
          </div>

          {/* Image */}
          {post.hasImage && (
            <img
              src={`https://picsum.photos/seed/${post.id}/600/400`}
              alt=""
              style={{ marginTop: 12, borderRadius: 20, maxHeight: 510, width: "100%", objectFit: "cover", border: `1px solid ${R.border}`, display: "block" }}
            />
          )}

          {/* Actions */}
          <div style={{ display: "flex", justifyContent: "space-between", maxWidth: 425, paddingTop: 12 }}>
            <button className="action-reply" onClick={(e) => { e.stopPropagation(); onToggleReplies?.(post.id); }}>
              <div className="action-circle"><MessageCircle size={18} /></div>
              <span>{formatCount(post.replies)}</span>
            </button>
            <button className="action-repost" onClick={(e) => { e.stopPropagation(); appUserId && onToggleRepost?.(post.id); }} style={isReposted ? { color: R.green } : undefined}>
              <div className="action-circle"><Repeat2 size={18} /></div>
              <span>{formatCount(post.reposts || 0)}</span>
            </button>
            <button className="action-like" onClick={handleLike} style={isLiked ? { color: R.pink } : undefined}>
              <div className={`action-circle${likeAnimating ? " like-animate" : ""}`}>
                <Heart size={18} fill={isLiked ? R.pink : "none"} />
              </div>
              <span>{formatCount(post.likes)}</span>
            </button>
            <button className="action-views" onClick={(e) => e.stopPropagation()}>
              <div className="action-circle"><BarChart2 size={18} /></div>
              <span>{formatCount(views)}</span>
            </button>
            <button className="action-share" onClick={(e) => e.stopPropagation()}>
              <div className="action-circle"><Upload size={18} /></div>
            </button>
          </div>

          {/* Expanded Replies */}
          <AnimatePresence>
            {repliesExpanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                style={{ marginTop: 12, borderTop: `1px solid ${R.border}`, paddingTop: 12, overflow: "hidden" }}
              >
                {replies && replies.length > 0 ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 12 }}>
                    {replies.map((reply) => (
                      <div key={reply.id} style={{ display: "flex", gap: 8, padding: 8 }}>
                        <Avatar src={reply.avatar} size={24} />
                        <div>
                          <div style={{ display: "flex", gap: 4, alignItems: "center", fontSize: 13 }}>
                            <span className="hover-underline" onClick={(e) => { e.stopPropagation(); onNavigateToProfile?.(reply.userId); }} style={{ fontWeight: 700, color: R.text }}>@{reply.user}</span>
                            <span style={{ color: R.gray }}>{timeAgo(reply.timestamp)}</span>
                          </div>
                          <div style={{ color: R.text, fontSize: 14, marginTop: 2 }}>{reply.content}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ color: R.gray, fontSize: 14, marginBottom: 12 }}>No replies yet</div>
                )}
                {appUserId && (
                  <div style={{ display: "flex", gap: 8 }} onClick={(e) => e.stopPropagation()}>
                    <input
                      type="text"
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="Post your reply"
                      maxLength={280}
                      onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleSendReply(); } }}
                      style={{ flex: 1, background: R.search, border: `1px solid ${R.border}`, borderRadius: 9999, padding: "8px 16px", color: R.text, fontSize: 14, fontFamily: "inherit" }}
                    />
                    <button
                      onClick={handleSendReply}
                      disabled={replySending || !replyText.trim()}
                      style={{ background: accent, color: "#fff", border: "none", borderRadius: 9999, padding: "8px 16px", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", opacity: replySending || !replyText.trim() ? 0.5 : 1 }}
                    >
                      Reply
                    </button>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

// ─── Compose Box ──────────────────────────────────────────────────────────

function ComposeBox({ user, appUserId, onPostCreated, accent = DEFAULT_ACCENT, activeRoom, onRoomChange }) {
  const [text, setText] = useState("");
  const [error, setError] = useState(null);
  const [sending, setSending] = useState(false);
  const textareaRef = useRef(null);

  const handlePost = async () => {
    const content = text.trim();
    if (!content || !appUserId) return;
    setError(null);
    setSending(true);
    const result = await createPost(appUserId, content, activeRoom || null);
    setSending(false);
    if (result?.error) { setError(result.error); return; }
    setText("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
    onPostCreated();
  };

  const handleInput = (e) => {
    setText(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = e.target.scrollHeight + "px";
  };

  if (!appUserId) return null;

  return (
    <div style={{ padding: "12px 16px", borderBottom: `1px solid ${R.border}` }}>
      <div style={{ display: "flex", gap: 12 }}>
        <Avatar src={user?.avatar} />
        <div style={{ flex: 1 }}>
          <textarea
            ref={textareaRef}
            className="compose-textarea"
            value={text}
            onChange={handleInput}
            placeholder={activeRoom ? `Vibing in ${getRoomById(activeRoom)?.name || ""}...` : "What's on your mind?"}
            maxLength={280}
            rows={1}
          />
          {/* Room Selector */}
          {onRoomChange && (
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 8 }}>
              {ROOMS.map((room) => (
                <button
                  key={room.id}
                  className="room-pill"
                  onClick={() => onRoomChange(room.id)}
                  style={{
                    padding: "4px 12px", borderRadius: 20, fontSize: 13, fontWeight: 600,
                    background: activeRoom === room.id ? `${room.accent}20` : "transparent",
                    color: activeRoom === room.id ? room.accent : R.gray,
                    border: `1px solid ${activeRoom === room.id ? room.accent + "40" : R.border}`,
                  }}
                >
                  {room.emoji} {room.name}
                </button>
              ))}
            </div>
          )}
          <div style={{ borderTop: `1px solid ${R.border}`, marginTop: 12, paddingTop: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", gap: 16 }}>
              <ImagePlus size={20} style={{ color: accent, cursor: "pointer", opacity: 0.8 }} />
              <BarChart2 size={20} style={{ color: accent, cursor: "pointer", opacity: 0.8 }} />
              <Smile size={20} style={{ color: accent, cursor: "pointer", opacity: 0.8 }} />
              <Calendar size={20} style={{ color: accent, cursor: "pointer", opacity: 0.8 }} />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              {text.length > 0 && (
                <span style={{ fontSize: 13, color: text.length > 260 ? R.pink : R.gray }}>
                  {280 - text.length}
                </span>
              )}
              <button
                onClick={handlePost}
                disabled={sending || !text.trim()}
                className="post-btn-main"
                style={{ background: accent, color: "#fff", border: "none", borderRadius: 9999, padding: "8px 20px", fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", opacity: sending || !text.trim() ? 0.5 : 1 }}
              >
                {sending ? "Posting..." : "Post"}
              </button>
            </div>
          </div>
          {error && <div style={{ color: R.pink, fontSize: 13, marginTop: 8 }}>{error}</div>}
        </div>
      </div>
    </div>
  );
}

// ─── Left Sidebar ─────────────────────────────────────────────────────────

function LeftSidebar({ activeView, setView, user, unreadCount, onSignOut, onPostClick, accent = DEFAULT_ACCENT, activeRoom, onRoomChange, customRooms = [] }) {
  const [showMenu, setShowMenu] = useState(false);

  const navItems = [
    { icon: Home, label: "Home", view: "feed" },
    { icon: Search, label: "Search", view: "explore" },
    { icon: Bell, label: "Notifications", view: "notifications", badge: unreadCount },
    { icon: Mail, label: "Direct Messages", view: "messages" },
    { icon: User, label: "Profile", view: "profile" },
  ];

  return (
    <aside className="left-sidebar">
      {/* Logo */}
      <div style={{ padding: "12px 0" }}>
        <div className="nav-item-hover" onClick={() => setView("feed")} style={{ width: 50, height: 50, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
          <span style={{ fontSize: 24, fontWeight: 900, color: accent }}>n</span>
        </div>
      </div>

      {/* Nav Items */}
      <nav style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {navItems.map((item) => (
          <div
            key={item.label}
            className="nav-item-hover"
            onClick={() => setView(item.view)}
            style={{ display: "flex", alignItems: "center", gap: 20, padding: "12px 12px", cursor: "pointer", position: "relative" }}
          >
            <item.icon size={26} style={{ color: R.text, flexShrink: 0 }} strokeWidth={activeView === item.view ? 2.5 : 1.5} />
            <span className="nav-label" style={{ fontSize: 20, color: R.text, fontWeight: activeView === item.view ? 700 : 400 }}>
              {item.label}
            </span>
            {item.badge > 0 && (
              <span style={{ position: "absolute", top: 6, left: 28, background: accent, color: "#fff", fontSize: 11, fontWeight: 700, borderRadius: 9999, padding: "1px 6px", minWidth: 18, textAlign: "center" }}>
                {item.badge > 99 ? "99+" : item.badge}
              </span>
            )}
          </div>
        ))}
      </nav>

      {/* Rooms */}
      {onRoomChange && (
        <div style={{ marginTop: 8, paddingTop: 8, borderTop: `1px solid ${R.border}` }}>
          <div className="room-labels" style={{ fontSize: 13, fontWeight: 700, color: R.gray, padding: "4px 12px", marginBottom: 4, textTransform: "uppercase", letterSpacing: 1 }}>Rooms</div>
          {[...ROOMS, ...customRooms].map((room) => (
            <div
              key={room.id}
              className="nav-item-hover"
              onClick={() => onRoomChange(room.id)}
              style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 12px", cursor: "pointer", background: activeRoom === room.id ? "#1a1a1a" : "transparent", borderRadius: 12, borderLeft: activeRoom === room.id ? `3px solid ${room.accent}` : "3px solid transparent" }}
            >
              <span style={{ fontSize: 18 }}>{room.emoji}</span>
              <span className="nav-label" style={{ fontSize: 15, color: activeRoom === room.id ? room.accent : R.text, fontWeight: activeRoom === room.id ? 700 : 400 }}>
                {room.name}
              </span>
            </div>
          ))}
          <div
            className="nav-item-hover"
            onClick={() => onRoomChange("__create__")}
            style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 12px", cursor: "pointer", borderRadius: 20, marginTop: 4 }}
          >
            <span style={{ fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center", width: 22, height: 22, borderRadius: "50%", border: `2px dashed ${R.gray}`, color: R.gray, fontWeight: 700 }}>+</span>
            <span className="nav-label" style={{ fontSize: 15, color: R.gray }}>Create Room</span>
          </div>
        </div>
      )}

      {/* Post Button */}
      <button
        onClick={onPostClick}
        className="post-btn post-btn-main"
        style={{ height: 52, borderRadius: 9999, background: accent, color: "#fff", fontSize: 17, fontWeight: 700, border: "none", cursor: "pointer", marginTop: 16 }}
      >
        <span className="post-btn-text">Post</span>
        <span className="post-btn-icon-only"><Pencil size={22} /></span>
      </button>

      <div style={{ flex: 1 }} />

      {/* User Pill */}
      <div style={{ position: "relative", marginBottom: 12 }}>
        <div
          className="nav-item-hover"
          onClick={() => setShowMenu(!showMenu)}
          style={{ display: "flex", alignItems: "center", gap: 12, padding: 12, cursor: "pointer" }}
        >
          <Avatar src={user?.avatar} />
          <div className="user-pill-text" style={{ flex: 1, minWidth: 0, flexDirection: "column" }}>
            <div style={{ fontWeight: 700, color: R.text, fontSize: 15, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {user?.displayName || "Your Name"}
            </div>
            <div style={{ color: R.gray, fontSize: 15 }}>@{user?.name || "handle"}</div>
          </div>
          <MoreHorizontal size={18} style={{ color: R.text, flexShrink: 0 }} />
        </div>
        {showMenu && (
          <>
            <div style={{ position: "fixed", inset: 0, zIndex: 40 }} onClick={() => setShowMenu(false)} />
            <div style={{ position: "absolute", bottom: "100%", left: 0, right: 0, background: R.bg, border: `1px solid ${R.border}`, borderRadius: 20, boxShadow: "0 0 15px rgba(255,255,255,0.2)", zIndex: 50, overflow: "hidden" }}>
              <button
                onClick={() => { onSignOut(); setShowMenu(false); }}
                style={{ width: "100%", padding: "16px", background: "none", border: "none", color: R.text, fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", textAlign: "left" }}
              >
                Log out @{user?.name || "handle"}
              </button>
            </div>
          </>
        )}
      </div>
    </aside>
  );
}

// ─── Right Sidebar ────────────────────────────────────────────────────────

function RightSidebar({ onNavigateToProfile, accent = DEFAULT_ACCENT, onRoomChange }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [followedUsers, setFollowedUsers] = useState(new Set());
  const debounceRef = useRef(null);

  useEffect(() => {
    if (!searchQuery.trim()) { setSearchResults([]); return; }
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      const data = await searchUsers(searchQuery);
      setSearchResults(data);
      setSearching(false);
    }, 300);
    return () => clearTimeout(debounceRef.current);
  }, [searchQuery]);

  const toggleFollow = (username) => {
    setFollowedUsers((prev) => {
      const next = new Set(prev);
      if (next.has(username)) next.delete(username); else next.add(username);
      return next;
    });
  };

  return (
    <aside className="right-sidebar">
      {/* Search Bar */}
      <div style={{ position: "relative" }}>
        <div style={{ position: "relative" }}>
          <Search size={18} style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", color: searchFocused ? accent : R.gray }} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setTimeout(() => setSearchFocused(false), 200)}
            placeholder="Search"
            className="search-input"
            style={{ width: "100%", height: 44, borderRadius: 9999, background: R.search, border: "1px solid transparent", padding: "0 16px 0 48px", color: R.text, fontSize: 15, fontFamily: "inherit" }}
          />
        </div>
        {/* Search Results Dropdown */}
        {searchFocused && searchQuery.trim() && (
          <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: R.bg, border: `1px solid ${R.border}`, borderRadius: 20, marginTop: 4, boxShadow: "0 0 15px rgba(255,255,255,0.2)", maxHeight: 400, overflowY: "auto", zIndex: 30 }}>
            {searching && <div style={{ padding: 16, color: R.gray, fontSize: 14 }}>Searching...</div>}
            {!searching && searchResults.length === 0 && <div style={{ padding: 16, color: R.gray, fontSize: 14 }}>No results found</div>}
            {searchResults.map((u) => (
              <div
                key={u.id}
                onClick={() => { onNavigateToProfile(u.id); setSearchQuery(""); }}
                style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", cursor: "pointer", transition: "background 150ms" }}
                onMouseEnter={(e) => e.currentTarget.style.background = R.hover}
                onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
              >
                <Avatar src={u.avatar} size={40} />
                <div>
                  <div style={{ fontWeight: 700, color: R.text, fontSize: 15 }}>{u.displayName} {u.profileEmoji && <span style={{ fontSize: 13 }}>{u.profileEmoji}</span>}</div>
                  <div style={{ color: R.gray, fontSize: 15 }}>@{u.username}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Rooms Popping Off */}
      <div style={{ background: R.card, borderRadius: 20, marginTop: 16, overflow: "hidden", border: `1px solid ${R.border}` }}>
        <h2 style={{ padding: "12px 16px", fontSize: 20, fontWeight: 800, color: R.text }}>Rooms Popping Off</h2>
        {MOCK_TRENDING_ROOMS.map((item, i) => {
          const room = getRoomById(item.roomId);
          if (!room) return null;
          return (
            <div
              key={i}
              onClick={() => onRoomChange?.(room.id)}
              style={{ padding: "12px 16px", borderBottom: i < MOCK_TRENDING_ROOMS.length - 1 ? `1px solid ${R.border}` : "none", cursor: "pointer", transition: "background 150ms" }}
              onMouseEnter={(e) => e.currentTarget.style.background = "rgba(231,233,234,0.03)"}
              onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                <span style={{ fontSize: 16 }}>{room.emoji}</span>
                <span style={{ color: room.accent, fontWeight: 700, fontSize: 15 }}>{room.name}</span>
              </div>
              <div style={{ color: R.gray, fontSize: 13 }}>{item.postCount} posts vibing</div>
              <div style={{ color: R.gray, fontSize: 13, marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.topPost}</div>
            </div>
          );
        })}
      </div>

      {/* Good Vibes Only */}
      <div style={{ background: R.card, borderRadius: 20, marginTop: 16, overflow: "hidden", border: `1px solid ${R.border}` }}>
        <h2 style={{ padding: "12px 16px", fontSize: 20, fontWeight: 800, color: R.text }}>Good Vibes Only</h2>
        {MOCK_SUGGESTIONS.map((u) => {
          const isFollowed = followedUsers.has(u.username);
          return (
            <div
              key={u.username}
              style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", transition: "background 150ms" }}
              onMouseEnter={(e) => e.currentTarget.style.background = "rgba(231,233,234,0.03)"}
              onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
            >
              <Avatar src={`https://i.pravatar.cc/150?img=${u.avatarImg}`} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, color: R.text, fontSize: 15, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{u.displayName}</div>
                <div style={{ color: R.gray, fontSize: 15 }}>@{u.username}</div>
              </div>
              <button
                onClick={() => toggleFollow(u.username)}
                className={`follow-btn${isFollowed ? " follow-btn-following" : ""}`}
                style={{
                  borderRadius: 9999, padding: "0 16px", height: 32, fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", flexShrink: 0,
                  background: isFollowed ? "transparent" : "#eff3f4", color: isFollowed ? R.text : "#0f1419",
                  border: isFollowed ? `1px solid ${R.border}` : "none",
                }}
              >
                {isFollowed ? "Following" : "Follow"}
              </button>
            </div>
          );
        })}
        <div style={{ padding: "16px", color: accent, fontSize: 15, cursor: "pointer" }}>Show more</div>
      </div>

      {/* Footer */}
      <div style={{ padding: "16px 0", color: R.gray, fontSize: 13, lineHeight: "20px" }}>
        &copy; 2025 Nosta &middot; Terms &middot; Privacy &middot; Cookies
      </div>
    </aside>
  );
}

// ─── Feed View ────────────────────────────────────────────────────────────

function FeedView({ posts: allPosts, user, appUserId, onPostCreated, likedPostIds, repostedPostIds, onToggleLike, onToggleRepost, onDeletePost, onNavigateToProfile, hasMore, onLoadMore, loadingMore, accent = DEFAULT_ACCENT, activeRoom, onRoomChange, customRooms = [] }) {
  const [expandedReplies, setExpandedReplies] = useState(new Set());
  const [repliesCache, setRepliesCache] = useState({});

  const handleToggleReplies = async (postId) => {
    const next = new Set(expandedReplies);
    if (next.has(postId)) {
      next.delete(postId);
    } else {
      next.add(postId);
      if (!repliesCache[postId]) {
        const data = await fetchReplies(postId);
        if (data) setRepliesCache((prev) => ({ ...prev, [postId]: data }));
      }
    }
    setExpandedReplies(next);
  };

  const handleCreateReply = async (postId, content) => {
    if (!appUserId) return;
    await createReply(postId, appUserId, content);
    const data = await fetchReplies(postId);
    if (data) setRepliesCache((prev) => ({ ...prev, [postId]: data }));
    onPostCreated();
  };

  const sorted = [...allPosts].sort((a, b) => b.timestamp - a.timestamp);
  const posts = activeRoom ? sorted.filter((p) => p.room === activeRoom) : sorted;

  const feedRooms = [...ROOMS, ...customRooms];
  const activeRoomData = feedRooms.find((r) => r.id === activeRoom) || null;

  return (
    <div>
      {/* Sticky Header */}
      <div style={{ position: "sticky", top: 0, zIndex: 20, background: "rgba(10,10,10,0.75)", backdropFilter: "blur(12px)", borderBottom: `1px solid ${R.border}` }}>
        <div style={{ display: "flex", alignItems: "center", padding: "12px 16px", gap: 12 }}>
          <span className="desktop-only" style={{ fontSize: 20, fontWeight: 800, color: R.text }}>
            {activeRoomData ? `${activeRoomData.emoji} ${activeRoomData.name}` : "Home"}
          </span>
          {activeRoom && (
            <button onClick={() => onRoomChange?.(null)} style={{ background: "none", border: `1px solid ${R.border}`, color: R.gray, borderRadius: 20, padding: "4px 12px", fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>
              All Rooms
            </button>
          )}
        </div>
        {/* Room pills - mobile */}
        <div className="mobile-room-bar">
          <button className="room-pill" onClick={() => onRoomChange?.(null)} style={{ padding: "4px 12px", borderRadius: 20, fontSize: 13, fontWeight: 600, background: !activeRoom ? `${accent}20` : "transparent", color: !activeRoom ? accent : R.gray, border: `1px solid ${!activeRoom ? accent + "40" : R.border}`, whiteSpace: "nowrap" }}>All</button>
          {feedRooms.map((room) => (
            <button key={room.id} className="room-pill" onClick={() => onRoomChange?.(room.id)} style={{ padding: "4px 12px", borderRadius: 20, fontSize: 13, fontWeight: 600, background: activeRoom === room.id ? `${room.accent}20` : "transparent", color: activeRoom === room.id ? room.accent : R.gray, border: `1px solid ${activeRoom === room.id ? room.accent + "40" : R.border}`, whiteSpace: "nowrap" }}>
              {room.emoji} {room.name}
            </button>
          ))}
        </div>
      </div>

      {/* Compose */}
      <div className="desktop-compose desktop-compose-card">
        <ComposeBox user={user} appUserId={appUserId} onPostCreated={onPostCreated} accent={accent} activeRoom={activeRoom} onRoomChange={onRoomChange} />
      </div>

      {/* Posts */}
      {posts.map((post) => (
        <div key={post.id} className="post-card">
          <Tweet
            post={post}
            appUserId={appUserId}
            accent={accent}
            isLiked={likedPostIds.has(post.id)}
            isReposted={repostedPostIds.has(post.id)}
            onToggleLike={onToggleLike}
            onToggleRepost={onToggleRepost}
            onDeletePost={onDeletePost}
            onNavigateToProfile={onNavigateToProfile}
            onToggleReplies={appUserId ? handleToggleReplies : undefined}
            repliesExpanded={expandedReplies.has(post.id)}
            replies={repliesCache[post.id] || null}
            onCreateReply={handleCreateReply}
          />
        </div>
      ))}

      {/* Load More */}
      {hasMore && onLoadMore && (
        <div style={{ padding: 20, textAlign: "center" }}>
          <button
            onClick={onLoadMore}
            disabled={loadingMore}
            className="post-btn-main"
            style={{ background: "transparent", color: accent, border: `1px solid ${R.border}`, borderRadius: 9999, padding: "12px 24px", fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", opacity: loadingMore ? 0.5 : 1 }}
          >
            {loadingMore ? "Loading..." : "Show more"}
          </button>
        </div>
      )}

      {posts.length === 0 && (
        <div style={{ padding: 40, textAlign: "center", color: R.gray, fontSize: 15 }}>
          No posts yet. Be the first to post!
        </div>
      )}
    </div>
  );
}

// ─── Music Player ─────────────────────────────────────────────────────────

function MusicPlayer({ playlist, isOwnProfile, onAddTrack, onRemoveTrack, onReorderTrack, accent = DEFAULT_ACCENT }) {
  const [playing, setPlaying] = useState(false);
  const [trackIndex, setTrackIndex] = useState(0);
  const [editing, setEditing] = useState(false);
  const [addTitle, setAddTitle] = useState("");
  const [addArtist, setAddArtist] = useState("");
  const [saving, setSaving] = useState(false);
  const track = playlist[trackIndex];

  const prev = () => setTrackIndex((i) => (i - 1 + playlist.length) % playlist.length);
  const next = () => setTrackIndex((i) => (i + 1) % playlist.length);

  useEffect(() => {
    if (trackIndex >= playlist.length && playlist.length > 0) setTrackIndex(playlist.length - 1);
  }, [playlist.length, trackIndex]);

  const handleAdd = async () => {
    const t = addTitle.trim(), a = addArtist.trim();
    if (!t || !a || !onAddTrack) return;
    setSaving(true); await onAddTrack(t, a); setAddTitle(""); setAddArtist(""); setSaving(false);
  };

  if (!playlist.length && !editing) {
    return (
      <div style={{ background: R.card, borderRadius: 20, padding: 20, textAlign: "center" }}>
        <Music size={24} style={{ color: R.gray, marginBottom: 8 }} />
        <div style={{ color: R.gray, fontSize: 14 }}>No tracks yet</div>
        {isOwnProfile && onAddTrack && (
          <button onClick={() => setEditing(true)} style={{ marginTop: 12, background: "transparent", border: `1px solid ${R.border}`, color: accent, borderRadius: 9999, padding: "6px 16px", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
            Add Tracks
          </button>
        )}
      </div>
    );
  }

  return (
    <div style={{ background: R.card, borderRadius: 20, padding: 16 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Music size={16} style={{ color: accent }} />
          <span style={{ fontSize: 15, fontWeight: 700, color: R.text }}>{editing ? "Edit Playlist" : "Now Playing"}</span>
        </div>
        {isOwnProfile && onAddTrack && (
          <button onClick={() => setEditing(!editing)} style={{ background: "transparent", border: `1px solid ${R.border}`, color: R.text, borderRadius: 9999, padding: "4px 12px", fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>
            {editing ? "Done" : "Edit"}
          </button>
        )}
      </div>
      {editing ? (
        <div>
          {playlist.map((item) => (
            <div key={item.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 0", borderBottom: `1px solid ${R.border}` }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <button onClick={() => { setSaving(true); onReorderTrack?.(item.id, item.position - 1).then(() => setSaving(false)); }} disabled={saving || item.position <= 1} style={{ background: "none", border: "none", color: R.gray, cursor: "pointer", padding: 0, opacity: item.position <= 1 ? 0.3 : 1 }}><ChevronUp size={14} /></button>
                <button onClick={() => { setSaving(true); onReorderTrack?.(item.id, item.position + 1).then(() => setSaving(false)); }} disabled={saving || item.position >= playlist.length} style={{ background: "none", border: "none", color: R.gray, cursor: "pointer", padding: 0, opacity: item.position >= playlist.length ? 0.3 : 1 }}><ChevronDown size={14} /></button>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ color: R.text, fontSize: 14, fontWeight: 700 }}>{item.title}</div>
                <div style={{ color: R.gray, fontSize: 13 }}>{item.artist}</div>
              </div>
              <button onClick={() => { setSaving(true); onRemoveTrack?.(item.id).then(() => setSaving(false)); }} disabled={saving} style={{ background: "none", border: "none", color: R.gray, cursor: "pointer", padding: 4 }}><Trash2 size={14} /></button>
            </div>
          ))}
          <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 8 }}>
            <input value={addTitle} onChange={(e) => setAddTitle(e.target.value)} placeholder="Song title" maxLength={100} style={{ background: R.search, border: `1px solid ${R.border}`, borderRadius: 8, padding: "8px 12px", color: R.text, fontSize: 14, fontFamily: "inherit" }} />
            <input value={addArtist} onChange={(e) => setAddArtist(e.target.value)} placeholder="Artist" maxLength={100} onKeyDown={(e) => { if (e.key === "Enter") handleAdd(); }} style={{ background: R.search, border: `1px solid ${R.border}`, borderRadius: 8, padding: "8px 12px", color: R.text, fontSize: 14, fontFamily: "inherit" }} />
            <button onClick={handleAdd} disabled={saving || !addTitle.trim() || !addArtist.trim()} className="post-btn-main" style={{ background: accent, color: "#fff", border: "none", borderRadius: 9999, padding: "8px 16px", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", opacity: saving || !addTitle.trim() || !addArtist.trim() ? 0.5 : 1 }}>
              Add
            </button>
          </div>
        </div>
      ) : track ? (
        <div>
          <div style={{ marginBottom: 12 }}>
            <div style={{ color: R.text, fontSize: 15, fontWeight: 700 }}>{track.title}</div>
            <div style={{ color: R.gray, fontSize: 14 }}>{track.artist}</div>
          </div>
          <div style={{ width: "100%", height: 4, background: R.border, borderRadius: 2, marginBottom: 12, overflow: "hidden" }}>
            <motion.div style={{ height: "100%", background: accent, borderRadius: 2 }} animate={{ width: playing ? "100%" : "0%" }} transition={playing ? { duration: 30, ease: "linear" } : { duration: 0.2 }} />
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 16 }}>
            <button onClick={prev} style={{ background: "none", border: "none", color: R.text, cursor: "pointer", padding: 8 }}><SkipBack size={18} /></button>
            <button onClick={() => setPlaying(!playing)} style={{ background: accent, border: "none", color: "#fff", cursor: "pointer", padding: 10, borderRadius: "50%", display: "flex" }}>{playing ? <Pause size={18} /> : <Play size={18} />}</button>
            <button onClick={next} style={{ background: "none", border: "none", color: R.text, cursor: "pointer", padding: 8 }}><SkipForward size={18} /></button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

// ─── Top 8 ────────────────────────────────────────────────────────────────

function Top8({ top8, isOwnProfile, onRemoveFromTop8, onNavigateToProfile, accent = DEFAULT_ACCENT }) {
  const [editing, setEditing] = useState(false);

  return (
    <div style={{ background: R.card, borderRadius: 20, padding: 16 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Star size={16} style={{ color: accent }} />
          <span style={{ fontSize: 15, fontWeight: 700, color: R.text }}>Top 8</span>
        </div>
        {isOwnProfile && top8.length > 0 && (
          <button onClick={() => setEditing(!editing)} style={{ background: "transparent", border: `1px solid ${R.border}`, color: R.text, borderRadius: 9999, padding: "4px 12px", fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>
            {editing ? "Done" : "Edit"}
          </button>
        )}
      </div>
      {top8.length === 0 ? (
        <div style={{ textAlign: "center", padding: 20, color: R.gray, fontSize: 14 }}>
          <Users size={24} style={{ color: R.gray, marginBottom: 8 }} />
          <div>No friends yet</div>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
          {top8.map((item) => (
            <div
              key={item.id}
              onClick={() => { editing && onRemoveFromTop8 && item.userId ? onRemoveFromTop8(item.userId) : onNavigateToProfile?.(item.userId); }}
              style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, cursor: "pointer", position: "relative" }}
            >
              <div style={{ width: "100%", aspectRatio: "1", background: R.search, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden" }}>
                <User size={20} style={{ color: R.gray }} />
                {editing && (
                  <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <X size={16} style={{ color: R.pink }} />
                  </div>
                )}
              </div>
              <span style={{ fontSize: 11, color: R.gray, textAlign: "center", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", width: "100%" }}>
                {item.label}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Profile View ─────────────────────────────────────────────────────────

function ProfileView({ user, posts, top8, playlist, appUserId, viewedUserId, onUserUpdated, isOwnProfile, isFollowing, isInMyTop8, onFollowToggle, onAddToTop8, onRemoveFromTop8, onNavigateToProfile, onBack, onAddTrack, onRemoveTrack, onReorderTrack, onSendMessage, onAvatarUpload, likedPostIds, repostedPostIds, onToggleLike, onToggleRepost, onDeletePost, accent = DEFAULT_ACCENT, userStatus, onUpdateStatus, onUpdateInterests, onUpdateProfileEmoji }) {
  const [editingBio, setEditingBio] = useState(false);
  const [editBioText, setEditBioText] = useState("");
  const [editingInterests, setEditingInterests] = useState(false);
  const [editInterestsText, setEditInterestsText] = useState("");
  const [avatarUploading, setAvatarUploading] = useState(false);
  const avatarInputRef = useRef(null);
  const [expandedReplies, setExpandedReplies] = useState(new Set());
  const [repliesCache, setRepliesCache] = useState({});
  const [statusText, setStatusText] = useState("");
  const [statusEmoji, setStatusEmoji] = useState("💭");
  const [statusSaving, setStatusSaving] = useState(false);
  const [showAvatarMenu, setShowAvatarMenu] = useState(false);
  const [showAvatarLightbox, setShowAvatarLightbox] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const handleToggleReplies = async (postId) => {
    const next = new Set(expandedReplies);
    if (next.has(postId)) { next.delete(postId); } else {
      next.add(postId);
      if (!repliesCache[postId]) { const data = await fetchReplies(postId); if (data) setRepliesCache((prev) => ({ ...prev, [postId]: data })); }
    }
    setExpandedReplies(next);
  };

  const handleCreateReply = async (postId, content) => {
    if (!appUserId) return;
    await createReply(postId, appUserId, content);
    const data = await fetchReplies(postId);
    if (data) setRepliesCache((prev) => ({ ...prev, [postId]: data }));
  };

  const handleAvatarClick = () => {
    if (user?.avatar || (isOwnProfile && onAvatarUpload)) setShowAvatarMenu(true);
  };

  const handleSaveBio = async () => {
    if (!appUserId) return;
    await updateUserProfile(appUserId, { displayName: user.displayName, bio: editBioText.trim(), avatarUrl: user.avatar || null });
    setEditingBio(false);
    onUserUpdated();
  };

  const handleSaveInterests = async () => {
    if (!onUpdateInterests) return;
    await onUpdateInterests(editInterestsText.trim());
    setEditingInterests(false);
  };

  const handleSetStatus = async () => {
    if (!statusText.trim() || !onUpdateStatus) return;
    setStatusSaving(true);
    await onUpdateStatus(statusText.trim(), statusEmoji);
    setStatusText("");
    setStatusSaving(false);
  };

  const pillStyle = { background: R.search, border: `1px solid #2a2a2a`, borderRadius: 20, padding: "16px 20px", width: 200, minHeight: 80, display: "flex", flexDirection: "column", justifyContent: "center", position: "relative", cursor: "default" };

  return (
    <div>
      {/* Sticky Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "8px 16px", position: "sticky", top: 0, zIndex: 20, background: "rgba(10,10,10,0.75)", backdropFilter: "blur(12px)", borderBottom: `1px solid ${R.border}` }}>
        {onBack && (
          <button onClick={onBack} style={{ background: "none", border: "none", color: R.text, cursor: "pointer", padding: 8, borderRadius: "50%", display: "flex", flexShrink: 0 }} className="nav-item-hover">
            <ArrowLeft size={20} />
          </button>
        )}
        <div>
          <div style={{ fontWeight: 800, fontSize: 20, color: R.text }}>{user?.displayName || "Profile"}</div>
          <div style={{ color: R.gray, fontSize: 13 }}>{posts.length} posts</div>
        </div>
      </div>

      {/* ═══ Profile Header Card ═══ */}
      <div className="profile-header-card">
        {/* Three-item row: Bio | Pic | Interests */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 24 }}>
          {/* Bio pill */}
          <div
            onClick={isOwnProfile && appUserId ? () => { setEditBioText(user?.bio || ""); setEditingBio(true); } : undefined}
            style={{ ...pillStyle, cursor: isOwnProfile && appUserId ? "pointer" : "default" }}
          >
            {isOwnProfile && appUserId && (
              <Pencil size={14} style={{ color: "#555", position: "absolute", top: 10, right: 10 }} />
            )}
            <div style={{ fontSize: 12, fontWeight: 700, color: R.gray, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>Bio</div>
            <div style={{ fontSize: 14, color: "#ccc", lineHeight: "18px", overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", textAlign: "center" }}>
              {user?.bio || (isOwnProfile ? "Add bio..." : "—")}
            </div>
          </div>

          {/* Center: Avatar + Identity */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, flexShrink: 0 }}>
            <div style={{ position: "relative", cursor: (user?.avatar || (isOwnProfile && onAvatarUpload)) ? "pointer" : "default" }} onClick={handleAvatarClick}>
              <div style={{ width: 110, height: 110, borderRadius: 14, border: "2px solid #2a2a2a", overflow: "hidden", background: R.search, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 16px rgba(0,0,0,0.4)" }}>
                {user?.avatar ? (
                  <img src={user.avatar} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  <User size={48} style={{ color: R.gray }} />
                )}
              </div>
              {avatarUploading && (
                <div style={{ position: "absolute", inset: 0, borderRadius: 14, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Loader2 size={24} style={{ color: "#fff" }} />
                </div>
              )}
              <input ref={avatarInputRef} type="file" accept="image/jpeg,image/png,image/gif,image/webp" style={{ display: "none" }} onChange={async (e) => {
                const file = e.target.files?.[0]; if (!file) return;
                setAvatarUploading(true); await onAvatarUpload(file); setAvatarUploading(false);
              }} />
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: R.text, display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
                {user?.displayName}
                {user?.profileEmoji && <span style={{ fontSize: 18 }}>{user.profileEmoji}</span>}
                {isOwnProfile && onUpdateProfileEmoji && (
                  <span onClick={(e) => { e.stopPropagation(); setShowEmojiPicker(!showEmojiPicker); }} style={{ cursor: "pointer", fontSize: 13, opacity: 0.5, marginLeft: 2 }} title="Change badge emoji">
                    <Pencil size={13} />
                  </span>
                )}
              </div>
              <div style={{ color: R.gray, fontSize: 15, marginTop: 2 }}>@{user?.name}</div>
              {/* Emoji picker */}
              {showEmojiPicker && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 4, justifyContent: "center", marginTop: 8, background: R.search, border: `1px solid #2a2a2a`, borderRadius: 12, padding: 8, maxWidth: 220 }}>
                  {PROFILE_EMOJIS.map((e) => (
                    <button
                      key={e || "none"}
                      onClick={async () => { setShowEmojiPicker(false); await onUpdateProfileEmoji(e); }}
                      style={{ width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", background: user?.profileEmoji === e ? `${accent}30` : "transparent", border: user?.profileEmoji === e ? `1px solid ${accent}` : "1px solid transparent", borderRadius: 8, cursor: "pointer", fontSize: 16 }}
                    >
                      {e || <X size={14} style={{ color: R.gray }} />}
                    </button>
                  ))}
                </div>
              )}
            </div>
            {/* Action button */}
            {isOwnProfile ? (
              <button onClick={appUserId ? () => { setEditBioText(user?.bio || ""); setEditingBio(true); } : undefined} style={{ background: R.search, border: `1px solid #2a2a2a`, color: R.text, borderRadius: 9999, padding: "6px 20px", fontSize: 13, fontWeight: 600, cursor: appUserId ? "pointer" : "default", fontFamily: "inherit" }}>
                Edit Profile
              </button>
            ) : (
              <div style={{ display: "flex", gap: 8 }}>
                {onFollowToggle && appUserId && (
                  <button
                    onClick={onFollowToggle}
                    className={`follow-btn${isFollowing ? " follow-btn-following" : ""}`}
                    style={{ borderRadius: 9999, padding: "6px 20px", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", background: isFollowing ? "transparent" : accent, color: isFollowing ? R.text : "#fff", border: isFollowing ? `1px solid ${R.border}` : "none" }}
                  >
                    {isFollowing ? "Following" : "Follow"}
                  </button>
                )}
                {onSendMessage && appUserId && (
                  <button onClick={() => onSendMessage(viewedUserId)} style={{ background: "transparent", border: `1px solid ${R.border}`, color: R.text, borderRadius: "50%", width: 34, height: 34, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                    <Mail size={16} />
                  </button>
                )}
                {isFollowing && !isInMyTop8 && onAddToTop8 && (
                  <button onClick={onAddToTop8} style={{ background: "transparent", border: `1px solid ${R.border}`, color: R.text, borderRadius: 9999, padding: "6px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 4 }}>
                    <Star size={12} /> Top 8
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Interests pill */}
          <div
            onClick={isOwnProfile && onUpdateInterests ? () => { setEditInterestsText(user?.interests || ""); setEditingInterests(true); } : undefined}
            style={{ ...pillStyle, cursor: isOwnProfile && onUpdateInterests ? "pointer" : "default" }}
          >
            {isOwnProfile && onUpdateInterests && (
              <Pencil size={14} style={{ color: "#555", position: "absolute", top: 10, right: 10 }} />
            )}
            <div style={{ fontSize: 12, fontWeight: 700, color: R.gray, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>Interests</div>
            <div style={{ fontSize: 14, color: "#ccc", lineHeight: "18px", overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", textAlign: "center" }}>
              {user?.interests || (isOwnProfile ? "Add interests..." : "—")}
            </div>
          </div>
        </div>

        {/* Stats row */}
        <div style={{ borderTop: `1px solid ${R.border}`, marginTop: 20, paddingTop: 16, display: "flex", justifyContent: "center", gap: 24, fontSize: 14 }}>
          <span><strong style={{ color: R.text, fontWeight: 800 }}>{formatCount(user?.following || 0)}</strong> <span style={{ color: R.gray }}>Following</span></span>
          <span style={{ color: R.gray }}>·</span>
          <span><strong style={{ color: R.text, fontWeight: 800 }}>{formatCount(user?.followers || 0)}</strong> <span style={{ color: R.gray }}>Followers</span></span>
          <span style={{ color: R.gray }}>·</span>
          <span><strong style={{ color: R.text, fontWeight: 800 }}>{posts.length}</strong> <span style={{ color: R.gray }}>Posts</span></span>
        </div>
      </div>

      {/* Bio edit modal */}
      <AnimatePresence>
        {editingBio && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.6)" }} onClick={() => setEditingBio(false)} />
            <div style={{ position: "relative", background: R.card, borderRadius: 20, padding: 24, width: 400, maxWidth: "90vw", border: `1px solid ${R.border}` }}>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: R.text, marginBottom: 16 }}>Edit Bio</h3>
              <textarea value={editBioText} onChange={(e) => setEditBioText(e.target.value)} rows={4} maxLength={160} placeholder="Tell the world about yourself..." style={{ width: "100%", background: R.search, border: `1px solid ${R.border}`, borderRadius: 12, padding: "12px 14px", color: R.text, fontSize: 15, fontFamily: "inherit", resize: "none" }} />
              <div style={{ textAlign: "right", fontSize: 12, color: editBioText.length > 140 ? R.pink : R.gray, marginTop: 4 }}>{editBioText.length}/160</div>
              <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 16 }}>
                <button onClick={() => setEditingBio(false)} style={{ background: "transparent", border: `1px solid ${R.border}`, color: R.text, borderRadius: 9999, padding: "8px 20px", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>Cancel</button>
                <button onClick={handleSaveBio} className="post-btn-main" style={{ background: accent, color: "#fff", border: "none", borderRadius: 9999, padding: "8px 20px", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>Save</button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Interests edit modal */}
      <AnimatePresence>
        {editingInterests && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.6)" }} onClick={() => setEditingInterests(false)} />
            <div style={{ position: "relative", background: R.card, borderRadius: 20, padding: 24, width: 400, maxWidth: "90vw", border: `1px solid ${R.border}` }}>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: R.text, marginBottom: 16 }}>Edit Interests</h3>
              <textarea value={editInterestsText} onChange={(e) => setEditInterestsText(e.target.value)} rows={3} maxLength={200} placeholder="music, coding, art, coffee..." style={{ width: "100%", background: R.search, border: `1px solid ${R.border}`, borderRadius: 12, padding: "12px 14px", color: R.text, fontSize: 15, fontFamily: "inherit", resize: "none" }} />
              <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 16 }}>
                <button onClick={() => setEditingInterests(false)} style={{ background: "transparent", border: `1px solid ${R.border}`, color: R.text, borderRadius: 9999, padding: "8px 20px", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>Cancel</button>
                <button onClick={handleSaveInterests} className="post-btn-main" style={{ background: accent, color: "#fff", border: "none", borderRadius: 9999, padding: "8px 20px", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>Save</button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Avatar menu */}
      <AnimatePresence>
        {showAvatarMenu && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.6)" }} onClick={() => setShowAvatarMenu(false)} />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} style={{ position: "relative", background: R.card, borderRadius: 20, padding: 8, width: 220, border: `1px solid ${R.border}` }}>
              {user?.avatar && (
                <button onClick={() => { setShowAvatarMenu(false); setShowAvatarLightbox(true); }} style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", background: "none", border: "none", color: R.text, cursor: "pointer", fontFamily: "inherit", fontSize: 15, borderRadius: 12 }} className="nav-item-hover">
                  <User size={18} style={{ color: R.gray }} /> View Photo
                </button>
              )}
              {isOwnProfile && onAvatarUpload && (
                <button onClick={() => { setShowAvatarMenu(false); avatarInputRef.current?.click(); }} style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", background: "none", border: "none", color: R.text, cursor: "pointer", fontFamily: "inherit", fontSize: 15, borderRadius: 12 }} className="nav-item-hover">
                  <ImagePlus size={18} style={{ color: R.gray }} /> {user?.avatar ? "Change Photo" : "Add Photo"}
                </button>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Avatar lightbox */}
      <AnimatePresence>
        {showAvatarLightbox && user?.avatar && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowAvatarLightbox(false)} style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.85)", cursor: "pointer" }}>
            <button onClick={() => setShowAvatarLightbox(false)} style={{ position: "absolute", top: 16, right: 16, background: "none", border: "none", color: "#fff", cursor: "pointer", padding: 8 }}>
              <X size={24} />
            </button>
            <motion.img initial={{ scale: 0.8 }} animate={{ scale: 1 }} exit={{ scale: 0.8 }} src={user.avatar} alt="" style={{ maxWidth: "80vw", maxHeight: "80vh", borderRadius: 16, objectFit: "contain" }} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ Friends Card ═══ */}
      <div className="profile-section-card">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontWeight: 700, color: R.text, fontSize: 16 }}>Friends</span>
            <span style={{ color: R.gray, fontSize: 14 }}>{top8.length}</span>
          </div>
          {top8.length > 0 && <span style={{ color: accent, fontSize: 14, cursor: "pointer" }}>See all</span>}
        </div>
        {top8.length === 0 ? (
          <div style={{ textAlign: "center", padding: 16, color: R.gray, fontSize: 14 }}>
            <Users size={24} style={{ color: R.gray, marginBottom: 8 }} />
            <div>No friends yet</div>
          </div>
        ) : (
          <div style={{ display: "flex", gap: 16, overflow: "hidden" }}>
            {top8.slice(0, 8).map((friend) => (
              <div
                key={friend.id}
                onClick={() => onNavigateToProfile?.(friend.userId)}
                style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, cursor: "pointer", flexShrink: 0 }}
              >
                <div style={{ width: 64, height: 64, borderRadius: 10, border: `1px solid #2a2a2a`, background: R.search, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", transition: "filter 150ms ease" }}
                  onMouseEnter={(e) => e.currentTarget.style.filter = "brightness(1.2)"}
                  onMouseLeave={(e) => e.currentTarget.style.filter = "brightness(1)"}
                >
                  <User size={24} style={{ color: R.gray }} />
                </div>
                <span style={{ fontSize: 12, color: "#aaa", maxWidth: 64, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", textAlign: "center", transition: "color 150ms ease" }}
                  onMouseEnter={(e) => e.currentTarget.style.color = "#fff"}
                  onMouseLeave={(e) => e.currentTarget.style.color = "#aaa"}
                >
                  {friend.label}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ═══ Status Section ═══ */}
      {/* Status compose (own profile only) */}
      {isOwnProfile && onUpdateStatus && (
        <div className="profile-section-card">
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <select
              value={statusEmoji}
              onChange={(e) => setStatusEmoji(e.target.value)}
              style={{ background: R.search, border: `1px solid #2a2a2a`, borderRadius: 12, padding: "8px", fontSize: 18, color: R.text, cursor: "pointer", fontFamily: "inherit" }}
            >
              {MOOD_EMOJIS.map((e) => <option key={e} value={e}>{e}</option>)}
            </select>
            <input
              value={statusText}
              onChange={(e) => setStatusText(e.target.value)}
              placeholder="What's your status?"
              maxLength={100}
              onKeyDown={(e) => { if (e.key === "Enter") handleSetStatus(); }}
              style={{ flex: 1, background: R.search, border: `1px solid #2a2a2a`, borderRadius: 9999, padding: "10px 20px", color: R.text, fontSize: 15, fontFamily: "inherit" }}
            />
            <button
              onClick={handleSetStatus}
              disabled={statusSaving || !statusText.trim()}
              className="post-btn-main"
              style={{ background: accent, color: "#fff", border: "none", borderRadius: 9999, padding: "0 20px", height: 38, fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", opacity: statusSaving || !statusText.trim() ? 0.5 : 1, flexShrink: 0 }}
            >
              Set
            </button>
          </div>
        </div>
      )}

      {/* Current/recent status cards */}
      {userStatus && (
        <div className="profile-status-card">
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
            <span style={{ fontSize: 12, color: R.gray, textTransform: "uppercase", letterSpacing: 0.5 }}>Status</span>
            <span style={{ fontSize: 12, color: R.gray }}>{timeAgo(userStatus.timestamp)}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 20 }}>{userStatus.emoji}</span>
            <span style={{ color: R.text, fontSize: 15 }}>{userStatus.content}</span>
          </div>
        </div>
      )}

      {/* ═══ Music Card ═══ */}
      {playlist.length > 0 && (
        <div className="profile-section-card">
          <MusicPlayer playlist={playlist} isOwnProfile={isOwnProfile} onAddTrack={onAddTrack} onRemoveTrack={onRemoveTrack} onReorderTrack={onReorderTrack} accent={accent} />
        </div>
      )}

      {/* ═══ Posts Section ═══ */}
      <div style={{ padding: "12px 12px 0", display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: R.gray, textTransform: "uppercase", letterSpacing: 0.5 }}>Posts</span>
        <span style={{ fontSize: 12, color: R.gray }}>{posts.length}</span>
      </div>
      {posts.length === 0 ? (
        <div style={{ padding: 60, textAlign: "center" }}>
          <div style={{ fontSize: 24, fontWeight: 800, color: R.text, marginBottom: 8 }}>
            {isOwnProfile ? "You haven't posted yet" : "No posts yet"}
          </div>
          <div style={{ color: R.gray, fontSize: 15 }}>
            {isOwnProfile ? "When you post, it'll show up here." : "When @" + user?.name + " posts, it'll show up here."}
          </div>
        </div>
      ) : (
        posts.map((post) => (
          <div key={post.id} className="post-card">
            <Tweet
              post={post}
              appUserId={appUserId}
              accent={accent}
              isLiked={likedPostIds?.has(post.id)}
              isReposted={repostedPostIds?.has(post.id)}
              onToggleLike={onToggleLike}
              onToggleRepost={onToggleRepost}
              onDeletePost={onDeletePost}
              onNavigateToProfile={onNavigateToProfile}
              onToggleReplies={appUserId ? handleToggleReplies : undefined}
              repliesExpanded={expandedReplies.has(post.id)}
              replies={repliesCache[post.id] || null}
              onCreateReply={handleCreateReply}
            />
          </div>
        ))
      )}
    </div>
  );
}

// ─── Search / Explore View ────────────────────────────────────────────────

function SearchView({ onNavigateToProfile, accent = DEFAULT_ACCENT }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const debounceRef = useRef(null);

  useEffect(() => {
    if (!query.trim()) { setResults([]); setHasSearched(false); return; }
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      const data = await searchUsers(query);
      setResults(data);
      setSearching(false);
      setHasSearched(true);
    }, 300);
    return () => clearTimeout(debounceRef.current);
  }, [query]);

  return (
    <div>
      <div style={{ position: "sticky", top: 0, zIndex: 20, background: "rgba(10,10,10,0.75)", backdropFilter: "blur(12px)", borderBottom: `1px solid ${R.border}`, padding: "12px 16px" }}>
        <div style={{ position: "relative" }}>
          <Search size={18} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: R.gray }} />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search users..."
            autoFocus
            className="search-input"
            style={{ width: "100%", height: 44, borderRadius: 9999, background: R.search, border: `1px solid ${R.border}`, padding: "0 16px 0 44px", color: R.text, fontSize: 15, fontFamily: "inherit" }}
          />
          {query && (
            <button onClick={() => setQuery("")} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: R.gray, cursor: "pointer", padding: 4, display: "flex" }}>
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {!query.trim() && (
        <div style={{ padding: 40, textAlign: "center", color: R.gray }}>
          <Search size={32} style={{ marginBottom: 12, color: R.gray }} />
          <div style={{ fontSize: 15 }}>Search for people by name or username</div>
        </div>
      )}

      {searching && (
        <div style={{ padding: 20, textAlign: "center", color: R.gray, fontSize: 14 }}>Searching...</div>
      )}

      {!searching && hasSearched && results.length === 0 && (
        <div style={{ padding: 40, textAlign: "center", color: R.gray }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: R.text, marginBottom: 6 }}>No results</div>
          <div style={{ fontSize: 14 }}>No users found for "{query}"</div>
        </div>
      )}

      {results.map((u) => (
        <div
          key={u.id}
          onClick={() => onNavigateToProfile(u.id)}
          className="tweet-hover"
          style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", cursor: "pointer", borderBottom: `1px solid ${R.border}` }}
        >
          <Avatar src={u.avatar} size={48} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 700, color: R.text, fontSize: 15 }}>{u.displayName} {u.profileEmoji && <span style={{ fontSize: 13 }}>{u.profileEmoji}</span>}</div>
            <div style={{ color: R.gray, fontSize: 14 }}>@{u.username}</div>
          </div>
          <ArrowLeft size={16} style={{ color: R.gray, transform: "rotate(180deg)", flexShrink: 0 }} />
        </div>
      ))}
    </div>
  );
}

// ─── Notifications View ───────────────────────────────────────────────────

function NotificationsView({ notifications, onNavigateToProfile, onMarkAllRead, appUserId, accent = DEFAULT_ACCENT }) {
  const typeLabels = { like: "liked your post", reply: "replied to your post", follow: "started following you", repost: "reposted your post", message: "sent you a message" };
  const typeIcons = { like: <Heart size={18} style={{ color: R.pink }} />, reply: <MessageCircle size={18} style={{ color: accent }} />, follow: <User size={18} style={{ color: accent }} />, repost: <Repeat2 size={18} style={{ color: R.green }} />, message: <Mail size={18} style={{ color: accent }} /> };
  const [followedBack, setFollowedBack] = useState(new Set());
  const [loadingFollow, setLoadingFollow] = useState(new Set());

  const handleFollowBack = async (e, actorId) => {
    e.stopPropagation();
    if (!appUserId || !actorId || loadingFollow.has(actorId)) return;
    setLoadingFollow((prev) => new Set(prev).add(actorId));
    await followUser(appUserId, actorId);
    setFollowedBack((prev) => new Set(prev).add(actorId));
    setLoadingFollow((prev) => { const next = new Set(prev); next.delete(actorId); return next; });
  };

  return (
    <div>
      <div style={{ padding: "12px 16px", position: "sticky", top: 0, zIndex: 20, background: "rgba(10,10,10,0.75)", backdropFilter: "blur(12px)", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: `1px solid ${R.border}` }}>
        <h2 style={{ fontSize: 20, fontWeight: 800, color: R.text }}>Notifications</h2>
        {onMarkAllRead && (
          <button onClick={onMarkAllRead} style={{ background: "none", border: "none", color: accent, fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}>Mark all read</button>
        )}
      </div>
      {(!notifications || notifications.length === 0) ? (
        <div style={{ padding: 40, textAlign: "center", color: R.gray, fontSize: 15 }}>
          <Bell size={32} style={{ color: R.gray, marginBottom: 12 }} />
          <div>Nothing here yet</div>
          <div style={{ fontSize: 13, marginTop: 4 }}>When someone interacts with you, you'll see it here.</div>
        </div>
      ) : (
        notifications.map((n) => (
          <div key={n.id} className="notification-card">
            <div
              onClick={() => n.actorId && onNavigateToProfile(n.actorId)}
              className="tweet-hover"
              style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "16px", cursor: "pointer", opacity: n.read ? 0.6 : 1 }}
            >
              <div style={{ flexShrink: 0, marginTop: 2 }}>{typeIcons[n.type] || <Bell size={18} style={{ color: accent }} />}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <span style={{ fontWeight: 700, color: R.text }}>@{n.actorName}</span>{" "}
                <span style={{ color: R.gray }}>{typeLabels[n.type] || n.type}</span>
                <div style={{ color: R.gray, fontSize: 13, marginTop: 4 }}>{timeAgo(n.timestamp)}</div>
              </div>
              {n.type === "follow" && appUserId && n.actorId && !followedBack.has(n.actorId) && (
                <button
                  onClick={(e) => handleFollowBack(e, n.actorId)}
                  disabled={loadingFollow.has(n.actorId)}
                  style={{ marginLeft: "auto", background: accent, color: "#fff", border: "none", borderRadius: 9999, padding: "6px 16px", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", flexShrink: 0, opacity: loadingFollow.has(n.actorId) ? 0.5 : 1 }}
                >
                  Follow back
                </button>
              )}
              {n.type === "follow" && followedBack.has(n.actorId) && (
                <span style={{ marginLeft: "auto", color: R.gray, fontSize: 13, flexShrink: 0 }}>Following</span>
              )}
              {!n.read && n.type !== "follow" && <div style={{ marginLeft: "auto", width: 8, height: 8, borderRadius: "50%", background: accent, flexShrink: 0, marginTop: 8 }} />}
            </div>
          </div>
        ))
      )}
    </div>
  );
}

// ─── Messages View ────────────────────────────────────────────────────────

function MessagesView({ appUserId, onNavigateToProfile, accent = DEFAULT_ACCENT, initialConvoId, onClearInitialConvo }) {
  const [conversations, setConversations] = useState([]);
  const [activeConvoId, setActiveConvoId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);
  const pollRef = useRef(null);

  // New group creation state
  const [showNewGroup, setShowNewGroup] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [groupSearchQuery, setGroupSearchQuery] = useState("");
  const [groupSearchResults, setGroupSearchResults] = useState([]);
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [creatingGroup, setCreatingGroup] = useState(false);
  const groupDebounceRef = useRef(null);

  useEffect(() => {
    if (!appUserId) return;
    (async () => {
      const data = await fetchConversations(appUserId);
      if (data) setConversations(data);
      setLoading(false);
      if (initialConvoId) { setActiveConvoId(initialConvoId); onClearInitialConvo?.(); }
    })();
  }, [appUserId, initialConvoId]);

  useEffect(() => {
    if (!activeConvoId) { setMessages([]); return; }
    let cancelled = false;
    const load = async () => { const data = await fetchMessages(activeConvoId); if (!cancelled && data) setMessages(data); };
    load();
    pollRef.current = setInterval(load, 5000);
    return () => { cancelled = true; clearInterval(pollRef.current); };
  }, [activeConvoId]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  // Group member search
  useEffect(() => {
    if (!groupSearchQuery.trim()) { setGroupSearchResults([]); return; }
    clearTimeout(groupDebounceRef.current);
    groupDebounceRef.current = setTimeout(async () => {
      const data = await searchUsers(groupSearchQuery);
      setGroupSearchResults(data.filter((u) => u.id !== appUserId && !selectedMembers.some((m) => m.id === u.id)));
    }, 300);
    return () => clearTimeout(groupDebounceRef.current);
  }, [groupSearchQuery, appUserId, selectedMembers]);

  const handleSend = async () => {
    const text = messageText.trim();
    if (!text || !activeConvoId || !appUserId) return;
    setSending(true);
    await sendMessage(activeConvoId, appUserId, text);
    setMessageText("");
    const data = await fetchMessages(activeConvoId);
    if (data) setMessages(data);
    const convos = await fetchConversations(appUserId);
    if (convos) setConversations(convos);
    setSending(false);
  };

  const handleCreateGroup = async () => {
    if (!appUserId || selectedMembers.length < 1) return;
    setCreatingGroup(true);
    const convoId = await createGroupConversation(appUserId, selectedMembers.map((m) => m.id), groupName.trim() || undefined);
    if (convoId) {
      const convos = await fetchConversations(appUserId);
      if (convos) setConversations(convos);
      setActiveConvoId(convoId);
    }
    setShowNewGroup(false);
    setGroupName("");
    setSelectedMembers([]);
    setGroupSearchQuery("");
    setCreatingGroup(false);
  };

  const addMember = (user) => {
    setSelectedMembers((prev) => [...prev, user]);
    setGroupSearchQuery("");
    setGroupSearchResults([]);
  };

  const removeMember = (userId) => {
    setSelectedMembers((prev) => prev.filter((m) => m.id !== userId));
  };

  const activeConvo = conversations.find((c) => c.id === activeConvoId);

  if (!appUserId) {
    return (
      <div style={{ padding: 40, textAlign: "center", color: R.gray }}>
        <Mail size={32} style={{ marginBottom: 12 }} />
        <div style={{ fontSize: 15 }}>Sign in to message</div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", height: "calc(100vh - 53px)" }}>
      {/* Conversation List */}
      <div style={{ width: "40%", borderRight: `1px solid ${R.border}`, display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "12px 16px", borderBottom: `1px solid ${R.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: R.text }}>Messages</h2>
          <button
            onClick={() => setShowNewGroup(!showNewGroup)}
            style={{ background: "none", border: `1px solid ${R.border}`, color: accent, borderRadius: 20, padding: "4px 12px", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 4 }}
          >
            <Plus size={14} /> New Group
          </button>
        </div>

        {/* New Group Panel */}
        <AnimatePresence>
          {showNewGroup && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              style={{ overflow: "hidden", borderBottom: `1px solid ${R.border}` }}
            >
              <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 8 }}>
                <input
                  type="text"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder="Group name (optional)"
                  maxLength={50}
                  style={{ background: R.search, border: `1px solid ${R.border}`, borderRadius: 20, padding: "8px 16px", color: R.text, fontSize: 14, fontFamily: "inherit" }}
                />
                <input
                  type="text"
                  value={groupSearchQuery}
                  onChange={(e) => setGroupSearchQuery(e.target.value)}
                  placeholder="Search people to add..."
                  style={{ background: R.search, border: `1px solid ${R.border}`, borderRadius: 20, padding: "8px 16px", color: R.text, fontSize: 14, fontFamily: "inherit" }}
                />
                {/* Search results */}
                {groupSearchResults.length > 0 && (
                  <div style={{ background: R.card, borderRadius: 12, maxHeight: 150, overflowY: "auto" }}>
                    {groupSearchResults.map((u) => (
                      <div key={u.id} onClick={() => addMember(u)} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", cursor: "pointer", fontSize: 14 }}
                        onMouseEnter={(e) => e.currentTarget.style.background = R.hover}
                        onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                      >
                        <Avatar src={u.avatar} size={28} />
                        <div>
                          <div style={{ fontWeight: 700, color: R.text }}>{u.displayName}</div>
                          <div style={{ color: R.gray, fontSize: 12 }}>@{u.username}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {/* Selected members */}
                {selectedMembers.length > 0 && (
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {selectedMembers.map((m) => (
                      <span key={m.id} style={{ display: "inline-flex", alignItems: "center", gap: 4, background: `${accent}20`, color: accent, padding: "4px 10px", borderRadius: 20, fontSize: 13, fontWeight: 600 }}>
                        @{m.username}
                        <X size={12} style={{ cursor: "pointer" }} onClick={() => removeMember(m.id)} />
                      </span>
                    ))}
                  </div>
                )}
                <button
                  onClick={handleCreateGroup}
                  disabled={creatingGroup || selectedMembers.length < 1}
                  className="post-btn-main"
                  style={{ background: accent, color: "#fff", border: "none", borderRadius: 20, padding: "8px 16px", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", opacity: creatingGroup || selectedMembers.length < 1 ? 0.5 : 1 }}
                >
                  {creatingGroup ? "Creating..." : `Create Group (${selectedMembers.length + 1} members)`}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div style={{ flex: 1, overflowY: "auto" }}>
          {loading ? (
            <div style={{ padding: 16, color: R.gray, fontSize: 14 }}>Loading...</div>
          ) : conversations.length === 0 ? (
            <div style={{ padding: 24, textAlign: "center", color: R.gray, fontSize: 15 }}>No conversations yet</div>
          ) : (
            conversations.map((c) => (
              <div
                key={c.id}
                onClick={() => setActiveConvoId(c.id)}
                className="tweet-hover"
                style={{ display: "flex", alignItems: "center", gap: 12, padding: "16px", cursor: "pointer", borderBottom: `1px solid ${R.border}`, background: activeConvoId === c.id ? R.hover : "transparent" }}
              >
                {c.isGroup ? (
                  <div style={{ width: 40, height: 40, borderRadius: "50%", background: `${accent}20`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Users size={20} style={{ color: accent }} />
                  </div>
                ) : (
                  <Avatar src={c.otherAvatar} />
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontWeight: 700, color: R.text, fontSize: 15, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {c.isGroup ? c.name : (c.otherDisplayName || c.otherUsername)}
                    </span>
                    <span style={{ color: R.gray, fontSize: 13, flexShrink: 0 }}>{timeAgo(c.updatedAt)}</span>
                  </div>
                  <div style={{ color: R.gray, fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {c.isGroup ? `${c.members?.length || 0} members` : `@${c.otherUsername}`}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Message Thread */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        {activeConvo ? (
          <>
            <div style={{ padding: "12px 16px", borderBottom: `1px solid ${R.border}`, display: "flex", alignItems: "center", gap: 12 }}>
              {activeConvo.isGroup ? (
                <>
                  <div style={{ width: 32, height: 32, borderRadius: "50%", background: `${accent}20`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Users size={16} style={{ color: accent }} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, color: R.text, fontSize: 15 }}>{activeConvo.name}</div>
                    <div style={{ color: R.gray, fontSize: 12 }}>{activeConvo.members?.map((m) => `@${m.username}`).join(", ")}</div>
                  </div>
                </>
              ) : (
                <>
                  <Avatar src={activeConvo.otherAvatar} size={32} />
                  <span className="hover-underline" onClick={() => onNavigateToProfile(activeConvo.otherUserId)} style={{ fontWeight: 700, color: R.text, fontSize: 15 }}>
                    {activeConvo.otherDisplayName || activeConvo.otherUsername}
                  </span>
                </>
              )}
            </div>
            <div style={{ flex: 1, overflowY: "auto", padding: 16, display: "flex", flexDirection: "column", gap: 8 }}>
              {messages.map((m) => {
                const isOwn = m.senderId === appUserId;
                return (
                  <div key={m.id} style={{ alignSelf: isOwn ? "flex-end" : "flex-start", maxWidth: "75%", display: "flex", flexDirection: "column" }}>
                    {/* Show sender name in group chats for other people's messages */}
                    {activeConvo.isGroup && !isOwn && (
                      <div style={{ fontSize: 12, color: accent, fontWeight: 600, marginBottom: 2, marginLeft: 4 }}>
                        {m.senderDisplayName || m.senderName}
                      </div>
                    )}
                    <div style={{ padding: "12px 16px", borderRadius: 24, fontSize: 15, lineHeight: "20px", background: isOwn ? accent : R.search, color: isOwn ? "#fff" : R.text }}>
                      {m.content}
                      <div style={{ fontSize: 12, color: isOwn ? "rgba(255,255,255,0.6)" : R.gray, marginTop: 4 }}>{timeAgo(m.timestamp)}</div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
            <div style={{ padding: "12px 16px", borderTop: `1px solid ${R.border}`, display: "flex", gap: 12 }}>
              <input
                type="text"
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                placeholder="Start a new message"
                maxLength={1000}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                style={{ flex: 1, background: R.search, border: "1px solid transparent", borderRadius: 9999, padding: "12px 16px", color: R.text, fontSize: 15, fontFamily: "inherit" }}
              />
              <button
                onClick={handleSend}
                disabled={sending || !messageText.trim()}
                style={{ background: "none", border: "none", color: accent, cursor: "pointer", padding: 8, opacity: sending || !messageText.trim() ? 0.5 : 1 }}
              >
                <Send size={20} />
              </button>
            </div>
          </>
        ) : (
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 8, color: R.gray }}>
            <Mail size={32} />
            <div style={{ fontSize: 15 }}>Select a conversation</div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Auth View ────────────────────────────────────────────────────────────

function AuthView() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const inputStyle = { width: "100%", background: R.search, border: `1px solid ${R.border}`, borderRadius: 8, padding: "14px 16px", color: R.text, fontSize: 17, fontFamily: "inherit" };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null); setLoading(true);
    if (isSignUp) {
      const { error: err } = await signUp({ email, password, username, displayName });
      if (err) setError(err);
    } else {
      const { error: err } = await signIn({ email, password });
      if (err) setError(err);
    }
    setLoading(false);
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: R.bg, padding: 16 }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        style={{ width: "100%", maxWidth: 440, padding: 32 }}
      >
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <span style={{ fontSize: 48, fontWeight: 900, color: DEFAULT_ACCENT }}>N</span>
          <div style={{ fontSize: 14, color: R.gray, marginTop: 4, letterSpacing: 2, textTransform: "uppercase" }}>nosta</div>
        </div>
        <h1 style={{ fontSize: 31, fontWeight: 800, color: R.text, marginBottom: 32, textAlign: "center" }}>
          {isSignUp ? "Create your account" : "Welcome back"}
        </h1>
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {isSignUp && (
            <>
              <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} required placeholder="Username" style={inputStyle} />
              <input type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)} required placeholder="Display name" style={inputStyle} />
            </>
          )}
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="Email" style={inputStyle} />
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} placeholder="Password" style={inputStyle} />
          {error && <div style={{ color: R.pink, fontSize: 14, textAlign: "center" }}>{error}</div>}
          <button
            type="submit"
            disabled={loading}
            className="post-btn-main"
            style={{ width: "100%", height: 52, borderRadius: 9999, background: R.text, color: R.bg, fontSize: 17, fontWeight: 700, border: "none", cursor: "pointer", fontFamily: "inherit", opacity: loading ? 0.7 : 1 }}
          >
            {loading ? "Loading..." : isSignUp ? "Sign Up" : "Sign In"}
          </button>
        </form>
        <div style={{ textAlign: "center", marginTop: 24 }}>
          <button onClick={() => { setIsSignUp(!isSignUp); setError(null); }} style={{ background: "none", border: "none", color: DEFAULT_ACCENT, fontSize: 15, cursor: "pointer", fontFamily: "inherit" }}>
            {isSignUp ? "Already have an account? Sign in" : "Don't have an account? Sign up"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Mobile Top Bar ───────────────────────────────────────────────────────

function MobileTopBar({ view, isOwnProfile, onBack, onNavigateHome, onNavigateProfile, onNavigateNotifications, onNavigateMessages, onNavigateSettings, user, accent = DEFAULT_ACCENT, unreadCount = 0 }) {
  let leftIcon = null;
  let rightIcon = null;

  if (view === "feed") {
    leftIcon = (
      <button onClick={onNavigateProfile} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex" }}>
        <Avatar src={user?.avatar} size={30} />
      </button>
    );
    rightIcon = (
      <button onClick={onNavigateMessages} style={{ background: "none", border: "none", color: R.text, cursor: "pointer", padding: 4, display: "flex" }}>
        <Mail size={22} />
      </button>
    );
  } else if (view === "profile" && !isOwnProfile) {
    leftIcon = (
      <button onClick={onBack} style={{ background: "none", border: "none", color: R.text, cursor: "pointer", padding: 4, display: "flex" }}>
        <ArrowLeft size={22} />
      </button>
    );
  } else if (view === "profile" && isOwnProfile) {
    rightIcon = (
      <button onClick={onNavigateSettings} style={{ background: "none", border: "none", color: R.text, cursor: "pointer", padding: 4, display: "flex" }}>
        <Settings size={22} />
      </button>
    );
  } else if (view !== "feed") {
    leftIcon = (
      <button onClick={onNavigateHome} style={{ background: "none", border: "none", color: R.text, cursor: "pointer", padding: 4, display: "flex" }}>
        <ArrowLeft size={22} />
      </button>
    );
  }

  return (
    <div className="mobile-top-bar">
      <div style={{ width: 40, display: "flex", alignItems: "center", justifyContent: "flex-start" }}>
        {leftIcon}
      </div>
      <span onClick={onNavigateHome} style={{ fontSize: 20, fontWeight: 900, color: accent, cursor: "pointer", letterSpacing: -0.5 }}>
        nosta
      </span>
      <div style={{ width: 40, display: "flex", alignItems: "center", justifyContent: "flex-end" }}>
        {rightIcon}
      </div>
    </div>
  );
}

// ─── Status Section ──────────────────────────────────────────────────────

const MOOD_EMOJIS = ["💭", "😊", "😴", "🎵", "🔥", "💀", "🌙", "☕", "🎮", "📚", "🏃", "🧘"];

const PROFILE_EMOJIS = ["", "💩", "👍", "⭐", "✨", "🔥", "💎", "🎵", "🎨", "🏆", "👑", "🦋", "🌙", "☀️", "🌈", "🍀", "💀", "👻", "🤖", "🎯", "💜", "🖤", "💚", "❤️"];

function StatusSection({ status, isOwnProfile, onUpdateStatus, accent = DEFAULT_ACCENT }) {
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState("");
  const [editEmoji, setEditEmoji] = useState("💭");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!editContent.trim() || !onUpdateStatus) return;
    setSaving(true);
    await onUpdateStatus(editContent.trim(), editEmoji);
    setSaving(false);
    setEditing(false);
  };

  const startEditing = () => {
    setEditContent(status?.content || "");
    setEditEmoji(status?.emoji || "💭");
    setEditing(true);
  };

  if (editing) {
    return (
      <div className="status-bubble" style={{ flexDirection: "column", alignItems: "stretch", gap: 12 }}>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {MOOD_EMOJIS.map((e) => (
            <button key={e} onClick={() => setEditEmoji(e)} style={{ width: 32, height: 32, borderRadius: 8, border: editEmoji === e ? `2px solid ${accent}` : `1px solid ${R.border}`, background: editEmoji === e ? `${accent}15` : "transparent", fontSize: 16, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
              {e}
            </button>
          ))}
        </div>
        <input
          value={editContent}
          onChange={(e) => setEditContent(e.target.value)}
          placeholder="What's your status?"
          maxLength={100}
          onKeyDown={(e) => { if (e.key === "Enter") handleSave(); }}
          style={{ background: R.search, border: `1px solid ${R.border}`, borderRadius: 12, padding: "8px 12px", color: R.text, fontSize: 14, fontFamily: "inherit", width: "100%" }}
        />
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button onClick={() => setEditing(false)} style={{ background: "transparent", border: `1px solid ${R.border}`, color: R.text, borderRadius: 9999, padding: "6px 14px", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>Cancel</button>
          <button onClick={handleSave} disabled={saving || !editContent.trim()} style={{ background: accent, color: "#fff", border: "none", borderRadius: 9999, padding: "6px 14px", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", opacity: saving || !editContent.trim() ? 0.5 : 1 }}>
            {saving ? "..." : "Set"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="status-bubble" onClick={isOwnProfile && onUpdateStatus ? startEditing : undefined} style={{ cursor: isOwnProfile && onUpdateStatus ? "pointer" : "default" }}>
      <span style={{ fontSize: 20 }}>{status?.emoji || "💭"}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ color: R.text, fontSize: 14, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {status?.content || (isOwnProfile ? "Set your status..." : "No status")}
        </div>
        {status?.timestamp && (
          <div style={{ color: R.gray, fontSize: 12, marginTop: 2 }}>{timeAgo(status.timestamp)}</div>
        )}
      </div>
      {isOwnProfile && onUpdateStatus && <Pencil size={14} style={{ color: R.gray, flexShrink: 0 }} />}
    </div>
  );
}

// ─── Mobile Profile View ─────────────────────────────────────────────────

function MobileProfileView({ user, posts, top8, appUserId, viewedUserId, isOwnProfile, isFollowing, onFollowToggle, onNavigateToProfile, onSendMessage, onUpdateStatus, onUpdateInterests, onAvatarUpload, onUpdateProfileEmoji, userStatus, likedPostIds, repostedPostIds, onToggleLike, onToggleRepost, onDeletePost, accent = DEFAULT_ACCENT }) {
  const [editingBio, setEditingBio] = useState(false);
  const [editBioText, setEditBioText] = useState("");
  const [showAvatarMenu, setShowAvatarMenu] = useState(false);
  const [showAvatarLightbox, setShowAvatarLightbox] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const avatarInputRef = useRef(null);
  const [editingInterests, setEditingInterests] = useState(false);
  const [editInterestsText, setEditInterestsText] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [expandedReplies, setExpandedReplies] = useState(new Set());
  const [repliesCache, setRepliesCache] = useState({});

  const handleToggleReplies = async (postId) => {
    const next = new Set(expandedReplies);
    if (next.has(postId)) { next.delete(postId); } else {
      next.add(postId);
      if (!repliesCache[postId]) { const data = await fetchReplies(postId); if (data) setRepliesCache((prev) => ({ ...prev, [postId]: data })); }
    }
    setExpandedReplies(next);
  };

  const handleCreateReply = async (postId, content) => {
    if (!appUserId) return;
    await createReply(postId, appUserId, content);
    const data = await fetchReplies(postId);
    if (data) setRepliesCache((prev) => ({ ...prev, [postId]: data }));
  };

  const handleSaveBio = async () => {
    if (!appUserId) return;
    await updateUserProfile(appUserId, { displayName: user.displayName, bio: editBioText.trim(), avatarUrl: user.avatar || null });
    setEditingBio(false);
  };

  const handleSaveInterests = async () => {
    if (!onUpdateInterests) return;
    await onUpdateInterests(editInterestsText.trim());
    setEditingInterests(false);
  };

  return (
    <div>
      {/* Bio | Pic | Interests row */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "20px 16px 8px" }}>
        {/* Bio pill */}
        <div
          onClick={isOwnProfile && appUserId ? () => { setEditBioText(user?.bio || ""); setEditingBio(true); } : undefined}
          style={{ flex: 1, background: R.card, border: `1px solid ${R.border}`, borderRadius: 16, padding: "10px 12px", cursor: isOwnProfile && appUserId ? "pointer" : "default", minHeight: 60, display: "flex", flexDirection: "column", justifyContent: "center" }}
        >
          <div style={{ fontSize: 11, fontWeight: 700, color: R.gray, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 }}>Bio</div>
          <div style={{ fontSize: 13, color: R.text, lineHeight: "16px", overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
            {user?.bio || (isOwnProfile ? "Add bio..." : "—")}
          </div>
        </div>

        {/* Profile pic */}
        <div style={{ flexShrink: 0, position: "relative", cursor: (user?.avatar || (isOwnProfile && onAvatarUpload)) ? "pointer" : "default" }} onClick={() => { if (user?.avatar || (isOwnProfile && onAvatarUpload)) setShowAvatarMenu(true); }}>
          <div style={{ width: 88, height: 88, borderRadius: 20, overflow: "hidden", background: R.search, display: "flex", alignItems: "center", justifyContent: "center", border: `3px solid ${accent}` }}>
            {user?.avatar ? (
              <img src={user.avatar} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              <User size={40} style={{ color: R.gray }} />
            )}
          </div>
          {avatarUploading && (
            <div style={{ position: "absolute", inset: 0, borderRadius: 20, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Loader2 size={24} style={{ color: "#fff" }} />
            </div>
          )}
          <input ref={avatarInputRef} type="file" accept="image/jpeg,image/png,image/gif,image/webp" style={{ display: "none" }} onChange={async (e) => {
            const file = e.target.files?.[0]; if (!file) return;
            setAvatarUploading(true); await onAvatarUpload(file); setAvatarUploading(false);
          }} />
        </div>

        {/* Interests pill */}
        <div
          onClick={isOwnProfile && onUpdateInterests ? () => { setEditInterestsText(user?.interests || ""); setEditingInterests(true); } : undefined}
          style={{ flex: 1, background: R.card, border: `1px solid ${R.border}`, borderRadius: 16, padding: "10px 12px", cursor: isOwnProfile && onUpdateInterests ? "pointer" : "default", minHeight: 60, display: "flex", flexDirection: "column", justifyContent: "center" }}
        >
          <div style={{ fontSize: 11, fontWeight: 700, color: R.gray, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 }}>Interests</div>
          <div style={{ fontSize: 13, color: R.text, lineHeight: "16px", overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
            {user?.interests || (isOwnProfile ? "Add interests..." : "—")}
          </div>
        </div>
      </div>

      {/* Bio edit modal */}
      <AnimatePresence>
        {editingBio && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.6)" }} onClick={() => setEditingBio(false)} />
            <div style={{ position: "relative", background: R.card, borderRadius: 20, padding: 20, width: 320, maxWidth: "90vw", border: `1px solid ${R.border}` }}>
              <h3 style={{ fontSize: 17, fontWeight: 700, color: R.text, marginBottom: 12 }}>Edit Bio</h3>
              <textarea value={editBioText} onChange={(e) => setEditBioText(e.target.value)} rows={3} maxLength={160} placeholder="Tell the world..." style={{ width: "100%", background: R.search, border: `1px solid ${R.border}`, borderRadius: 12, padding: "10px 12px", color: R.text, fontSize: 14, fontFamily: "inherit", resize: "none" }} />
              <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 12 }}>
                <button onClick={() => setEditingBio(false)} style={{ background: "transparent", border: `1px solid ${R.border}`, color: R.text, borderRadius: 9999, padding: "6px 14px", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>Cancel</button>
                <button onClick={handleSaveBio} style={{ background: accent, color: "#fff", border: "none", borderRadius: 9999, padding: "6px 14px", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>Save</button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Interests edit modal */}
      <AnimatePresence>
        {editingInterests && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.6)" }} onClick={() => setEditingInterests(false)} />
            <div style={{ position: "relative", background: R.card, borderRadius: 20, padding: 20, width: 320, maxWidth: "90vw", border: `1px solid ${R.border}` }}>
              <h3 style={{ fontSize: 17, fontWeight: 700, color: R.text, marginBottom: 12 }}>Edit Interests</h3>
              <textarea value={editInterestsText} onChange={(e) => setEditInterestsText(e.target.value)} rows={3} maxLength={200} placeholder="music, coding, art..." style={{ width: "100%", background: R.search, border: `1px solid ${R.border}`, borderRadius: 12, padding: "10px 12px", color: R.text, fontSize: 14, fontFamily: "inherit", resize: "none" }} />
              <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 12 }}>
                <button onClick={() => setEditingInterests(false)} style={{ background: "transparent", border: `1px solid ${R.border}`, color: R.text, borderRadius: 9999, padding: "6px 14px", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>Cancel</button>
                <button onClick={handleSaveInterests} style={{ background: accent, color: "#fff", border: "none", borderRadius: 9999, padding: "6px 14px", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>Save</button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Avatar menu */}
      <AnimatePresence>
        {showAvatarMenu && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
            <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.6)" }} onClick={() => setShowAvatarMenu(false)} />
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 300 }} style={{ position: "relative", background: R.card, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: "8px 8px 24px", width: "100%", maxWidth: 400 }}>
              <div style={{ width: 36, height: 4, borderRadius: 2, background: R.border, margin: "4px auto 8px" }} />
              {user?.avatar && (
                <button onClick={() => { setShowAvatarMenu(false); setShowAvatarLightbox(true); }} style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", background: "none", border: "none", color: R.text, cursor: "pointer", fontFamily: "inherit", fontSize: 16, borderRadius: 12 }} className="nav-item-hover">
                  <User size={20} style={{ color: R.gray }} /> View Photo
                </button>
              )}
              {isOwnProfile && onAvatarUpload && (
                <button onClick={() => { setShowAvatarMenu(false); avatarInputRef.current?.click(); }} style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", background: "none", border: "none", color: R.text, cursor: "pointer", fontFamily: "inherit", fontSize: 16, borderRadius: 12 }} className="nav-item-hover">
                  <ImagePlus size={20} style={{ color: R.gray }} /> {user?.avatar ? "Change Photo" : "Add Photo"}
                </button>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Avatar lightbox */}
      <AnimatePresence>
        {showAvatarLightbox && user?.avatar && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowAvatarLightbox(false)} style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.9)", cursor: "pointer" }}>
            <button onClick={() => setShowAvatarLightbox(false)} style={{ position: "absolute", top: 16, right: 16, background: "none", border: "none", color: "#fff", cursor: "pointer", padding: 8 }}>
              <X size={24} />
            </button>
            <motion.img initial={{ scale: 0.8 }} animate={{ scale: 1 }} exit={{ scale: 0.8 }} src={user.avatar} alt="" style={{ maxWidth: "85vw", maxHeight: "85vh", borderRadius: 16, objectFit: "contain" }} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Name + handle */}
      <div style={{ textAlign: "center", padding: "8px 16px 4px" }}>
        <div style={{ fontSize: 20, fontWeight: 800, color: R.text, display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
          {user?.displayName || "Profile"}
          {user?.profileEmoji && <span style={{ fontSize: 18 }}>{user.profileEmoji}</span>}
          {isOwnProfile && onUpdateProfileEmoji && (
            <span onClick={(e) => { e.stopPropagation(); setShowEmojiPicker(!showEmojiPicker); }} style={{ cursor: "pointer", fontSize: 13, opacity: 0.5, marginLeft: 2 }} title="Change badge emoji">
              <Pencil size={13} />
            </span>
          )}
        </div>
        {showEmojiPicker && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4, justifyContent: "center", marginTop: 8, background: R.search, border: `1px solid #2a2a2a`, borderRadius: 12, padding: 8, maxWidth: 220, margin: "8px auto 0" }}>
            {PROFILE_EMOJIS.map((e) => (
              <button key={e || "none"} onClick={async () => { setShowEmojiPicker(false); await onUpdateProfileEmoji(e); }}
                style={{ width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", background: user?.profileEmoji === e ? `${accent}30` : "transparent", border: user?.profileEmoji === e ? `1px solid ${accent}` : "1px solid transparent", borderRadius: 8, cursor: "pointer", fontSize: 16, padding: 0 }}>
                {e || <X size={14} style={{ color: R.gray }} />}
              </button>
            ))}
          </div>
        )}
        <div style={{ color: R.gray, fontSize: 14, marginTop: 2 }}>@{user?.name}</div>
      </div>

      {/* Follow/Message buttons for other profiles */}
      {!isOwnProfile && appUserId && (
        <div style={{ display: "flex", gap: 8, justifyContent: "center", padding: "8px 16px" }}>
          {onFollowToggle && (
            <button
              onClick={onFollowToggle}
              className={`follow-btn${isFollowing ? " follow-btn-following" : ""}`}
              style={{ borderRadius: 9999, padding: "0 20px", height: 36, fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", background: isFollowing ? "transparent" : "#eff3f4", color: isFollowing ? R.text : "#0f1419", border: isFollowing ? `1px solid ${R.border}` : "none" }}
            >
              {isFollowing ? "Following" : "Follow"}
            </button>
          )}
          {onSendMessage && (
            <button onClick={() => onSendMessage(viewedUserId)} style={{ background: "transparent", border: `1px solid ${R.border}`, color: R.text, borderRadius: "50%", width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
              <Mail size={18} />
            </button>
          )}
        </div>
      )}

      {/* Stats */}
      <div style={{ display: "flex", gap: 20, justifyContent: "center", padding: "4px 16px 12px", fontSize: 14 }}>
        <span><strong style={{ color: R.text, fontWeight: 800 }}>{formatCount(user?.following || 0)}</strong> <span style={{ color: R.gray }}>Following</span></span>
        <span><strong style={{ color: R.text, fontWeight: 800 }}>{formatCount(user?.followers || 0)}</strong> <span style={{ color: R.gray }}>Followers</span></span>
      </div>

      {/* Friends row */}
      {top8.length > 0 && (
        <div style={{ padding: "0 16px 12px" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: R.gray, marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5 }}>Friends</div>
          <div style={{ display: "flex", gap: 12, overflowX: "auto", paddingBottom: 4 }}>
            {top8.map((friend) => (
              <div key={friend.id} onClick={() => onNavigateToProfile?.(friend.userId)} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, cursor: "pointer", flexShrink: 0 }}>
                <div style={{ width: 48, height: 48, borderRadius: 10, background: R.search, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                  <User size={20} style={{ color: R.gray }} />
                </div>
                <span style={{ fontSize: 11, color: R.gray, maxWidth: 56, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", textAlign: "center" }}>{friend.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Status */}
      <div style={{ padding: "0 16px 12px" }}>
        <StatusSection status={userStatus} isOwnProfile={isOwnProfile} onUpdateStatus={isOwnProfile ? onUpdateStatus : undefined} accent={accent} />
      </div>

      {/* Posts */}
      <div style={{ borderTop: `1px solid ${R.border}` }}>
        <div style={{ padding: "12px 16px", fontSize: 16, fontWeight: 700, color: R.text }}>Posts</div>
        {posts.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center", color: R.gray, fontSize: 14 }}>No posts yet</div>
        ) : (
          posts.map((post) => (
            <div key={post.id} className="post-card">
              <Tweet
                post={post}
                appUserId={appUserId}
                accent={accent}
                isLiked={likedPostIds?.has(post.id)}
                isReposted={repostedPostIds?.has(post.id)}
                onToggleLike={onToggleLike}
                onToggleRepost={onToggleRepost}
                onDeletePost={onDeletePost}
                onNavigateToProfile={onNavigateToProfile}
                onToggleReplies={appUserId ? handleToggleReplies : undefined}
                repliesExpanded={expandedReplies.has(post.id)}
                replies={repliesCache[post.id] || null}
                onCreateReply={handleCreateReply}
              />
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ─── Mobile Compose Modal ────────────────────────────────────────────────

function MobileComposeModal({ user, appUserId, onPostCreated, onClose, accent = DEFAULT_ACCENT, activeRoom, onRoomChange }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", flexDirection: "column", justifyContent: "flex-end" }}
    >
      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.6)" }} onClick={onClose} />
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        style={{ position: "relative", background: R.bg, borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: "85vh", overflow: "auto" }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", borderBottom: `1px solid ${R.border}` }}>
          <button onClick={onClose} style={{ background: "none", border: "none", color: R.text, cursor: "pointer", padding: 4, display: "flex" }}>
            <X size={22} />
          </button>
          <span style={{ fontSize: 17, fontWeight: 700, color: R.text }}>New Post</span>
          <div style={{ width: 30 }} />
        </div>
        <ComposeBox user={user} appUserId={appUserId} onPostCreated={() => { onPostCreated(); onClose(); }} accent={accent} activeRoom={activeRoom} onRoomChange={onRoomChange} />
      </motion.div>
    </motion.div>
  );
}

// ─── Mobile Bottom Bar ────────────────────────────────────────────────────

function MobileBottomBar({ activeView, setView, accent = DEFAULT_ACCENT }) {
  const items = [
    { icon: Mail, label: "Messages", view: "messages" },
    { icon: Search, label: "Search", view: "explore" },
    { icon: Compass, label: "Explore", view: "feed" },
    { icon: Settings, label: "Settings", view: "settings" },
  ];
  return (
    <div className="mobile-bottom-bar" style={{ justifyContent: "center", gap: 8, padding: "8px 12px" }}>
      {items.map((item) => {
        const isActive = activeView === item.view;
        return (
          <button
            key={item.view}
            onClick={() => setView(item.view)}
            className={`mobile-tab-pill${isActive ? " active" : ""}`}
            style={isActive ? { background: accent, color: "#fff" } : undefined}
          >
            <item.icon size={20} strokeWidth={isActive ? 2.5 : 1.5} />
            {isActive && <span>{item.label}</span>}
          </button>
        );
      })}
    </div>
  );
}

// ─── Create Room Modal ────────────────────────────────────────────────────

const ROOM_COLORS = ["#7C5CFC", "#FF4D6A", "#FFA033", "#3B82F6", "#22C55E", "#E44D90", "#F59E0B", "#8B5CF6", "#06B6D4", "#EF4444"];
const ROOM_EMOJIS = ["🎵", "🎮", "📚", "🎯", "💬", "🌊", "⚡", "🎭", "🏆", "🌸", "🔮", "🎪", "🧠", "🎬", "🍕"];

function CreateRoomModal({ onClose, onCreate, accent = DEFAULT_ACCENT }) {
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState("💬");
  const [color, setColor] = useState("#7C5CFC");

  const handleCreate = () => {
    if (!name.trim()) return;
    onCreate(name.trim(), emoji, color);
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.6)" }} onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        style={{ position: "relative", background: R.card, borderRadius: 20, padding: 24, width: 380, maxWidth: "90vw", border: `1px solid ${R.border}` }}
      >
        <h2 style={{ fontSize: 20, fontWeight: 800, color: R.text, marginBottom: 20 }}>Create a Room</h2>

        {/* Name */}
        <label style={{ color: R.gray, fontSize: 13, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6, display: "block" }}>Room Name</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Music Corner"
          maxLength={30}
          style={{ width: "100%", background: R.search, border: `1px solid ${R.border}`, borderRadius: 12, padding: "10px 14px", color: R.text, fontSize: 15, fontFamily: "inherit", marginBottom: 16 }}
        />

        {/* Emoji */}
        <label style={{ color: R.gray, fontSize: 13, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6, display: "block" }}>Icon</label>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 16 }}>
          {ROOM_EMOJIS.map((e) => (
            <button
              key={e}
              onClick={() => setEmoji(e)}
              style={{ width: 36, height: 36, borderRadius: 8, border: emoji === e ? `2px solid ${color}` : `1px solid ${R.border}`, background: emoji === e ? `${color}15` : "transparent", fontSize: 18, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
            >
              {e}
            </button>
          ))}
        </div>

        {/* Color */}
        <label style={{ color: R.gray, fontSize: 13, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6, display: "block" }}>Color</label>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 20 }}>
          {ROOM_COLORS.map((c) => (
            <button
              key={c}
              onClick={() => setColor(c)}
              style={{ width: 32, height: 32, borderRadius: "50%", background: c, border: color === c ? "3px solid #fff" : "3px solid transparent", cursor: "pointer", outline: color === c ? `2px solid ${c}` : "none" }}
            />
          ))}
        </div>

        {/* Preview */}
        {name.trim() && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16, padding: "8px 12px", background: `${color}10`, borderRadius: 12 }}>
            <span style={{ fontSize: 20 }}>{emoji}</span>
            <span style={{ color, fontWeight: 700, fontSize: 15 }}>{name.trim()}</span>
          </div>
        )}

        {/* Buttons */}
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button onClick={onClose} style={{ background: "transparent", border: `1px solid ${R.border}`, color: R.text, borderRadius: 9999, padding: "8px 20px", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>Cancel</button>
          <button onClick={handleCreate} disabled={!name.trim()} className="post-btn-main" style={{ background: color, color: "#fff", border: "none", borderRadius: 9999, padding: "8px 20px", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", opacity: name.trim() ? 1 : 0.5 }}>Create Room</button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── App ──────────────────────────────────────────────────────────────────

export default function App() {
  const [view, setView] = useState("feed");
  const [user, setUser] = useState(MOCK_USER);
  const [posts, setPosts] = useState(MOCK_POSTS);
  const [top8, setTop8] = useState(MOCK_TOP8);
  const [playlist, setPlaylist] = useState(MOCK_PLAYLIST);

  const [authUser, setAuthUser] = useState(null);
  const [appUserId, setAppUserId] = useState(null);
  const [authLoading, setAuthLoading] = useState(!!supabase);

  const [viewedUserId, setViewedUserId] = useState(null);
  const [viewedUser, setViewedUser] = useState(null);
  const [viewedPosts, setViewedPosts] = useState([]);
  const [viewedTop8, setViewedTop8] = useState([]);
  const [viewedPlaylist, setViewedPlaylist] = useState([]);
  const [ownPosts, setOwnPosts] = useState([]);
  const [likedPostIds, setLikedPostIds] = useState(new Set());
  const [repostedPostIds, setRepostedPostIds] = useState(new Set());
  const [isFollowingViewed, setIsFollowingViewed] = useState(false);

  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [activeRoom, setActiveRoom] = useState(null);
  const [customRooms, setCustomRooms] = useState([]);
  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const [userStatus, setUserStatus] = useState(!supabase ? MOCK_STATUS : null);
  const [viewedUserStatus, setViewedUserStatus] = useState(null);
  const [showMobileCompose, setShowMobileCompose] = useState(false);
  const isMobile = useIsMobile();

  const allRooms = [...ROOMS, ...customRooms];
  const accent = activeRoom ? (allRooms.find((r) => r.id === activeRoom)?.accent || DEFAULT_ACCENT) : DEFAULT_ACCENT;
  const isOwnProfile = !viewedUserId;
  const isInMyTop8 = viewedUserId ? top8.some((t) => t.userId === viewedUserId) : false;

  // Auth listener
  useEffect(() => {
    if (!supabase) return;
    const { unsubscribe } = onAuthChange(async (authU) => {
      setAuthUser(authU);
      if (authU) {
        setUser(null); setPosts([]); setTop8([]); setPlaylist([]);
        const dbUser = await fetchUserByAuthId(authU.id);
        setAppUserId(dbUser?.id ?? null);
      } else {
        setAppUserId(null); setUser(MOCK_USER); setPosts(MOCK_POSTS); setTop8(MOCK_TOP8); setPlaylist(MOCK_PLAYLIST);
        setOwnPosts(MOCK_POSTS); setViewedUserId(null); setLikedPostIds(new Set()); setRepostedPostIds(new Set()); setNotifications([]); setUnreadCount(0);
      }
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Data loader
  useEffect(() => {
    if (!appUserId) return;
    async function loadData() {
      try {
        const [userData, postsData, top8Data, playlistData, likesData, repostsData, unread, myPosts, statusData] = await Promise.all([
          fetchUser(appUserId), fetchPosts(), fetchTop8(appUserId), fetchPlaylist(appUserId),
          fetchUserLikes(appUserId), fetchUserReposts(appUserId), getUnreadCount(appUserId), fetchUserPosts(appUserId),
          fetchUserStatus(appUserId).catch(() => null),
        ]);
        if (userData) setUser(userData);
        if (postsData) { setPosts(postsData); setHasMore(postsData.length >= 20); }
        if (top8Data) setTop8(top8Data);
        if (playlistData) setPlaylist(playlistData);
        if (likesData) setLikedPostIds(new Set(likesData));
        if (repostsData) setRepostedPostIds(new Set(repostsData));
        setUnreadCount(unread);
        if (myPosts) setOwnPosts(myPosts);
        setUserStatus(statusData);
      } catch (err) {
        console.error("Data loader failed:", err);
      }
    }
    loadData();
  }, [appUserId]);

  // Notification polling
  useEffect(() => {
    if (!appUserId) return;
    const interval = setInterval(async () => { setUnreadCount(await getUnreadCount(appUserId)); }, 30000);
    return () => clearInterval(interval);
  }, [appUserId]);

  // Realtime
  useEffect(() => {
    if (!supabase || !appUserId) return;
    const postsChannel = supabase.channel("public:posts").on("postgres_changes", { event: "INSERT", schema: "public", table: "posts" }, async () => {
      const data = await fetchPosts(); if (data) { setPosts(data); setHasMore(data.length >= 20); }
      const myP = await fetchUserPosts(appUserId); if (myP) setOwnPosts(myP);
    }).subscribe();
    const notifChannel = supabase.channel(`notifications:${appUserId}`).on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${appUserId}` }, () => {
      setUnreadCount((c) => c + 1);
    }).subscribe();
    return () => { supabase.removeChannel(postsChannel); supabase.removeChannel(notifChannel); };
  }, [appUserId]);

  // ─── Callbacks ────────────────────────────────────────────────────────

  const navigateToProfile = useCallback(async (userId) => {
    if (!appUserId) return;
    if (userId === appUserId) { setViewedUserId(null); setView("profile"); return; }
    const [userData, postsData, top8Data, playlistData, following, viewedStatus] = await Promise.all([
      fetchUser(userId), fetchUserPosts(userId), fetchTop8(userId), fetchPlaylist(userId), checkFollowing(appUserId, userId), fetchUserStatus(userId).catch(() => null),
    ]);
    setViewedUser(userData); setViewedPosts(postsData || []); setViewedTop8(top8Data || []); setViewedPlaylist(playlistData || []);
    setIsFollowingViewed(following); setViewedUserStatus(viewedStatus); setViewedUserId(userId); setView("profile");
  }, [appUserId]);

  const handleToggleLike = useCallback(async (postId) => {
    if (!appUserId) return;
    const wasLiked = likedPostIds.has(postId);
    setLikedPostIds((prev) => { const next = new Set(prev); wasLiked ? next.delete(postId) : next.add(postId); return next; });
    setPosts((prev) => prev.map((p) => p.id === postId ? { ...p, likes: p.likes + (wasLiked ? -1 : 1) } : p));
    const result = await toggleLike(postId, appUserId);
    if (!result) {
      setLikedPostIds((prev) => { const next = new Set(prev); wasLiked ? next.add(postId) : next.delete(postId); return next; });
      setPosts((prev) => prev.map((p) => p.id === postId ? { ...p, likes: p.likes + (wasLiked ? 1 : -1) } : p));
    }
  }, [appUserId, likedPostIds]);

  const handleToggleRepost = useCallback(async (postId) => {
    if (!appUserId) return;
    const was = repostedPostIds.has(postId);
    setRepostedPostIds((prev) => { const next = new Set(prev); was ? next.delete(postId) : next.add(postId); return next; });
    setPosts((prev) => prev.map((p) => p.id === postId ? { ...p, reposts: (p.reposts || 0) + (was ? -1 : 1) } : p));
    const result = await toggleRepost(postId, appUserId);
    if (!result) {
      setRepostedPostIds((prev) => { const next = new Set(prev); was ? next.add(postId) : next.delete(postId); return next; });
      setPosts((prev) => prev.map((p) => p.id === postId ? { ...p, reposts: (p.reposts || 0) + (was ? 1 : -1) } : p));
    }
  }, [appUserId, repostedPostIds]);

  const handleDeletePost = useCallback(async (postId) => {
    if (!appUserId) return;
    const result = await deletePost(postId, appUserId);
    if (result?.success) { setPosts((prev) => prev.filter((p) => p.id !== postId)); setViewedPosts((prev) => prev.filter((p) => p.id !== postId)); setOwnPosts((prev) => prev.filter((p) => p.id !== postId)); }
  }, [appUserId]);

  const handleLoadMore = useCallback(async () => {
    if (!appUserId || loadingMore || posts.length === 0) return;
    setLoadingMore(true);
    const more = await fetchPosts({ before: posts[posts.length - 1].createdAt });
    if (more?.length > 0) { setPosts((prev) => [...prev, ...more]); setHasMore(more.length >= 20); } else setHasMore(false);
    setLoadingMore(false);
  }, [appUserId, loadingMore, posts]);

  const handleFollowToggle = useCallback(async () => {
    if (!appUserId || !viewedUserId) return;
    isFollowingViewed ? await unfollowUser(appUserId, viewedUserId) : await followUser(appUserId, viewedUserId);
    const [ownU, viewedU, fol] = await Promise.all([fetchUser(appUserId), fetchUser(viewedUserId), checkFollowing(appUserId, viewedUserId)]);
    if (ownU) setUser(ownU); if (viewedU) setViewedUser(viewedU); setIsFollowingViewed(fol);
    if (!fol) { const t = await fetchTop8(appUserId); if (t) setTop8(t); }
  }, [appUserId, viewedUserId, isFollowingViewed]);

  const handleAddToTop8 = useCallback(async () => {
    if (!appUserId || !viewedUserId) return;
    await addToTop8(appUserId, viewedUserId);
    const t = await fetchTop8(appUserId); if (t) setTop8(t);
  }, [appUserId, viewedUserId]);

  const handleRemoveFromTop8 = useCallback(async (targetUserId) => {
    if (!appUserId) return;
    await removeFromTop8(appUserId, targetUserId);
    const t = await fetchTop8(appUserId); if (t) setTop8(t);
    if (viewedUserId) { const vt = await fetchTop8(viewedUserId); if (vt) setViewedTop8(vt); }
  }, [appUserId, viewedUserId]);

  const handleAddTrack = useCallback(async (title, artist) => {
    if (!appUserId) return; await addPlaylistTrack(appUserId, title, artist);
    const d = await fetchPlaylist(appUserId); if (d) setPlaylist(d);
  }, [appUserId]);

  const handleRemoveTrack = useCallback(async (trackId) => {
    if (!appUserId) return; await removePlaylistTrack(appUserId, trackId);
    const d = await fetchPlaylist(appUserId); if (d) setPlaylist(d);
  }, [appUserId]);

  const handleReorderTrack = useCallback(async (trackId, newPos) => {
    if (!appUserId) return; await reorderPlaylistTrack(appUserId, trackId, newPos);
    const d = await fetchPlaylist(appUserId); if (d) setPlaylist(d);
  }, [appUserId]);

  const handleOpenNotifications = useCallback(async () => {
    if (!appUserId) return;
    const data = await fetchNotifications(appUserId); if (data) setNotifications(data);
    setView("notifications");
  }, [appUserId]);

  const handleMarkAllRead = useCallback(async () => {
    if (!appUserId) return;
    await markAllNotificationsRead(appUserId);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true }))); setUnreadCount(0);
  }, [appUserId]);

  const [pendingConvoId, setPendingConvoId] = useState(null);

  const handleSendMessage = useCallback(async (targetUserId) => {
    if (!appUserId) return;
    const convoId = await getOrCreateConversation(appUserId, targetUserId);
    if (convoId) { setPendingConvoId(convoId); setView("messages"); }
  }, [appUserId]);

  const handleAvatarUpload = useCallback(async (file) => {
    if (!appUserId) return null;
    const result = await uploadAvatar(appUserId, file);
    if (result?.url) { const u = await fetchUser(appUserId); if (u) setUser(u); }
    return result;
  }, [appUserId]);

  const refreshPosts = useCallback(async () => {
    const data = await fetchPosts(); if (data) { setPosts(data); setHasMore(data.length >= 20); }
    if (appUserId) { const myP = await fetchUserPosts(appUserId); if (myP) setOwnPosts(myP); }
  }, [appUserId]);

  const handleUpdateStatus = useCallback(async (content, emoji) => {
    if (!appUserId) return;
    await updateStatus(appUserId, content, emoji);
    const s = await fetchUserStatus(appUserId);
    setUserStatus(s);
  }, [appUserId]);

  const handleUpdateInterests = useCallback(async (interests) => {
    if (!appUserId) return;
    await updateUserInterests(appUserId, interests);
    const u = await fetchUser(appUserId);
    if (u) setUser(u);
  }, [appUserId]);

  const handleUpdateProfileEmoji = useCallback(async (emoji) => {
    if (!appUserId) return;
    await updateProfileEmoji(appUserId, emoji);
    const u = await fetchUser(appUserId);
    if (u) setUser(u);
  }, [appUserId]);

  const handleSetView = useCallback((v) => {
    if (v === "profile") { setViewedUserId(null); }
    if (v === "notifications") { handleOpenNotifications(); return; }
    setView(v);
  }, [handleOpenNotifications]);

  const handleRoomChange = useCallback((roomId) => {
    if (roomId === "__create__") { setShowCreateRoom(true); return; }
    setActiveRoom(roomId);
    setView("feed");
  }, []);

  const handleCreateRoom = useCallback((name, emoji, color) => {
    const id = name.toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
    if (!id || allRooms.some((r) => r.id === id)) return;
    setCustomRooms((prev) => [...prev, { id, name, emoji, accent: color, description: "" }]);
    setShowCreateRoom(false);
    setActiveRoom(id);
    setView("feed");
  }, [allRooms]);

  // ─── Loading / Auth Screens ───────────────────────────────────────────

  if (authLoading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: R.bg }}>
        <span style={{ fontSize: 64, fontWeight: 900, color: DEFAULT_ACCENT }}>n</span>
      </div>
    );
  }

  if (supabase && !authUser) {
    return <><StyleTag accent={DEFAULT_ACCENT} /><AuthView /></>;
  }

  // ─── Main Layout ──────────────────────────────────────────────────────

  return (
    <>
      <StyleTag accent={accent} />
      <div style={{ display: "flex", justifyContent: "center", minHeight: "100vh", background: R.bg }}>
        {/* Left Sidebar */}
        <LeftSidebar
          activeView={view}
          setView={handleSetView}
          user={user}
          unreadCount={unreadCount}
          onSignOut={() => signOut()}
          onPostClick={() => setView("feed")}
          accent={accent}
          activeRoom={activeRoom}
          onRoomChange={handleRoomChange}
          customRooms={customRooms}
        />

        {/* Center Column */}
        <main className="center-column">
          {/* Mobile Top Bar */}
          <MobileTopBar
            view={view}
            isOwnProfile={isOwnProfile}
            user={user}
            onBack={() => { setViewedUserId(null); setView("feed"); }}
            onNavigateHome={() => { setViewedUserId(null); setView("feed"); }}
            onNavigateProfile={() => { setViewedUserId(null); setView("profile"); }}
            onNavigateNotifications={handleOpenNotifications}
            onNavigateMessages={() => setView("messages")}
            onNavigateSettings={() => setView("settings")}
            accent={accent}
            unreadCount={unreadCount}
          />

          {view === "feed" && (
            <FeedView
              posts={posts}
              user={user}
              appUserId={appUserId}
              likedPostIds={likedPostIds}
              repostedPostIds={repostedPostIds}
              onToggleLike={handleToggleLike}
              onToggleRepost={handleToggleRepost}
              onDeletePost={handleDeletePost}
              onNavigateToProfile={navigateToProfile}
              hasMore={hasMore}
              onLoadMore={handleLoadMore}
              loadingMore={loadingMore}
              onPostCreated={refreshPosts}
              accent={accent}
              activeRoom={activeRoom}
              onRoomChange={handleRoomChange}
              customRooms={customRooms}
            />
          )}
          {view === "profile" && (isOwnProfile ? user : viewedUser) && (
            isMobile ? (
              <MobileProfileView
                user={isOwnProfile ? user : viewedUser}
                posts={isOwnProfile ? ownPosts : viewedPosts}
                top8={isOwnProfile ? top8 : viewedTop8}
                appUserId={appUserId}
                viewedUserId={viewedUserId}
                isOwnProfile={isOwnProfile}
                isFollowing={isFollowingViewed}
                onFollowToggle={handleFollowToggle}
                onNavigateToProfile={navigateToProfile}
                onSendMessage={handleSendMessage}
                onUpdateStatus={handleUpdateStatus}
                onUpdateInterests={handleUpdateInterests}
                onAvatarUpload={handleAvatarUpload}
                onUpdateProfileEmoji={handleUpdateProfileEmoji}
                userStatus={isOwnProfile ? userStatus : viewedUserStatus}
                likedPostIds={likedPostIds}
                repostedPostIds={repostedPostIds}
                onToggleLike={handleToggleLike}
                onToggleRepost={handleToggleRepost}
                onDeletePost={handleDeletePost}
                accent={accent}
              />
            ) : (
              <ProfileView
                user={isOwnProfile ? user : viewedUser}
                posts={isOwnProfile ? ownPosts : viewedPosts}
                top8={isOwnProfile ? top8 : viewedTop8}
                playlist={isOwnProfile ? playlist : viewedPlaylist}
                appUserId={appUserId}
                viewedUserId={viewedUserId}
                isOwnProfile={isOwnProfile}
                isFollowing={isFollowingViewed}
                isInMyTop8={isInMyTop8}
                onFollowToggle={handleFollowToggle}
                onAddToTop8={handleAddToTop8}
                onRemoveFromTop8={handleRemoveFromTop8}
                onNavigateToProfile={navigateToProfile}
                onBack={() => { setViewedUserId(null); setView("feed"); }}
                onAddTrack={handleAddTrack}
                onRemoveTrack={handleRemoveTrack}
                onReorderTrack={handleReorderTrack}
                onSendMessage={handleSendMessage}
                onAvatarUpload={handleAvatarUpload}
                onUserUpdated={async () => { const u = await fetchUser(appUserId); if (u) setUser(u); }}
                likedPostIds={likedPostIds}
                repostedPostIds={repostedPostIds}
                onToggleLike={handleToggleLike}
                onToggleRepost={handleToggleRepost}
                onDeletePost={handleDeletePost}
                accent={accent}
                userStatus={isOwnProfile ? userStatus : viewedUserStatus}
                onUpdateStatus={handleUpdateStatus}
                onUpdateInterests={handleUpdateInterests}
                onUpdateProfileEmoji={handleUpdateProfileEmoji}
              />
            )
          )}
          {view === "notifications" && (
            <NotificationsView
              notifications={notifications}
              onNavigateToProfile={(id) => navigateToProfile(id)}
              onMarkAllRead={handleMarkAllRead}
              appUserId={appUserId}
              accent={accent}
            />
          )}
          {view === "messages" && (
            <MessagesView appUserId={appUserId} onNavigateToProfile={navigateToProfile} accent={accent} initialConvoId={pendingConvoId} onClearInitialConvo={() => setPendingConvoId(null)} />
          )}
          {view === "explore" && (
            <SearchView onNavigateToProfile={navigateToProfile} accent={accent} />
          )}
          {view === "settings" && (
            <div style={{ padding: 40, textAlign: "center" }}>
              <Settings size={32} style={{ color: R.gray, marginBottom: 12 }} />
              <div style={{ fontSize: 20, fontWeight: 800, color: R.text, marginBottom: 8 }}>Settings</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12, alignItems: "center", marginTop: 24 }}>
                <button onClick={() => { setViewedUserId(null); setView("profile"); }} style={{ background: "transparent", border: `1px solid ${R.border}`, color: R.text, borderRadius: 9999, padding: "12px 24px", fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 8, width: 200, justifyContent: "center" }}>
                  <User size={18} /> Profile
                </button>
                <button onClick={() => signOut()} style={{ background: "transparent", border: `1px solid ${R.border}`, color: R.pink, borderRadius: 9999, padding: "12px 24px", fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 8, width: 200, justifyContent: "center" }}>
                  <LogOut size={18} /> Sign Out
                </button>
              </div>
            </div>
          )}
        </main>

        {/* Right Sidebar */}
        <RightSidebar onNavigateToProfile={navigateToProfile} accent={accent} onRoomChange={handleRoomChange} />
      </div>

      {/* Mobile FAB */}
      <button className="mobile-fab" onClick={() => setShowMobileCompose(true)} style={{ background: accent, color: "#fff" }}>
        <Pencil size={24} />
      </button>

      {/* Mobile Compose Modal */}
      <AnimatePresence>
        {showMobileCompose && (
          <MobileComposeModal
            user={user}
            appUserId={appUserId}
            onPostCreated={refreshPosts}
            onClose={() => setShowMobileCompose(false)}
            accent={accent}
            activeRoom={activeRoom}
            onRoomChange={handleRoomChange}
          />
        )}
      </AnimatePresence>

      {/* Mobile Bottom Bar */}
      <MobileBottomBar activeView={view} setView={handleSetView} accent={accent} />

      {/* Create Room Modal */}
      <AnimatePresence>
        {showCreateRoom && (
          <CreateRoomModal onClose={() => setShowCreateRoom(false)} onCreate={handleCreateRoom} accent={accent} />
        )}
      </AnimatePresence>
    </>
  );
}
