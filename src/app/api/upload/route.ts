import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { unauthorizedResponse } from "@/lib/rbac";
import { logAuditEvent } from "@/lib/audit";
import fs from "fs/promises";
import path from "path";
import crypto from "crypto";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED_MIME_TYPES: Record<string, string> = {
  "application/pdf": ".pdf",
  "image/png": ".png",
  "image/jpeg": ".jpg",
  "image/jpg": ".jpg",
  "image/webp": ".webp",
};

export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return unauthorizedResponse();

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file payload received." }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File exceeds 5MB maximum allowed size." },
        { status: 400 }
      );
    }

    const mime = file.type.toLowerCase();
    const extension = ALLOWED_MIME_TYPES[mime];

    if (!extension) {
      return NextResponse.json(
        { error: "Invalid file format. Only PDF, PNG, JPG, and WEBP documents are permitted." },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Validate magic bytes (binary file signatures) to block disguised scripts
    const isPdf = buffer.length >= 4 && buffer.toString("utf8", 0, 4) === "%PDF";
    const isPng = buffer.length >= 4 && buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47;
    const isJpg = buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
    const isWebp = buffer.length >= 12 && buffer.toString("utf8", 8, 12) === "WEBP";

    if (!isPdf && !isPng && !isJpg && !isWebp) {
      return NextResponse.json(
        { error: "Security Alert: File binary signature does not match declared MIME format." },
        { status: 400 }
      );
    }

    // Save to public/uploads directory with random UUID
    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    await fs.mkdir(uploadsDir, { recursive: true });

    const safeFilename = `${crypto.randomUUID()}${extension}`;
    const destinationPath = path.join(uploadsDir, safeFilename);

    await fs.writeFile(destinationPath, buffer);

    await logAuditEvent({
      actorId: session.userId,
      action: "FILE_UPLOADED",
      resourceType: "ATTACHMENT",
      details: {
        originalName: file.name,
        storedName: safeFilename,
        size: file.size,
        mime,
      },
      req,
    });

    return NextResponse.json({
      success: true,
      url: `/uploads/${safeFilename}`,
      originalName: file.name,
    });
  } catch (error: any) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process file upload." },
      { status: 500 }
    );
  }
}
