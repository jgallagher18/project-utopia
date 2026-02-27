import { supabase } from "./supabase";

/**
 * Format a date string/object to "Mon YYYY"
 */
function formatJoinDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

export async function fetchUser(userId) {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from("users")
      .select("username, display_name, bio, avatar_url, created_at, follower_count, following_count")
      .eq("id", userId)
      .single();

    if (error) throw error;

    return {
      name: data.username,
      displayName: data.display_name,
      bio: data.bio,
      avatar: data.avatar_url,
      joinDate: formatJoinDate(data.created_at),
      followers: data.follower_count,
      following: data.following_count,
    };
  } catch (err) {
    console.error("fetchUser failed:", err);
    return null;
  }
}

export async function fetchPosts({ limit = 20, before = null } = {}) {
  if (!supabase) return null;
  try {
    let query = supabase
      .from("posts")
      .select("id, content, created_at, like_count, reply_count, repost_count, user_id, users!posts_user_id_fkey(username, human_verified, avatar_url, display_name)")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (before) {
      query = query.lt("created_at", before);
    }

    const { data, error } = await query;
    if (error) throw error;

    return data.map((p) => ({
      id: p.id,
      userId: p.user_id,
      user: p.users.username,
      displayName: p.users.display_name,
      avatar: p.users.avatar_url,
      content: p.content,
      timestamp: new Date(p.created_at).getTime(),
      createdAt: p.created_at,
      humanVerified: p.users.human_verified,
      reason: "follow",
      likes: p.like_count,
      replies: p.reply_count,
      reposts: p.repost_count,
    }));
  } catch (err) {
    console.error("fetchPosts failed:", err);
    return null;
  }
}

export async function fetchTop8(userId) {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from("relationships")
      .select("position, following_id, users:following_id(username)")
      .eq("follower_id", userId)
      .eq("type", "top8")
      .order("position");

    if (error) throw error;

    return data.map((r) => ({
      id: r.position,
      userId: r.following_id,
      name: r.users.username,
      label: r.users.username,
    }));
  } catch (err) {
    console.error("fetchTop8 failed:", err);
    return null;
  }
}

export async function fetchPlaylist(userId) {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from("playlist_items")
      .select("id, title, artist, position")
      .eq("user_id", userId)
      .order("position");

    if (error) throw error;

    return data.map((item) => ({
      id: item.id,
      title: item.title,
      artist: item.artist,
      position: item.position,
    }));
  } catch (err) {
    console.error("fetchPlaylist failed:", err);
    return null;
  }
}

export async function fetchUserPreferences(userId) {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from("user_preferences")
      .select("bg_color, accent_color, border_color")
      .eq("user_id", userId)
      .single();

    if (error) throw error;

    return {
      bg: data.bg_color,
      accent: data.accent_color,
      border: data.border_color,
    };
  } catch (err) {
    console.error("fetchUserPreferences failed:", err);
    return null;
  }
}

export async function createPost(userId, content) {
  if (!supabase) return null;
  try {
    const { error } = await supabase
      .from("posts")
      .insert({ user_id: userId, content });

    if (error) throw error;
    return { success: true };
  } catch (err) {
    console.error("createPost failed:", err);
    return { error: err.message || "Failed to create post" };
  }
}

export async function updateUserPreferences(userId, { bg, accent, border }) {
  if (!supabase) return null;
  try {
    const { error } = await supabase
      .from("user_preferences")
      .upsert(
        { user_id: userId, bg_color: bg, accent_color: accent, border_color: border },
        { onConflict: "user_id" }
      );

    if (error) throw error;
    return { success: true };
  } catch (err) {
    console.error("updateUserPreferences failed:", err);
    return { error: err.message || "Failed to update preferences" };
  }
}

export async function updateUserProfile(userId, { displayName, bio, avatarUrl }) {
  if (!supabase) return null;
  try {
    const { error } = await supabase
      .from("users")
      .update({ display_name: displayName, bio, avatar_url: avatarUrl })
      .eq("id", userId);

    if (error) throw error;
    return { success: true };
  } catch (err) {
    console.error("updateUserProfile failed:", err);
    return { error: err.message || "Failed to update profile" };
  }
}

export async function deletePost(postId, userId) {
  if (!supabase) return null;
  try {
    const { error } = await supabase
      .from("posts")
      .delete()
      .eq("id", postId)
      .eq("user_id", userId);

    if (error) throw error;
    return { success: true };
  } catch (err) {
    console.error("deletePost failed:", err);
    return { error: err.message || "Failed to delete post" };
  }
}

export async function fetchUserPosts(userId) {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from("posts")
      .select("id, content, created_at, like_count, reply_count, repost_count, user_id, users!posts_user_id_fkey(username, human_verified, avatar_url, display_name)")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return data.map((p) => ({
      id: p.id,
      userId: p.user_id,
      user: p.users.username,
      displayName: p.users.display_name,
      avatar: p.users.avatar_url,
      content: p.content,
      timestamp: new Date(p.created_at).getTime(),
      createdAt: p.created_at,
      humanVerified: p.users.human_verified,
      reason: "follow",
      likes: p.like_count,
      replies: p.reply_count,
      reposts: p.repost_count,
    }));
  } catch (err) {
    console.error("fetchUserPosts failed:", err);
    return null;
  }
}

export async function toggleLike(postId, userId) {
  if (!supabase) return null;
  try {
    const { data: existing } = await supabase
      .from("post_likes")
      .select("post_id")
      .eq("post_id", postId)
      .eq("user_id", userId)
      .maybeSingle();

    if (existing) {
      const { error } = await supabase
        .from("post_likes")
        .delete()
        .eq("post_id", postId)
        .eq("user_id", userId);
      if (error) throw error;
      return { liked: false };
    } else {
      const { error } = await supabase
        .from("post_likes")
        .insert({ post_id: postId, user_id: userId });
      if (error) throw error;
      return { liked: true };
    }
  } catch (err) {
    console.error("toggleLike failed:", err);
    return null;
  }
}

export async function fetchUserLikes(userId) {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from("post_likes")
      .select("post_id")
      .eq("user_id", userId);

    if (error) throw error;
    return data.map((r) => r.post_id);
  } catch (err) {
    console.error("fetchUserLikes failed:", err);
    return null;
  }
}

export async function fetchReplies(postId) {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from("post_replies")
      .select("id, content, created_at, user_id, users!post_replies_user_id_fkey(username, avatar_url)")
      .eq("post_id", postId)
      .order("created_at", { ascending: true });

    if (error) throw error;

    return data.map((r) => ({
      id: r.id,
      userId: r.user_id,
      user: r.users.username,
      avatar: r.users.avatar_url,
      content: r.content,
      timestamp: new Date(r.created_at).getTime(),
    }));
  } catch (err) {
    console.error("fetchReplies failed:", err);
    return null;
  }
}

export async function createReply(postId, userId, content) {
  if (!supabase) return null;
  try {
    const { error } = await supabase
      .from("post_replies")
      .insert({ post_id: postId, user_id: userId, content });

    if (error) throw error;
    return { success: true };
  } catch (err) {
    console.error("createReply failed:", err);
    return { error: err.message || "Failed to create reply" };
  }
}

export async function followUser(followerId, followingId) {
  if (!supabase) return null;
  try {
    const { error } = await supabase
      .from("relationships")
      .insert({ follower_id: followerId, following_id: followingId, type: "follow" });

    if (error) throw error;
    return { success: true };
  } catch (err) {
    console.error("followUser failed:", err);
    return { error: err.message || "Failed to follow user" };
  }
}

export async function unfollowUser(followerId, followingId) {
  if (!supabase) return null;
  try {
    const { error } = await supabase
      .from("relationships")
      .delete()
      .eq("follower_id", followerId)
      .eq("following_id", followingId)
      .eq("type", "follow");

    if (error) throw error;
    return { success: true };
  } catch (err) {
    console.error("unfollowUser failed:", err);
    return { error: err.message || "Failed to unfollow user" };
  }
}

export async function checkFollowing(followerId, followingId) {
  if (!supabase) return false;
  try {
    const { data, error } = await supabase
      .from("relationships")
      .select("id")
      .eq("follower_id", followerId)
      .eq("following_id", followingId)
      .eq("type", "follow")
      .maybeSingle();

    if (error) throw error;
    return !!data;
  } catch (err) {
    console.error("checkFollowing failed:", err);
    return false;
  }
}

export async function addToTop8(followerId, followingId) {
  if (!supabase) return null;
  try {
    const { data: existing } = await supabase
      .from("relationships")
      .select("position")
      .eq("follower_id", followerId)
      .eq("type", "top8")
      .order("position", { ascending: false })
      .limit(1);

    const nextPos = existing && existing.length > 0 ? existing[0].position + 1 : 1;
    if (nextPos > 8) return { error: "Top 8 is full" };

    const { error } = await supabase
      .from("relationships")
      .insert({ follower_id: followerId, following_id: followingId, type: "top8", position: nextPos });

    if (error) throw error;
    return { success: true };
  } catch (err) {
    console.error("addToTop8 failed:", err);
    return { error: err.message || "Failed to add to Top 8" };
  }
}

export async function removeFromTop8(followerId, followingId) {
  if (!supabase) return null;
  try {
    const { error: delError } = await supabase
      .from("relationships")
      .delete()
      .eq("follower_id", followerId)
      .eq("following_id", followingId)
      .eq("type", "top8");

    if (delError) throw delError;

    // Re-compact positions to 1..N
    const { data: remaining, error: fetchError } = await supabase
      .from("relationships")
      .select("id, position")
      .eq("follower_id", followerId)
      .eq("type", "top8")
      .order("position");

    if (fetchError) throw fetchError;

    for (let i = 0; i < remaining.length; i++) {
      if (remaining[i].position !== i + 1) {
        await supabase
          .from("relationships")
          .update({ position: i + 1 })
          .eq("id", remaining[i].id);
      }
    }

    return { success: true };
  } catch (err) {
    console.error("removeFromTop8 failed:", err);
    return { error: err.message || "Failed to remove from Top 8" };
  }
}

// ─── Search ──────────────────────────────────────────────────────────────────

export async function searchUsers(query) {
  if (!supabase || !query.trim()) return [];
  try {
    const { data, error } = await supabase
      .from("users")
      .select("id, username, display_name, avatar_url")
      .or(`username.ilike.%${query}%,display_name.ilike.%${query}%`)
      .limit(10);

    if (error) throw error;

    return data.map((u) => ({
      id: u.id,
      username: u.username,
      displayName: u.display_name,
      avatar: u.avatar_url,
    }));
  } catch (err) {
    console.error("searchUsers failed:", err);
    return [];
  }
}

// ─── Reposts ─────────────────────────────────────────────────────────────────

export async function toggleRepost(postId, userId) {
  if (!supabase) return null;
  try {
    const { data: existing } = await supabase
      .from("reposts")
      .select("post_id")
      .eq("post_id", postId)
      .eq("user_id", userId)
      .maybeSingle();

    if (existing) {
      const { error } = await supabase
        .from("reposts")
        .delete()
        .eq("post_id", postId)
        .eq("user_id", userId);
      if (error) throw error;
      return { reposted: false };
    } else {
      const { error } = await supabase
        .from("reposts")
        .insert({ post_id: postId, user_id: userId });
      if (error) throw error;
      return { reposted: true };
    }
  } catch (err) {
    console.error("toggleRepost failed:", err);
    return null;
  }
}

export async function fetchUserReposts(userId) {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from("reposts")
      .select("post_id")
      .eq("user_id", userId);

    if (error) throw error;
    return data.map((r) => r.post_id);
  } catch (err) {
    console.error("fetchUserReposts failed:", err);
    return null;
  }
}

// ─── Notifications ───────────────────────────────────────────────────────────

export async function fetchNotifications(userId, { limit = 30 } = {}) {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from("notifications")
      .select("id, type, post_id, read, created_at, actor_id, actor:actor_id(username)")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw error;

    return data.map((n) => ({
      id: n.id,
      type: n.type,
      postId: n.post_id,
      actorId: n.actor_id,
      actorName: n.actor.username,
      read: n.read,
      timestamp: new Date(n.created_at).getTime(),
    }));
  } catch (err) {
    console.error("fetchNotifications failed:", err);
    return null;
  }
}

export async function markNotificationRead(notificationId) {
  if (!supabase) return null;
  try {
    const { error } = await supabase
      .from("notifications")
      .update({ read: true })
      .eq("id", notificationId);

    if (error) throw error;
    return { success: true };
  } catch (err) {
    console.error("markNotificationRead failed:", err);
    return null;
  }
}

export async function markAllNotificationsRead(userId) {
  if (!supabase) return null;
  try {
    const { error } = await supabase
      .from("notifications")
      .update({ read: true })
      .eq("user_id", userId)
      .eq("read", false);

    if (error) throw error;
    return { success: true };
  } catch (err) {
    console.error("markAllNotificationsRead failed:", err);
    return null;
  }
}

export async function getUnreadCount(userId) {
  if (!supabase) return 0;
  try {
    const { count, error } = await supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("read", false);

    if (error) throw error;
    return count || 0;
  } catch (err) {
    console.error("getUnreadCount failed:", err);
    return 0;
  }
}

// ─── Direct Messages ─────────────────────────────────────────────────────────

export async function getOrCreateConversation(userId1, userId2) {
  if (!supabase) return null;
  try {
    // Normalize order so user1_id < user2_id
    const [u1, u2] = userId1 < userId2 ? [userId1, userId2] : [userId2, userId1];

    const { data: existing } = await supabase
      .from("conversations")
      .select("id")
      .eq("user1_id", u1)
      .eq("user2_id", u2)
      .maybeSingle();

    if (existing) return existing.id;

    const { data, error } = await supabase
      .from("conversations")
      .insert({ user1_id: u1, user2_id: u2 })
      .select("id")
      .single();

    if (error) throw error;
    return data.id;
  } catch (err) {
    console.error("getOrCreateConversation failed:", err);
    return null;
  }
}

export async function fetchConversations(userId) {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from("conversations")
      .select("id, updated_at, user1_id, user2_id, user1:user1_id(username, display_name, avatar_url), user2:user2_id(username, display_name, avatar_url)")
      .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
      .order("updated_at", { ascending: false });

    if (error) throw error;

    return data.map((c) => {
      const other = c.user1_id === userId ? c.user2 : c.user1;
      const otherId = c.user1_id === userId ? c.user2_id : c.user1_id;
      return {
        id: c.id,
        otherUserId: otherId,
        otherUsername: other.username,
        otherDisplayName: other.display_name,
        otherAvatar: other.avatar_url,
        updatedAt: new Date(c.updated_at).getTime(),
      };
    });
  } catch (err) {
    console.error("fetchConversations failed:", err);
    return null;
  }
}

export async function fetchMessages(conversationId, { limit = 50 } = {}) {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from("messages")
      .select("id, content, created_at, sender_id, sender:sender_id(username)")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true })
      .limit(limit);

    if (error) throw error;

    return data.map((m) => ({
      id: m.id,
      senderId: m.sender_id,
      senderName: m.sender.username,
      content: m.content,
      timestamp: new Date(m.created_at).getTime(),
    }));
  } catch (err) {
    console.error("fetchMessages failed:", err);
    return null;
  }
}

export async function sendMessage(conversationId, senderId, content) {
  if (!supabase) return null;
  try {
    const { error } = await supabase
      .from("messages")
      .insert({ conversation_id: conversationId, sender_id: senderId, content });

    if (error) throw error;
    return { success: true };
  } catch (err) {
    console.error("sendMessage failed:", err);
    return { error: err.message || "Failed to send message" };
  }
}

// ─── Avatar Upload ───────────────────────────────────────────────────────────

export async function uploadAvatar(userId, file) {
  if (!supabase) return null;
  try {
    const ext = file.name.split(".").pop();
    const path = `${userId}/avatar.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(path, file, { upsert: true });

    if (uploadError) throw uploadError;

    const { data } = supabase.storage
      .from("avatars")
      .getPublicUrl(path);

    // Append cache-buster so browser picks up new avatar
    const url = `${data.publicUrl}?t=${Date.now()}`;

    // Update user record
    const { error: updateError } = await supabase
      .from("users")
      .update({ avatar_url: url })
      .eq("id", userId);

    if (updateError) throw updateError;

    return { url };
  } catch (err) {
    console.error("uploadAvatar failed:", err);
    return { error: err.message || "Failed to upload avatar" };
  }
}

// ─── Playlist ────────────────────────────────────────────────────────────────

export async function addPlaylistTrack(userId, title, artist) {
  if (!supabase) return null;
  try {
    const { data: existing } = await supabase
      .from("playlist_items")
      .select("position")
      .eq("user_id", userId)
      .order("position", { ascending: false })
      .limit(1);

    const nextPos = existing && existing.length > 0 ? existing[0].position + 1 : 1;

    const { error } = await supabase
      .from("playlist_items")
      .insert({ user_id: userId, title, artist, position: nextPos });

    if (error) throw error;
    return { success: true };
  } catch (err) {
    console.error("addPlaylistTrack failed:", err);
    return { error: err.message || "Failed to add track" };
  }
}

export async function removePlaylistTrack(userId, trackId) {
  if (!supabase) return null;
  try {
    const { error: delError } = await supabase
      .from("playlist_items")
      .delete()
      .eq("id", trackId)
      .eq("user_id", userId);

    if (delError) throw delError;

    // Re-compact positions to 1..N
    const { data: remaining, error: fetchError } = await supabase
      .from("playlist_items")
      .select("id, position")
      .eq("user_id", userId)
      .order("position");

    if (fetchError) throw fetchError;

    for (let i = 0; i < remaining.length; i++) {
      if (remaining[i].position !== i + 1) {
        await supabase
          .from("playlist_items")
          .update({ position: i + 1 })
          .eq("id", remaining[i].id);
      }
    }

    return { success: true };
  } catch (err) {
    console.error("removePlaylistTrack failed:", err);
    return { error: err.message || "Failed to remove track" };
  }
}

export async function reorderPlaylistTrack(userId, trackId, newPosition) {
  if (!supabase) return null;
  try {
    // Get all tracks in order
    const { data: tracks, error: fetchError } = await supabase
      .from("playlist_items")
      .select("id, position")
      .eq("user_id", userId)
      .order("position");

    if (fetchError) throw fetchError;

    const oldIndex = tracks.findIndex((t) => t.id === trackId);
    if (oldIndex === -1) return { error: "Track not found" };

    const newIndex = newPosition - 1;
    if (newIndex < 0 || newIndex >= tracks.length) return { error: "Invalid position" };

    // Reorder in memory
    const [moved] = tracks.splice(oldIndex, 1);
    tracks.splice(newIndex, 0, moved);

    // Update positions
    for (let i = 0; i < tracks.length; i++) {
      if (tracks[i].position !== i + 1) {
        const { error } = await supabase
          .from("playlist_items")
          .update({ position: i + 1 })
          .eq("id", tracks[i].id);
        if (error) throw error;
      }
    }

    return { success: true };
  } catch (err) {
    console.error("reorderPlaylistTrack failed:", err);
    return { error: err.message || "Failed to reorder track" };
  }
}

export async function fetchUserByAuthId(authId) {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from("users")
      .select("id, username, display_name")
      .eq("auth_id", authId)
      .single();

    if (error) throw error;

    return {
      id: data.id,
      username: data.username,
      displayName: data.display_name,
    };
  } catch (err) {
    console.error("fetchUserByAuthId failed:", err);
    return null;
  }
}
