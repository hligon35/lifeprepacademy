export async function handleResumeContext(request, env) {
  if ((request.headers.get("Origin")||"") !== "https://mlsregistration.lifeprepacademyfoundation.com") return j({ok:false,error:"Origin not allowed"},403);
  const body=await request.json().catch(()=>null);
  if(!body?.resumeToken)return j({ok:false,error:"Missing resumeToken"},400);
  return callApp(env,{action:"resume_context",resumeToken:body.resumeToken});
}
export async function handleResumeComplete(request, env) {
  if ((request.headers.get("Origin")||"") !== "https://mlsregistration.lifeprepacademyfoundation.com") return j({ok:false,error:"Origin not allowed"},403);
  const body=await request.json().catch(()=>null);
  if(!body?.resumeToken||!body?.registrationSubmissionId)return j({ok:false,error:"Missing completion data"},400);
  return callApp(env,{action:"resume_complete",resumeToken:body.resumeToken,registrationSubmissionId:body.registrationSubmissionId});
}
async function callApp(env,payload){
  const url=String(env.CONTINUATION_WEB_APP_URL||"").trim(), secret=String(env.CONTINUATION_WORKER_SHARED_SECRET||"").trim();
  if(!/^https:\/\/script\.google\.com\//i.test(url)||!secret)return j({ok:false,error:"Continuation service is not configured"},503);
  const r=await fetch(url,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({...payload,sharedSecret:secret}),redirect:"follow"});
  const text=await r.text();let parsed;try{parsed=JSON.parse(text);}catch{return j({ok:false,error:"Continuation service returned unreadable data"},502);}
  return j(parsed,r.ok?200:r.status);
}
function j(v,status=200){return new Response(JSON.stringify(v),{status,headers:{"Content-Type":"application/json","Cache-Control":"no-store","X-Robots-Tag":"noindex, nofollow, noarchive"}});}