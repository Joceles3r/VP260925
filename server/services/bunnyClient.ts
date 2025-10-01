const BUNNY_LIBRARY_ID = process.env.BUNNY_LIBRARY_ID || "";
const BUNNY_STREAM_API_KEY = process.env.BUNNY_STREAM_API_KEY || "";
const BASE_STREAM_API = `https://video.bunnycdn.com/library/${BUNNY_LIBRARY_ID}`;

function authHeaders() {
  return {
    "Content-Type": "application/json",
    "AccessKey": BUNNY_STREAM_API_KEY
  };
}

export const bunnyClient = {
  async createVideo(title: string) {
    if (!BUNNY_LIBRARY_ID || !BUNNY_STREAM_API_KEY) {
      throw new Error("Bunny.net API keys not configured");
    }

    const res = await fetch(`${BASE_STREAM_API}/videos`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ title })
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Bunny createVideo failed: ${res.status} ${text}`);
    }

    return res.json() as Promise<{ guid: string; title: string; [key: string]: any }>;
  },

  getUploadUrl(guid: string) {
    return `${BASE_STREAM_API}/videos/${guid}`;
  },

  async getStatus(guid: string) {
    const res = await fetch(`${BASE_STREAM_API}/videos/${guid}`, {
      headers: authHeaders()
    });

    if (!res.ok) {
      throw new Error(`Bunny getStatus failed: ${res.status}`);
    }

    return res.json();
  },

  async deleteVideo(guid: string) {
    const res = await fetch(`${BASE_STREAM_API}/videos/${guid}`, {
      method: "DELETE",
      headers: authHeaders()
    });

    if (!res.ok) {
      throw new Error(`Bunny delete failed: ${res.status}`);
    }

    return true;
  },

  hlsManifestUrl(guid: string) {
    return `${BASE_STREAM_API}/videos/${guid}/playlist.m3u8`;
  }
};
