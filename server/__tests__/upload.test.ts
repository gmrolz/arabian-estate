import { describe, it, expect, beforeAll, afterAll } from "vitest";
import express from "express";
import multer from "multer";
import { createServer } from "http";
import type { Server } from "http";

describe("Upload Endpoints", () => {
  let app: express.Application;
  let server: Server;
  let port: number;

  beforeAll(async () => {
    app = express();
    app.use(express.json({ limit: "50mb" }));

    // Mock upload middleware
    const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

    // Mock upload endpoint that throws an error
    app.post("/api/upload", upload.single("file"), async (req: any, res: any) => {
      try {
        if (!req.file) return res.status(400).json({ error: "No file provided" });
        // Simulate an error during upload
        throw new Error("Storage service failed");
      } catch (err: any) {
        console.error("Upload error:", err);
        return res.status(500).json({ error: err.message || "Upload failed" });
      }
    });

    // Error handling middleware
    app.use((err: any, req: any, res: any, next: any) => {
      if (req.path.startsWith("/api/")) {
        console.error("API Error:", err);
        return res.status(500).json({ error: err.message || "Internal Server Error" });
      }
      next(err);
    });

    server = createServer(app);
    port = 9999;
    await new Promise<void>((resolve) => {
      server.listen(port, () => resolve());
    });
  });

  afterAll(() => {
    server.close();
  });

  it("should return JSON error when no file is provided", async () => {
    const response = await fetch(`http://localhost:${port}/api/upload`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data).toHaveProperty("error");
    expect(data.error).toBe("No file provided");
  });

  it("should return JSON error on storage failure", async () => {
    const formData = new FormData();
    const blob = new Blob(["test"], { type: "text/plain" });
    formData.append("file", blob, "test.txt");

    const response = await fetch(`http://localhost:${port}/api/upload`, {
      method: "POST",
      body: formData,
    });

    expect(response.status).toBe(500);
    const data = await response.json();
    expect(data).toHaveProperty("error");
    expect(data.error).toBe("Storage service failed");
  });

  it("should NOT return HTML error page", async () => {
    const formData = new FormData();
    const blob = new Blob(["test"], { type: "text/plain" });
    formData.append("file", blob, "test.txt");

    const response = await fetch(`http://localhost:${port}/api/upload`, {
      method: "POST",
      body: formData,
    });

    const contentType = response.headers.get("content-type");
    expect(contentType).toContain("application/json");
    expect(contentType).not.toContain("text/html");
  });
});
