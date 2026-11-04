import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

// demo 프로필 서버에 실제 HTTP 요청을 보내 제출용 원본 기록을 저장합니다.
// 실행: node scripts/verify-week6.mjs http://127.0.0.1:18086
const baseUrl = process.argv[2] ?? "http://127.0.0.1:18086";
const output = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../docs/evidence");
const runId = Date.now();
const records = [];
async function request(label, method, route, body, expected, code) {
  const response = await fetch(baseUrl + route, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const raw = await response.text();
  const result = raw ? JSON.parse(raw) : null;
  assert.equal(response.status, expected, label);
  if (code) assert.equal(result.code, code, label);
  records.push({ label, method, url: baseUrl + route, request: body ?? null,
    status: response.status, response: result });
  return result;
}
const signup = { email: `week6-${runId}@example.com`, password: "Umc!1234", nickname: "회원" + String(runId).slice(-8) };
const member = await request("회원가입 성공", "POST", "/members", signup, 201, "COMMON201");
assert.equal("password" in member.result, false);
const memberId = member.result.memberId;
await request("이메일 형식 검증 실패", "POST", "/members", {
  email: "not-an-email", password: "Umc!1234", nickname: "검증실패"
}, 400, "COMMON4001");
await request("이메일 중복", "POST", "/members", { ...signup, nickname: "중복검사" }, 409, "MEMBER4091");
await request("닉네임 중복", "POST", "/members", {
  ...signup, email: `other-${runId}@example.com`
}, 409, "MEMBER4092");
const rating = await request("평점 등록 성공", "POST", `/members/${memberId}/ratings`,
  { movieId: 550, score: 5, comment: "등록한 후기" }, 201, "COMMON201");
const ratingId = rating.result;
await request("평점 중복", "POST", `/members/${memberId}/ratings`,
  { movieId: 550, score: 4 }, 409, "RATING4091");
await request("별점 범위 검증 실패", "POST", `/members/${memberId}/ratings`,
  { movieId: 155, score: 6 }, 400, "COMMON4001");
await request("다른 회원의 평점 수정 차단", "PATCH", `/members/1/ratings/${ratingId}`,
  { score: 1 }, 403, "RATING4031");
await request("다른 회원의 평점 삭제 차단", "DELETE", `/members/1/ratings/${ratingId}`,
  null, 403, "RATING4031");
await request("평점 수정 성공", "PATCH", `/members/${memberId}/ratings/${ratingId}`,
  { score: 3, comment: "수정한 후기" }, 200, "COMMON200");
const list = await request("수정 후 조회", "GET", `/members/${memberId}/ratings`, null, 200);
assert.equal(list.length, 1);
assert.equal(list[0].score, 3);
assert.equal(list[0].comment, "수정한 후기");
await request("평점 삭제 성공 — 응답 본문 없음", "DELETE", `/members/${memberId}/ratings/${ratingId}`,
  null, 204);
const empty = await request("삭제 후 빈 목록 확인", "GET", `/members/${memberId}/ratings`, null, 200);
assert.deepEqual(empty, []);
await request("없는 평점 삭제", "DELETE", `/members/${memberId}/ratings/${ratingId}`,
  null, 404, "RATING4041");
await request("없는 회원의 평점 등록", "POST", "/members/999999999/ratings",
  { movieId: 550, score: 3 }, 404, "MEMBER4041");
await mkdir(output, { recursive: true });
const capturedAt = new Date().toISOString();
await writeFile(path.join(output, "http-records.json"),
  JSON.stringify({ capturedAt, environment: "Spring Boot demo profile / H2", records }, null, 2) + "\n");
const escape = value => String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
const pretty = value => value === null ? "(본문 없음)" : JSON.stringify(value, null, 2);
const cards = records.map((record, index) => `<article id="case-${index + 1}">
  <h2>${index + 1}. ${escape(record.label)} <b>HTTP ${record.status}</b></h2>
  <p><strong>${record.method}</strong> ${escape(record.url)}</p>
  <div class="columns"><section><h3>요청 본문</h3><pre>${escape(pretty(record.request))}</pre></section>
  <section><h3>실제 응답</h3><pre>${escape(pretty(record.response))}</pre></section></div>
  </article>`).join("\n");
await writeFile(path.join(output, "http-report.html"), `<!doctype html><html lang="ko">
<meta charset="utf-8"><title>6주차 API 실제 HTTP 검증 기록</title>
<style>body{font:16px/1.6 system-ui,sans-serif;margin:36px auto;padding:0 24px;max-width:1180px;background:#f3f5f8;color:#172033}
article{background:white;border:1px solid #dae0ea;border-radius:12px;margin:24px 0;padding:24px;break-inside:avoid}
h1{font-size:28px}h2{font-size:20px;margin:0 0 12px}b{float:right;color:#146349}h3{font-size:14px}
.columns{display:grid;grid-template-columns:1fr 1fr;gap:20px}pre{white-space:pre-wrap;overflow-wrap:anywhere;background:#f4f6fa;padding:18px;border-radius:8px;font:14px/1.6 Consolas,monospace}
p{overflow-wrap:anywhere} @media(max-width:700px){.columns{grid-template-columns:1fr}b{float:none}}</style>
<h1>6주차 API 실제 HTTP 검증 기록</h1>
<p>Spring Boot demo 프로필 · H2 임시 DB · ${escape(capturedAt)}</p>
<p>실행 중인 서버에 전송한 실제 HTTP 요청·응답입니다. Postman 캡처나 MySQL 실행 결과가 아닙니다.
비밀번호는 실습용 더미 값이며 회원가입 응답에는 포함되지 않습니다.</p>${cards}</html>`);
console.log(`${records.length}개 실제 HTTP 검증 통과. 기록: ${output}`);
