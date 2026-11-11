import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const baseUrl = process.argv[2] || 'http://localhost:8080';
const expiryMode = process.argv.includes('--expiry');
const runId = Date.now().toString();
const password = 'Umc!1234';
const emailA = `a+${runId}@umc.com`;
const emailB = `b+${runId}@umc.com`;
const nicknameA = `A${runId.slice(-9)}`;
const nicknameB = `B${runId.slice(-9)}`;
const records = [];

async function call(step, method, path, body, token, expectedStatus, expectedCode) {
    const response = await fetch(baseUrl + path, {
        method,
        headers: {
            ...(body ? { 'Content-Type': 'application/json' } : {}),
            ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        ...(body ? { body: JSON.stringify(body) } : {}),
        signal: AbortSignal.timeout(15000)
    });
    const data = await response.json();
    assert.equal(response.status, expectedStatus, `${step}: ${JSON.stringify(data)}`);
    if (expectedCode) {
        assert.equal(data.code, expectedCode, step);
        assert.equal(data.isSuccess, expectedStatus < 400, step);
    }
    const safeResponse = structuredClone(data);
    if (safeResponse.result?.accessToken) safeResponse.result.accessToken = '[실습 토큰 생략]';
    records.push({ step, at: new Date().toISOString(), method, path,
        request: body ? { ...body, ...(body.password ? { password: '[실습 비밀번호 생략]' } : {}) } : null,
        authorization: token ? 'Bearer [생략]' : null, status: response.status, response: safeResponse });
    console.log(`${step}: ${response.status} / ${data.code || 'Spring 기본 오류 응답'}`);
    return data;
}

await call('1-A 회원가입', 'POST', '/members', { email: emailA, password, nickname: nicknameA }, null, 201, 'COMMON201');
if (!expiryMode) await call('1-B 회원가입', 'POST', '/members', { email: emailB, password, nickname: nicknameB }, null, 201, 'COMMON201');
const loginA = await call('2-A 로그인', 'POST', '/auth/login', { email: emailA, password }, null, 200, 'COMMON200');
const tokenA = loginA.result.accessToken;
const claims = JSON.parse(Buffer.from(tokenA.split('.')[1], 'base64url').toString());
assert.equal(claims.email, emailA);
assert.ok(Number(claims.sub) > 0);

if (expiryMode) {
    assert.equal(claims.exp - claims.iat, 60, '만료 실습 서버는 JWT_ACCESS_EXPIRATION=60이어야 합니다.');
    await call('만료 전', 'GET', '/members/me', null, tokenA, 200, 'COMMON200');
    while (Date.now() < claims.exp * 1000 + 1500) {
        const remaining = claims.exp * 1000 + 1500 - Date.now();
        console.log(`만료 대기: ${Math.ceil(remaining / 1000)}초`);
        await new Promise(resolve => setTimeout(resolve, Math.min(15000, remaining)));
    }
    await call('만료 후', 'GET', '/members/me', null, tokenA, 401, 'AUTH401_4');
    await call('토큰 없음과 비교', 'GET', '/members/me', null, null, 401, 'AUTH401_2');
} else {
    const tokenB = (await call('2-B 로그인', 'POST', '/auth/login', { email: emailB, password }, null, 200, 'COMMON200')).result.accessToken;
    const createBody = { movieId: 99007, score: 5, comment: '7주차 미션 등록' };
    const created = await call('3 본인 평점 등록', 'POST', '/ratings', createBody, tokenA, 201, 'COMMON201');
    const ratingId = created.result.ratingId;
    assert.ok(ratingId > 0);
    assert.ok(created.result.createdAt);
    assert.equal(created.result.movieId, createBody.movieId);
    await call('4 중복 등록', 'POST', '/ratings', createBody, tokenA, 409, 'RATING409_1');
    const updated = await call('5 본인 수정', 'PATCH', `/ratings/${ratingId}`, { score: 3, comment: '본인 수정' }, tokenA, 200, 'COMMON200');
    assert.equal(updated.result.score, 3);
    await call('6 남의 평점 수정', 'PATCH', `/ratings/${ratingId}`, { score: 1 }, tokenB, 403, 'RATING403_1');
    await call('7 토큰 없이 수정', 'PATCH', `/ratings/${ratingId}`, { score: 1 }, null, 401, 'AUTH401_2');
    await call('8 없는 평점 삭제', 'DELETE', '/ratings/99999', null, tokenA, 404, 'RATING404_1');
    await call('9 본인 삭제', 'DELETE', `/ratings/${ratingId}`, null, tokenA, 200, 'COMMON200');
    await call('추가 삭제 여부 확인', 'DELETE', `/ratings/${ratingId}`, null, tokenA, 404, 'RATING404_1');
    await call('추가 내 정보: 토큰 없음', 'GET', '/members/me', null, null, 401, 'AUTH401_2');
    const me = await call('추가 내 정보: 정상 토큰', 'GET', '/members/me', null, tokenA, 200, 'COMMON200');
    assert.equal(me.result.email, emailA);
    assert.equal('password' in me.result, false);
    const index = tokenA.indexOf('.') + 10;
    const tampered = tokenA.slice(0, index) + (tokenA[index] === 'A' ? 'B' : 'A') + tokenA.slice(index + 1);
    await call('추가 payload 한 글자 변조', 'GET', '/members/me', null, tampered, 401, 'AUTH401_3');
    await call('추가 닉네임 변경', 'PATCH', '/members/me', { nickname: `변경${runId.slice(-8)}` }, tokenA, 200, 'COMMON200');
    await call('추가 동일 닉네임 유지', 'PATCH', '/members/me', { nickname: `변경${runId.slice(-8)}` }, tokenA, 200, 'COMMON200');
    await call('추가 타인 닉네임 중복', 'PATCH', '/members/me', { nickname: nicknameB }, tokenA, 409, 'MEMBER409_1');
    await call('추가 닉네임 검증', 'PATCH', '/members/me', { nickname: '가' }, tokenA, 400, 'COMMON4001');
    const unknown = await call('추가 없는 이메일', 'POST', '/auth/login', { email: `unknown+${runId}@umc.com`, password }, null, 401, 'AUTH401_1');
    const wrong = await call('추가 틀린 비밀번호', 'POST', '/auth/login', { email: emailA, password: 'wrong' }, null, 401, 'AUTH401_1');
    assert.deepEqual(unknown, wrong);
    await call('추가 이전 평점 등록 경로 폐기', 'POST', `/members/${claims.sub}/ratings`, createBody, tokenA, 405, null);
}

const outDir = fileURLToPath(new URL('../docs/evidence/week7/', import.meta.url));
await mkdir(outDir, { recursive: true });
const file = `${outDir}/${expiryMode ? 'expiry-results' : 'http-results'}.json`;
await writeFile(file, JSON.stringify({ baseUrl, verifiedAt: new Date().toISOString(),
    method: 'Node.js fetch: 실제 로컬 HTTP 호출 (Postman UI 캡처 아님)', claims, records }, null, 2) + '\n');
console.log(`검증 ${records.length}건 통과. 기록: ${file}`);
