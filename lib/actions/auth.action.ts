"use server";

import { auth, db } from "@/firebase/admin";
import { cookies } from "next/headers";

// Session duration (1 week)
const SESSION_DURATION = 60 * 60 * 24 * 7;

// Set session cookie
export async function setSessionCookie(idToken: string) {
  const cookieStore = await cookies();

  // Create session cookie
  const sessionCookie = await auth.createSessionCookie(idToken, {
    expiresIn: SESSION_DURATION * 1000, // milliseconds
  });

  // Set cookie in the browser
  cookieStore.set("session", sessionCookie, {
    maxAge: SESSION_DURATION,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    sameSite: "lax",
  });
}

export async function signUp(params: SignUpParams) {
  const { uid, name, email } = params;

  try {
    // check if user exists in db
    const userRecord = await db.collection("users").doc(uid).get();
    if (userRecord.exists)
      return {
        success: false,
        message: "User already exists. Please sign in.",
      };

    // save user to db
    await db.collection("users").doc(uid).set({
      name,
      email,
      createdAt: new Date().toISOString(),
    });

    return {
      success: true,
      message: "Account created successfully. Please sign in.",
    };
  } catch (error: any) {
    console.error("Error creating user:", error);

    // Handle Firebase specific errors
    if (error.code === "auth/email-already-exists") {
      return {
        success: false,
        message: "This email is already in use",
      };
    }

    return {
      success: false,
      message: "Failed to create account. Please try again.",
    };
  }
}

export async function signIn(params: SignInParams) {
  const { email, idToken } = params;

  try {
    // Verify the user exists and get their info
    const userRecord = await auth.getUserByEmail(email);
    if (!userRecord) {
      return {
        success: false,
        message: "User does not exist. Create an account.",
      };
    }

    // Set the session cookie
    await setSessionCookie(idToken);

    // ✅ FIXED: Return success response
    return {
      success: true,
      message: "Signed in successfully.",
    };
  } catch (error: any) {
    console.error("Sign in error:", error);

    // Handle specific Firebase errors
    if (error.code === "auth/user-not-found") {
      return {
        success: false,
        message: "No account found with this email. Please sign up.",
      };
    }

    if (
      error.code === "auth/wrong-password" ||
      error.code === "auth/invalid-credential"
    ) {
      return {
        success: false,
        message: "Invalid email or password.",
      };
    }

    return {
      success: false,
      message: "Failed to sign in. Please try again.",
    };
  }
}

// Sign out user by clearing the session cookie
export async function signOut() {
  const cookieStore = await cookies();
  cookieStore.delete("session");

  return {
    success: true,
    message: "Signed out successfully.",
  };
}

// Get current user from session cookie with timeout and error handling
export async function getCurrentUser(): Promise<User | null> {
  const cookieStore = await cookies();

  const sessionCookie = cookieStore.get("session")?.value;
  if (!sessionCookie) return null;

  try {
    // Add timeout wrapper to prevent hanging
    const authPromise = auth.verifySessionCookie(sessionCookie, true);
    const timeoutPromise = new Promise(
      (_, reject) => setTimeout(() => reject(new Error("Auth timeout")), 5000) // 5 second timeout
    );

    const decodedClaims = await Promise.race([authPromise, timeoutPromise]);

    // get user info from db with timeout
    const dbPromise = db
      .collection("users")
      .doc((decodedClaims as any).uid)
      .get();
    const dbTimeoutPromise = new Promise(
      (_, reject) => setTimeout(() => reject(new Error("DB timeout")), 5000) // 5 second timeout
    );

    const userRecord = (await Promise.race([
      dbPromise,
      dbTimeoutPromise,
    ])) as any;

    if (!userRecord.exists) {
      // ✅ FIXED: Don't delete cookie here, just return null
      return null;
    }

    return {
      ...userRecord.data(),
      id: userRecord.id,
    } as User;
  } catch (error) {
    console.log("Auth error (non-blocking):", error);

    // ✅ FIXED: Don't delete cookie here, just return null
    // Let the UI handle invalid sessions by redirecting to login
    return null;
  }
}

// Check if user is authenticated with fallback
export async function isAuthenticated() {
  try {
    const user = await getCurrentUser();
    return !!user;
  } catch (error) {
    console.log("Authentication check failed (non-blocking):", error);
    // Return false instead of throwing to prevent blocking UI
    return false;
  }
}
