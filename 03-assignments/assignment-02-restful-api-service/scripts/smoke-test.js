// End-to-end check of the full complaint life cycle.
// Run the server (npm start) in one terminal, then: npm run smoke
const BASE = process.env.API_URL || 'http://localhost:8080/api';
const stamp = Date.now();
let pass = 0, fail = 0;

async function req(method, path, { user, body } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (user) headers['X-User-Id'] = user;
  const res = await fetch(BASE + path, { method, headers, body: body && JSON.stringify(body) });
  const text = await res.text();
  return { status: res.status, json: text ? JSON.parse(text) : null };
}

function expect(label, actual, wanted) {
  const ok = actual === wanted;
  ok ? pass++ : fail++;
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${label}${ok ? '' : `  (got ${actual}, wanted ${wanted})`}`);
}

async function makeUser(role, extra) {
  const r = await req('POST', '/users', { body: { name: `${role} ${stamp}`, role, email: `${role}${stamp}@test.com`, ...extra } });
  return r.json.data._id;
}

(async () => {
  const student = await makeUser('student', { roomNo: 'C-101' });
  const other = await makeUser('student', { roomNo: 'C-102', email: `other${stamp}@test.com` });
  const warden = await makeUser('warden');
  const electrician = await makeUser('staff', { skill: 'Electrical' });
  const plumber = await makeUser('staff', { skill: 'Plumbing', email: `plumber${stamp}@test.com` });

  expect('student without room number is rejected', (await req('POST', '/users', { body: { name: 'X', role: 'student', email: `x${stamp}@t.com` } })).status, 400);
  expect('no X-User-Id -> 401', (await req('GET', '/complaints')).status, 401);

  let r = await req('POST', '/complaints', { user: student, body: { title: 'Fan not working', description: 'Ceiling fan stopped last night', category: 'Electrical', priority: 'High' } });
  expect('student raises complaint -> 201', r.status, 201);
  const id = r.json.data._id;
  expect('ticket number generated', /^HC-\d{4}-\d{4}$/.test(r.json.data.ticketNo), true);
  expect('room number copied from student', r.json.data.roomNo, 'C-101');

  expect('invalid complaint -> 400', (await req('POST', '/complaints', { user: student, body: { title: 'Hi', category: 'Garden' } })).status, 400);
  expect('warden cannot raise complaints -> 403', (await req('POST', '/complaints', { user: warden, body: { title: 'Test title', description: 'x', category: 'Other' } })).status, 403);
  expect('other student cannot see it -> 403', (await req('GET', `/complaints/${id}`, { user: other })).status, 403);

  expect('assign to plumber for electrical issue -> 422', (await req('PATCH', `/complaints/${id}/assign`, { user: warden, body: { staffId: plumber } })).status, 422);
  expect('student cannot assign -> 403', (await req('PATCH', `/complaints/${id}/assign`, { user: student, body: { staffId: electrician } })).status, 403);
  r = await req('PATCH', `/complaints/${id}/assign`, { user: warden, body: { staffId: electrician } });
  expect('warden assigns electrician', r.json.data.status, 'Assigned');

  expect('plumber cannot update it -> 403', (await req('PATCH', `/complaints/${id}/status`, { user: plumber, body: { status: 'InProgress' } })).status, 403);
  expect('skipping to Resolved -> 409', (await req('PATCH', `/complaints/${id}/status`, { user: electrician, body: { status: 'Resolved' } })).status, 409);
  expect('electrician starts work', (await req('PATCH', `/complaints/${id}/status`, { user: electrician, body: { status: 'InProgress' } })).json.data.status, 'InProgress');
  expect('electrician comments -> 201', (await req('POST', `/complaints/${id}/comments`, { user: electrician, body: { text: 'Capacitor replaced' } })).status, 201);
  expect('electrician resolves', (await req('PATCH', `/complaints/${id}/status`, { user: electrician, body: { status: 'Resolved' } })).json.data.status, 'Resolved');

  expect('rating before closing -> 409', (await req('POST', `/complaints/${id}/rating`, { user: student, body: { rating: 5 } })).status, 409);
  expect('student reopens', (await req('PATCH', `/complaints/${id}/status`, { user: student, body: { status: 'Open' } })).json.data.status, 'Open');

  await req('PATCH', `/complaints/${id}/assign`, { user: warden, body: { staffId: electrician } });
  await req('PATCH', `/complaints/${id}/status`, { user: electrician, body: { status: 'InProgress' } });
  await req('PATCH', `/complaints/${id}/status`, { user: electrician, body: { status: 'Resolved' } });
  expect('student closes', (await req('PATCH', `/complaints/${id}/status`, { user: student, body: { status: 'Closed' } })).json.data.status, 'Closed');
  expect('student rates 4', (await req('POST', `/complaints/${id}/rating`, { user: student, body: { rating: 4 } })).json.data.rating, 4);
  expect('comment on closed -> 409', (await req('POST', `/complaints/${id}/comments`, { user: student, body: { text: 'thanks' } })).status, 409);

  r = await req('GET', `/complaints/${id}`, { user: student });
  expect('history has 9 entries', r.json.data.history.length, 9);

  r = await req('POST', '/complaints', { user: other, body: { title: 'Wifi very slow', description: 'Speed drops every evening', category: 'Internet' } });
  const id2 = r.json.data._id;
  expect('student lists only own complaints', (await req('GET', '/complaints', { user: other })).json.total, 1);
  expect('withdraw open complaint -> 204', (await req('DELETE', `/complaints/${id2}`, { user: other })).status, 204);

  r = await req('GET', '/complaints/summary', { user: warden });
  expect('warden summary works', r.status, 200);
  expect('student cannot view summary -> 403', (await req('GET', '/complaints/summary', { user: student })).status, 403);
  expect('bad id -> 400', (await req('GET', '/complaints/abc', { user: warden })).status, 400);

  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})().catch(err => {
  console.error('Smoke test could not run. Is the server up?', err.message);
  process.exit(1);
});
