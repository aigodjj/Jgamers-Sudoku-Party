import { NextResponse } from "next/server";

export function jsonOk<T>(data: T, init?: number) {
  return NextResponse.json({ ok: true, data }, { status: init ?? 200 });
}

export function jsonError(status: number, message: string, code = "error") {
  return NextResponse.json({ ok: false, error: { code, message } }, { status });
}

export async function withErrorHandling(handler: () => Promise<NextResponse>): Promise<NextResponse> {
  try {
    return await handler();
  } catch (err) {
    if (err instanceof Error && err.message === "Missing player session cookie") {
      return jsonError(401, "找不到玩家資料，請重新整理頁面", "session_missing");
    }
    console.error(err);
    return jsonError(500, "伺服器發生錯誤，請稍後再試", "internal_error");
  }
}
