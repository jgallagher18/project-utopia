import { supabase } from "./supabase";

export async function signUp({ email, password, username, displayName }) {
  if (!supabase) return { user: null, error: "Supabase not configured" };

  const { data: authData, error: authError } =
    await supabase.auth.signUp({ email, password });

  if (authError) return { user: null, error: authError.message };

  const authUser = authData.user;

  // Insert into public users table linked by auth_id
  const { error: insertError } = await supabase.from("users").insert({
    auth_id: authUser.id,
    username,
    display_name: displayName,
  });

  if (insertError) return { user: null, error: insertError.message };

  // Fetch the newly created user row to get its id
  const { data: newUser, error: fetchError } = await supabase
    .from("users")
    .select("id")
    .eq("auth_id", authUser.id)
    .single();

  if (fetchError) return { user: null, error: fetchError.message };

  // Insert default user_preferences row
  await supabase.from("user_preferences").insert({ user_id: newUser.id });

  return { user: authUser, error: null };
}

export async function signIn({ email, password }) {
  if (!supabase) return { user: null, error: "Supabase not configured" };

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) return { user: null, error: error.message };
  return { user: data.user, error: null };
}

export async function signOut() {
  if (!supabase) return { error: null };

  const { error } = await supabase.auth.signOut();
  return { error: error?.message ?? null };
}

export async function getCurrentAuthUser() {
  if (!supabase) return null;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user ?? null;
}

export function onAuthChange(callback) {
  if (!supabase) return { unsubscribe: () => {} };

  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(session?.user ?? null);
  });

  return { unsubscribe: () => subscription.unsubscribe() };
}
